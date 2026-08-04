"""
Caso de uso: Aprobar una solicitud de préstamo (admin).
"""

from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface
from apps.loans.infrastructure.models import LoanItemModel


class ApproveLoanUseCase:
    """Caso de uso para aprobar una solicitud de préstamo."""

    def __init__(
        self,
        loan_repository: LoanRepositoryInterface,
        equipment_repository: EquipmentRepositoryInterface,
    ):
        self.loan_repository = loan_repository
        self.equipment_repository = equipment_repository

    def execute(self, loan_id: str) -> Loan:
        """
        Aprueba una solicitud de préstamo.
        Esto cambia los LoanItems de RESERVED a LOANED (reserva confirmada).
        """
        loan = self.loan_repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status != LoanStatus.PENDING:
            raise InvalidLoanStatusError(
                f"No se puede aprobar un préstamo en estado '{loan.status}'"
            )

        # Aprobar el préstamo
        loan.approve()
        saved_loan = self.loan_repository.save(loan)

        # Actualizar los LoanItems de RESERVED a LOANED
        loan_items = LoanItemModel.objects.filter(loan_id=loan_id)
        for item in loan_items:
            item.status = 'LOANED'
            item.save()
            
            # Actualizar el equipo a LOANED (reserva confirmada)
            equipment = self.equipment_repository.get_by_id(str(item.equipment_id))
            if equipment:
                equipment.mark_as_loaned()
                self.equipment_repository.save(equipment)

        return saved_loan