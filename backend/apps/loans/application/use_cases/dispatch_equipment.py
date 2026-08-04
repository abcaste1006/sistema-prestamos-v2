"""
Caso de uso: Despachar equipos de un préstamo aprobado (admin).
"""

from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface
from apps.loans.infrastructure.models import LoanItemModel
from django.utils import timezone


class DispatchEquipmentUseCase:
    """Caso de uso para despachar equipos de un préstamo aprobado."""

    def __init__(self, repository: LoanRepositoryInterface):
        self.repository = repository

    def execute(self, loan_id: str) -> Loan:
        """
        Marca un préstamo como despachado (equipos entregados físicamente).
        Esto confirma que los equipos salieron de bodega.
        """
        loan = self.repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status != LoanStatus.APPROVED:
            raise InvalidLoanStatusError(
                f"No se puede despachar un préstamo en estado '{loan.status}'"
            )

        # Dispatch cambia el estado a ACTIVE
        loan.dispatch()
        saved_loan = self.repository.save(loan)

        # Actualizar LoanItems a LOANED (ya deberían estar, pero aseguramos)
        LoanItemModel.objects.filter(loan_id=loan_id, status='RESERVED').update(
            status='LOANED'
        )

        return saved_loan