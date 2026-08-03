"""
Caso de uso: Obtener detalle de un préstamo.
"""

from typing import Optional
from apps.loans.domain.entities import Loan
from apps.loans.domain.exceptions import LoanNotFoundError
from apps.loans.interfaces.repositories import LoanRepositoryInterface


class GetLoanDetailUseCase:
    """Caso de uso para obtener el detalle de un préstamo."""

    def __init__(self, repository: LoanRepositoryInterface):
        self.repository = repository

    def execute(self, loan_id: str, user_id: Optional[str] = None) -> Loan:
        """
        Obtiene un préstamo por su ID.

        Args:
            loan_id: ID del préstamo
            user_id: ID del usuario (opcional, para verificar permisos)

        Returns:
            Loan: El préstamo encontrado

        Raises:
            LoanNotFoundError: Si el préstamo no existe
        """
        loan = self.repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        # Si se proporciona user_id, verificar que el préstamo pertenezca al usuario
        if user_id and loan.user_id != user_id:
            raise PermissionError("No tienes permiso para ver este préstamo")

        return loan