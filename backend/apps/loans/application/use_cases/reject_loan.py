"""
Caso de uso: Rechazar una solicitud de préstamo (admin).
"""

from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface


class RejectLoanUseCase:
    """Caso de uso para rechazar una solicitud de préstamo."""

    def __init__(self, repository: LoanRepositoryInterface):
        self.repository = repository

    def execute(self, loan_id: str, reason: str) -> Loan:
        """
        Rechaza una solicitud de préstamo.

        Args:
            loan_id: ID del préstamo a rechazar
            reason: Motivo del rechazo

        Returns:
            Loan: El préstamo rechazado

        Raises:
            LoanNotFoundError: Si el préstamo no existe
            InvalidLoanStatusError: Si el préstamo no está pendiente
        """
        loan = self.repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status != LoanStatus.PENDING:
            raise InvalidLoanStatusError(
                f"No se puede rechazar un préstamo en estado '{loan.status}'"
            )

        loan.reject(reason)
        return self.repository.save(loan)