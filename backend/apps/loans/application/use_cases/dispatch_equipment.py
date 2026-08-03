"""
Caso de uso: Despachar equipos de un préstamo aprobado (admin).
"""

from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface


class DispatchEquipmentUseCase:
    """Caso de uso para despachar equipos de un préstamo aprobado."""

    def __init__(self, repository: LoanRepositoryInterface):
        self.repository = repository

    def execute(self, loan_id: str) -> Loan:
        """
        Marca un préstamo como despachado (equipos entregados).

        Args:
            loan_id: ID del préstamo a despachar

        Returns:
            Loan: El préstamo despachado

        Raises:
            LoanNotFoundError: Si el préstamo no existe
            InvalidLoanStatusError: Si el préstamo no está aprobado
        """
        loan = self.repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status != LoanStatus.APPROVED:
            raise InvalidLoanStatusError(
                f"No se puede despachar un préstamo en estado '{loan.status}'"
            )

        loan.dispatch()
        return self.repository.save(loan)