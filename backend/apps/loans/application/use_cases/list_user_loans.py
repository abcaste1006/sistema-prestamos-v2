"""
Caso de uso: Listar préstamos de un usuario.
"""

from typing import List
from apps.loans.domain.entities import Loan
from apps.loans.interfaces.repositories import LoanRepositoryInterface


class ListUserLoansUseCase:
    """Caso de uso para listar préstamos de un usuario."""

    def __init__(self, repository: LoanRepositoryInterface):
        self.repository = repository

    def execute(self, user_id: str) -> List[Loan]:
        """
        Lista todos los préstamos de un usuario.

        Args:
            user_id: ID del usuario

        Returns:
            List[Loan]: Lista de préstamos del usuario
        """
        return self.repository.list_by_user(user_id)