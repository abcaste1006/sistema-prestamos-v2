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
from apps.loans.application.services.availability_service import AvailabilityService


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
        """
        # Validar términos
        if not terms_accepted:
            raise LoanTermsNotAcceptedError("Debes aceptar los términos y condiciones")

        # Validar fechas
        today = timezone.now().date()

        if pickup_date < today:
            raise PickupDateInvalidError("La fecha de retiro no puede ser en el pasado")
        if return_date <= pickup_date:
            raise ReturnDateInvalidError("La fecha de devolución debe ser posterior a la fecha de retiro")

        # Convertir horas a objetos time
        pickup_time_obj = datetime.strptime(pickup_time, "%H:%M").time()
        return_time_obj = datetime.strptime(return_time, "%H:%M").time()

        # Validar disponibilidad de equipos
        loan_items = []
        unavailable_equipments = []

        for equipment_id in equipment_ids:
            # Obtener el equipo
            equipment = self.equipment_repository.get_by_id(equipment_id)
            if not equipment:
                unavailable_equipments.append(f"Equipo con ID '{equipment_id}' no encontrado")
                continue

            # Validar disponibilidad real usando el servicio
            # ⚠️ CORREGIDO: Ahora recibe 3 valores (available, reason, conflicts)
            available, reason, conflicts = AvailabilityService.is_equipment_available(
                equipment_id=equipment_id,
                pickup_date=pickup_date,
                return_date=return_date,
                pickup_time=pickup_time_obj,
                return_time=return_time_obj
            )

            if not available:
                unavailable_equipments.append(f"{equipment.name}: {reason}")
                continue

            loan_items.append(LoanItem(
                equipment_id=equipment_id,
                equipment_name=equipment.name,
            ))

        # Si hay equipos no disponibles, lanzar error con detalles
        if unavailable_equipments:
            raise EquipmentAlreadyLoanedError(
                f"Los siguientes equipos no están disponibles: {', '.join(unavailable_equipments)}"
            )

        # Validar que al menos un equipo esté disponible
        if not loan_items:
            raise EquipmentAlreadyLoanedError("No hay equipos disponibles para el préstamo")

        # Crear agenda tentativa para los equipos seleccionados
        try:
            tentative_schedules = AvailabilityService.create_tentative_schedule(
                user_id=user_id,
                equipment_ids=equipment_ids,
                pickup_date=pickup_date,
                return_date=return_date,
                pickup_time=pickup_time_obj,
                return_time=return_time_obj,
                expires_minutes=30
            )
        except Exception as e:
            print(f"Error al crear agenda tentativa: {e}")
            tentative_schedules = []

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

        # Guardar el préstamo
        saved_loan = self.loan_repository.save(loan)

        # Confirmar las agendas tentativas asociando al préstamo
        for tentative in tentative_schedules:
            AvailabilityService.confirm_tentative_schedule(tentative.id, saved_loan.id)

        return saved_loan