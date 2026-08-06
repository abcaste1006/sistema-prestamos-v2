"""
Caso de uso: Recepción parcial de equipos (admin).
Permite marcar equipos como devueltos individualmente con su estado.
"""

from typing import Optional
from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface
from apps.loans.infrastructure.models import LoanItemModel
from django.utils import timezone


class ReceiveEquipmentUseCase:
    """Caso de uso para recepción parcial de equipos."""

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
        return_status: str,  # OK, DAMAGED, MISSING, LATE
        return_notes: Optional[str] = None,
    ) -> Loan:
        """
        Marca un equipo como recibido con su estado específico.
        """
        loan = self.loan_repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status not in [LoanStatus.ACTIVE, LoanStatus.OVERDUE]:
            raise InvalidLoanStatusError(
                f"No se puede recibir equipos de un préstamo en estado '{loan.status}'"
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

        # Marcar como recibido
        loan_item.is_returned = True
        loan_item.returned_at = timezone.now()
        loan_item.return_status = return_status
        loan_item.return_notes = return_notes
        loan_item.status = 'RETURNED'
        loan_item.save()

        # Liberar el equipo (cambiarlo a AVAILABLE)
        equipment = self.equipment_repository.get_by_id(equipment_id)
        if equipment:
            equipment.mark_as_available()
            self.equipment_repository.save(equipment)

        # Si el equipo está dañado o faltante, marcar el préstamo como OVERDUE o con disputa
        if return_status in ['DAMAGED', 'MISSING']:
            # Por ahora solo guardamos la nota, luego implementaremos disputas
            pass

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