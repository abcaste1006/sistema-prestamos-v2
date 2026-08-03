"""
Caso de uso: Aprobar una solicitud de préstamo (admin).
"""

from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface


class ApproveLoanUseCase:
    """Caso de uso para aprobar una solicitud de préstamo."""

    def __init__(self, repository: LoanRepositoryInterface):
        self.repository = repository

    def execute(self, loan_id: str) -> Loan:
        """
        Aprueba una solicitud de préstamo.

        Args:
            loan_id: ID del préstamo a aprobar

        Returns:
            Loan: El préstamo aprobado

        Raises:
            LoanNotFoundError: Si el préstamo no existe
            InvalidLoanStatusError: Si el préstamo no está pendiente
        """
        loan = self.repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status != LoanStatus.PENDING:
            raise InvalidLoanStatusError(
                f"No se puede aprobar un préstamo en estado '{loan.status}'"
            )

        loan.approve()
        return self.repository.save(loan)