"""
Caso de uso: Devolver equipos de un préstamo (admin).
"""

from typing import Optional
from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface
from apps.loans.infrastructure.models import LoanItemModel
from django.utils import timezone


class ReturnEquipmentUseCase:
    """Caso de uso para devolver equipos de un préstamo."""

    def __init__(
        self,
        loan_repository: LoanRepositoryInterface,
        equipment_repository: EquipmentRepositoryInterface,
    ):
        self.loan_repository = loan_repository
        self.equipment_repository = equipment_repository

    def execute(
        self,
        loan_id: str,
        equipment_id: str,
        condition_notes: Optional[str] = None,
    ) -> Loan:
        """
        Marca un equipo específico como devuelto y lo libera.
        Cambia LoanItem de LOANED a RETURNED y equipo a AVAILABLE.
        """
        loan = self.loan_repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status not in [LoanStatus.ACTIVE, LoanStatus.OVERDUE]:
            raise InvalidLoanStatusError(
                f"No se puede devolver equipos de un préstamo en estado '{loan.status}'"
            )

        # Obtener el LoanItem
        try:
            loan_item = LoanItemModel.objects.get(
                loan_id=loan_id,
                equipment_id=equipment_id
            )
        except LoanItemModel.DoesNotExist:
            raise ValueError(f"Equipo con ID '{equipment_id}' no encontrado en el préstamo")

        if loan_item.is_returned:
            raise ValueError(f"El equipo ya fue devuelto")

        # Marcar como devuelto
        loan_item.is_returned = True
        loan_item.returned_at = timezone.now()
        loan_item.condition_notes = condition_notes
        loan_item.status = 'RETURNED'
        loan_item.save()

        # Liberar el equipo (cambiarlo a AVAILABLE)
        equipment = self.equipment_repository.get_by_id(equipment_id)
        if equipment:
            equipment.mark_as_available()
            self.equipment_repository.save(equipment)

        # Verificar si todos los items están devueltos
        all_returned = LoanItemModel.objects.filter(
            loan_id=loan_id,
            is_returned=False
        ).count() == 0

        if all_returned:
            # Obtener el préstamo actualizado y marcar como RETURNED
            loan = self.loan_repository.get_by_id(loan_id)
            loan.mark_as_returned()
            return self.loan_repository.save(loan)

        return loan