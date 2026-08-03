"""
Implementación de repositorios para el módulo de préstamos.
"""

from typing import Optional, List
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from apps.loans.domain.entities import Loan, LoanItem, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError
from apps.loans.interfaces.repositories import (
    LoanRepositoryInterface,
    LoanItemRepositoryInterface,
)
from .models import LoanModel, LoanItemModel


class LoanRepository(LoanRepositoryInterface):
    """Repositorio para préstamos usando Django ORM."""

    def save(self, loan: Loan) -> Loan:
        """Guarda un préstamo con sus items."""
        with transaction.atomic():
            # Guardar el préstamo
            loan_model, created = LoanModel.objects.update_or_create(
                id=loan.id,
                defaults={
                    'user_id': loan.user_id,
                    'status': loan.status.value,
                    'requested_at': loan.requested_at,
                    'approved_at': loan.approved_at,
                    'rejected_at': loan.rejected_at,
                    'rejected_reason': loan.rejected_reason,
                    'dispatched_at': loan.dispatched_at,
                    'returned_at': loan.returned_at,
                    'pickup_date': loan.pickup_date,
                    'return_date': loan.return_date,
                    'pickup_time': loan.pickup_time,
                    'return_time': loan.return_time,
                    'notes': loan.notes,
                    'terms_accepted': loan.terms_accepted,
                    'terms_accepted_at': loan.terms_accepted_at,
                }
            )

            # Guardar los items (si existen)
            if loan.items:
                # Eliminar items existentes para evitar duplicados
                LoanItemModel.objects.filter(loan=loan_model).delete()
                for item in loan.items:
                    LoanItemModel.objects.create(
                        loan=loan_model,
                        equipment_id=item.equipment_id,
                        is_returned=item.is_returned,
                        returned_at=item.returned_at,
                        condition_notes=item.condition_notes,
                    )

            return self._to_domain(loan_model)

    def get_by_id(self, loan_id: str) -> Optional[Loan]:
        """Obtiene un préstamo por su ID con sus items."""
        try:
            loan_model = LoanModel.objects.get(id=loan_id)
            return self._to_domain(loan_model)
        except ObjectDoesNotExist:
            return None

    def list_by_user(self, user_id: str) -> List[Loan]:
        """Lista préstamos de un usuario específico."""
        loan_models = LoanModel.objects.filter(user_id=user_id)
        return [self._to_domain(model) for model in loan_models]

    def list_by_status(self, status: LoanStatus) -> List[Loan]:
        """Lista préstamos por estado."""
        loan_models = LoanModel.objects.filter(status=status.value)
        return [self._to_domain(model) for model in loan_models]

    def list_pending(self) -> List[Loan]:
        """Lista préstamos pendientes de aprobación."""
        return self.list_by_status(LoanStatus.PENDING)

    def list_active(self) -> List[Loan]:
        """Lista préstamos activos (en uso)."""
        return self.list_by_status(LoanStatus.ACTIVE)

    def list_overdue(self) -> List[Loan]:
        """Lista préstamos vencidos."""
        return self.list_by_status(LoanStatus.OVERDUE)

    def list_approved_ready_for_dispatch(self) -> List[Loan]:
        """Lista préstamos aprobados listos para despachar."""
        loan_models = LoanModel.objects.filter(status=LoanStatus.APPROVED.value)
        return [self._to_domain(model) for model in loan_models]

    def _to_domain(self, model: LoanModel) -> Loan:
        """Convierte un modelo ORM a una entidad de dominio."""
        loan = Loan(
            id=str(model.id),
            user_id=str(model.user_id),
            user_name=model.user.get_full_name() if hasattr(model.user, 'get_full_name') else '',
            user_email=model.user.email,
            status=LoanStatus(model.status),
            requested_at=model.requested_at,
            approved_at=model.approved_at,
            rejected_at=model.rejected_at,
            rejected_reason=model.rejected_reason,
            dispatched_at=model.dispatched_at,
            returned_at=model.returned_at,
            pickup_date=model.pickup_date,
            return_date=model.return_date,
            pickup_time=model.pickup_time,
            return_time=model.return_time,
            notes=model.notes,
            terms_accepted=model.terms_accepted,
            terms_accepted_at=model.terms_accepted_at,
        )

        # Cargar items
        items = LoanItemModel.objects.filter(loan=model)
        for item_model in items:
            loan.items.append(LoanItem(
                id=str(item_model.id),
                loan_id=str(item_model.loan_id),
                equipment_id=str(item_model.equipment_id),
                equipment_name=item_model.equipment.name if item_model.equipment else '',
                is_returned=item_model.is_returned,
                returned_at=item_model.returned_at,
                condition_notes=item_model.condition_notes,
            ))

        return loan


class LoanItemRepository(LoanItemRepositoryInterface):
    """Repositorio para items de préstamo usando Django ORM."""

    def save(self, item: LoanItem) -> LoanItem:
        """Guarda un item de préstamo."""
        item_model, created = LoanItemModel.objects.update_or_create(
            id=item.id,
            defaults={
                'loan_id': item.loan_id,
                'equipment_id': item.equipment_id,
                'is_returned': item.is_returned,
                'returned_at': item.returned_at,
                'condition_notes': item.condition_notes,
            }
        )
        return self._to_domain(item_model)

    def get_by_loan_id(self, loan_id: str) -> List[LoanItem]:
        """Obtiene todos los items de un préstamo."""
        item_models = LoanItemModel.objects.filter(loan_id=loan_id)
        return [self._to_domain(model) for model in item_models]

    def get_by_equipment_id(self, equipment_id: str) -> List[LoanItem]:
        """Obtiene todos los items asociados a un equipo."""
        item_models = LoanItemModel.objects.filter(equipment_id=equipment_id)
        return [self._to_domain(model) for model in item_models]

    def _to_domain(self, model: LoanItemModel) -> LoanItem:
        """Convierte un modelo ORM a una entidad de dominio."""
        return LoanItem(
            id=str(model.id),
            loan_id=str(model.loan_id),
            equipment_id=str(model.equipment_id),
            equipment_name=model.equipment.name if model.equipment else '',
            is_returned=model.is_returned,
            returned_at=model.returned_at,
            condition_notes=model.condition_notes,
        )