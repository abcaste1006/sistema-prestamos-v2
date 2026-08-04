"""
Caso de uso: Rechazar una solicitud de préstamo (admin).
"""

from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface
from apps.loans.infrastructure.models import LoanItemModel


class RejectLoanUseCase:
    """Caso de uso para rechazar una solicitud de préstamo."""

    def __init__(
        self, 
        loan_repository: LoanRepositoryInterface,
        equipment_repository: EquipmentRepositoryInterface
    ):
        self.loan_repository = loan_repository
        self.equipment_repository = equipment_repository

    def execute(self, loan_id: str, reason: str) -> Loan:
        """
        Rechaza una solicitud de préstamo y libera los equipos.
        Cambia LoanItems de RESERVED a RETURNED (cancelado) y equipos a AVAILABLE.
        """
        loan = self.loan_repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status != LoanStatus.PENDING:
            raise InvalidLoanStatusError(
                f"No se puede rechazar un préstamo en estado '{loan.status}'"
            )

        # Rechazar el préstamo
        loan.reject(reason)
        saved_loan = self.loan_repository.save(loan)

        # Actualizar LoanItems a RETURNED (cancelado)
        loan_items = LoanItemModel.objects.filter(loan_id=loan_id)
        for item in loan_items:
            item.status = 'RETURNED'
            item.is_returned = True
            item.returned_at = timezone.now()
            item.condition_notes = f"Cancelado por rechazo: {reason}"
            item.save()
            
            # Liberar los equipos (cambiarlos a AVAILABLE)
            equipment = self.equipment_repository.get_by_id(str(item.equipment_id))
            if equipment:
                equipment.mark_as_available()
                self.equipment_repository.save(equipment)

        return saved_loan