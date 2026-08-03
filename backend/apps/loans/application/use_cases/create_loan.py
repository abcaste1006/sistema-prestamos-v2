"""
Caso de uso: Crear una solicitud de préstamo.
"""

from typing import List, Optional
from datetime import datetime, date
from django.utils import timezone
from apps.loans.domain.entities import Loan, LoanStatus, LoanItem
from apps.loans.domain.exceptions import (
    EquipmentAlreadyLoanedError,
    LoanTermsNotAcceptedError,
    PickupDateInvalidError,
    ReturnDateInvalidError,
)
from apps.loans.interfaces.repositories import LoanRepositoryInterface
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface


class CreateLoanUseCase:
    """Caso de uso para crear una solicitud de préstamo."""

    def __init__(
        self,
        loan_repository: LoanRepositoryInterface,
        equipment_repository: EquipmentRepositoryInterface,
    ):
        self.loan_repository = loan_repository
        self.equipment_repository = equipment_repository

    def execute(
        self,
        user_id: str,
        user_name: str,
        user_email: str,
        equipment_ids: List[str],
        pickup_date: date,
        return_date: date,
        pickup_time: str,
        return_time: str,
        terms_accepted: bool = False,
        notes: Optional[str] = None,
    ) -> Loan:
        """
        Crea una nueva solicitud de préstamo.

        Args:
            user_id: ID del usuario
            user_name: Nombre del usuario
            user_email: Email del usuario
            equipment_ids: Lista de IDs de equipos
            pickup_date: Fecha de retiro
            return_date: Fecha de devolución
            pickup_time: Hora de retiro
            return_time: Hora de devolución
            terms_accepted: Indica si aceptó los términos
            notes: Notas adicionales (opcional)

        Returns:
            Loan: La solicitud de préstamo creada

        Raises:
            LoanTermsNotAcceptedError: Si no aceptó los términos
            PickupDateInvalidError: Si la fecha de retiro no es válida
            ReturnDateInvalidError: Si la fecha de devolución no es válida
            EquipmentAlreadyLoanedError: Si algún equipo no está disponible
        """
        # Validar términos
        if not terms_accepted:
            raise LoanTermsNotAcceptedError("Debes aceptar los términos y condiciones")

        # Validar fechas (convertir a date para comparar)
        today = timezone.now().date()

        if pickup_date < today:
            raise PickupDateInvalidError("La fecha de retiro no puede ser en el pasado")
        if return_date <= pickup_date:
            raise ReturnDateInvalidError("La fecha de devolución debe ser posterior a la fecha de retiro")

        # Validar disponibilidad de equipos
        loan_items = []
        for equipment_id in equipment_ids:
            equipment = self.equipment_repository.get_by_id(equipment_id)
            if not equipment:
                raise EquipmentAlreadyLoanedError(f"Equipo con ID '{equipment_id}' no encontrado")
            if equipment.status.value != 'AVAILABLE':
                raise EquipmentAlreadyLoanedError(f"El equipo '{equipment.name}' no está disponible")
            loan_items.append(LoanItem(
                equipment_id=equipment_id,
                equipment_name=equipment.name,
            ))

        # Crear préstamo
        loan = Loan(
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            status=LoanStatus.PENDING,
            items=loan_items,
            pickup_date=pickup_date,
            return_date=return_date,
            pickup_time=pickup_time,
            return_time=return_time,
            requested_at=datetime.now(),
            notes=notes,
            terms_accepted=terms_accepted,
            terms_accepted_at=datetime.now() if terms_accepted else None,
        )

        # Actualizar estado de equipos a LOANED (reservados)
        for item in loan_items:
            equipment = self.equipment_repository.get_by_id(item.equipment_id)
            if equipment:
                equipment.mark_as_loaned()
                self.equipment_repository.save(equipment)

        return self.loan_repository.save(loan)