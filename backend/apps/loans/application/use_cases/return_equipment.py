"""
Caso de uso: Devolver equipos de un préstamo (admin).
"""

from typing import Optional
from apps.loans.domain.entities import Loan, LoanStatus
from apps.loans.domain.exceptions import LoanNotFoundError, InvalidLoanStatusError
from apps.loans.interfaces.repositories import LoanRepositoryInterface
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface


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
        Marca un equipo específico como devuelto.

        Args:
            loan_id: ID del préstamo
            equipment_id: ID del equipo a devolver
            condition_notes: Notas sobre el estado del equipo (opcional)

        Returns:
            Loan: El préstamo actualizado

        Raises:
            LoanNotFoundError: Si el préstamo no existe
            InvalidLoanStatusError: Si el préstamo no está activo
        """
        loan = self.loan_repository.get_by_id(loan_id)
        if not loan:
            raise LoanNotFoundError(f"Préstamo con ID '{loan_id}' no encontrado")

        if loan.status not in [LoanStatus.ACTIVE, LoanStatus.OVERDUE]:
            raise InvalidLoanStatusError(
                f"No se puede devolver equipos de un préstamo en estado '{loan.status}'"
            )

        # Buscar el item del equipo
        item = next((i for i in loan.items if i.equipment_id == equipment_id), None)
        if not item:
            raise ValueError(f"Equipo con ID '{equipment_id}' no encontrado en el préstamo")

        if item.is_returned:
            raise ValueError(f"El equipo '{item.equipment_name}' ya fue devuelto")

        # Marcar como devuelto
        item.mark_as_returned(condition_notes)

        # Actualizar estado del equipo
        equipment = self.equipment_repository.get_by_id(equipment_id)
        if equipment:
            equipment.mark_as_available()
            self.equipment_repository.save(equipment)

        # Si todos los equipos están devueltos, marcar el préstamo como RETURNED
        if loan.all_items_returned:
            loan.mark_as_returned()

        return self.loan_repository.save(loan)