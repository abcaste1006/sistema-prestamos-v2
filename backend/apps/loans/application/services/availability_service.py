"""
Servicio de disponibilidad mejorado.
Maneja disponibilidad base + reservas + préstamos activos.
"""

from typing import List, Optional, Tuple
from datetime import date, time, datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from apps.loans.infrastructure.models import EquipmentSchedule, TentativeSchedule, BlockedDate, LoanItemModel
from apps.inventory.infrastructure.models import EquipmentModel
from apps.loans.domain.entities import LoanStatus


class AvailabilityService:
    """Servicio para gestionar la disponibilidad de equipos."""
    
    @staticmethod
    def get_equipment_schedules(equipment_id: str, day_of_week: int) -> List[EquipmentSchedule]:
        """Obtiene las franjas horarias base de un equipo para un día específico."""
        return EquipmentSchedule.objects.filter(
            equipment_id=equipment_id,
            day_of_week=day_of_week,
            is_active=True
        ).order_by('start_time')
    
    @staticmethod
    def is_equipment_available(
        equipment_id: str,
        pickup_date: date,
        return_date: date,
        pickup_time: time,
        return_time: time,
        exclude_loan_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str], Optional[List[dict]]]:
        """
        Verifica si un equipo está disponible para el período solicitado.
        
        Returns:
            Tuple[bool, Optional[str], Optional[List[dict]]]: 
            (disponible, motivo, conflictos_detallados)
        """
        conflicts = []
        
        # 1. Verificar si el equipo existe y está activo
        try:
            equipment = EquipmentModel.objects.get(id=equipment_id, is_active=True)
        except EquipmentModel.DoesNotExist:
            return False, "El equipo no existe o está inactivo", None
        
        # 2. Verificar estado del equipo (disponibilidad física)
        if equipment.status in ['MAINTENANCE', 'DAMAGED']:
            return False, f"El equipo está en estado '{equipment.get_status_display()}'", None
        
        # 3. Verificar franjas horarias base
        day_of_week = pickup_date.weekday()
        schedules = EquipmentSchedule.objects.filter(
            equipment_id=equipment_id,
            day_of_week=day_of_week,
            is_active=True
        )
        
        # Si no tiene horarios, usar horario por defecto (24/7)
        if not schedules.exists():
            # Crear horarios por defecto para el equipo
            equipment.create_default_schedules()
            schedules = EquipmentSchedule.objects.filter(
                equipment_id=equipment_id,
                day_of_week=day_of_week,
                is_active=True
            )
            
            if not schedules.exists():
                # Si aún no hay horarios, asumir 24/7
                if pickup_time > return_time:
                    return False, "El horario de retiro debe ser anterior al de devolución", None
            else:
                # Verificar que el horario solicitado esté dentro de alguna franja
                time_range_valid = False
                for schedule in schedules:
                    if schedule.start_time <= pickup_time <= schedule.end_time:
                        if schedule.start_time <= return_time <= schedule.end_time:
                            time_range_valid = True
                            break
                
                if not time_range_valid:
                    return False, "El horario solicitado no está dentro de las franjas disponibles", None
        else:
            # Verificar horario contra franjas existentes
            time_range_valid = False
            for schedule in schedules:
                if schedule.start_time <= pickup_time <= schedule.end_time:
                    if schedule.start_time <= return_time <= schedule.end_time:
                        time_range_valid = True
                        break
            
            if not time_range_valid:
                return False, "El horario solicitado no está dentro de las franjas disponibles", None
        
        # 4. Verificar días bloqueados
        blocked_dates = BlockedDate.objects.filter(
            date__range=[pickup_date, return_date],
            is_active=True
        )
        if blocked_dates.exists():
            blocked_list = [b.date for b in blocked_dates]
            return False, f"Fechas bloqueadas: {', '.join([str(d) for d in blocked_list])}", None
        
        # 5. Verificar conflictos con préstamos existentes
        # Estados que indican que el equipo está en uso o reservado
        active_statuses = ['RESERVED', 'LOANED']
        
        # Obtener todos los LoanItems de este equipo que están activos
        active_items = LoanItemModel.objects.filter(
            equipment_id=equipment_id,
            status__in=active_statuses
        ).select_related('loan')
        
        # Excluir el préstamo actual si se está editando
        if exclude_loan_id:
            active_items = active_items.exclude(loan_id=exclude_loan_id)
        
        for item in active_items:
            loan = item.loan
            
            # Verificar solapamiento de fechas
            if not (return_date < loan.pickup_date or pickup_date > loan.return_date):
                # Hay solapamiento de fechas, verificar horas
                loan_pickup = datetime.strptime(loan.pickup_time, "%H:%M").time()
                loan_return = datetime.strptime(loan.return_time, "%H:%M").time()
                
                # Verificar solapamiento de horas
                if not (return_time <= loan_pickup or pickup_time >= loan_return):
                    # Hay conflicto completo
                    conflicts.append({
                        'loan_id': str(loan.id),
                        'status': item.status,
                        'pickup_date': loan.pickup_date,
                        'return_date': loan.return_date,
                        'pickup_time': loan.pickup_time,
                        'return_time': loan.return_time,
                        'user_email': loan.user.email if loan.user else 'Desconocido',
                    })
        
        if conflicts:
            return False, f"El equipo ya está reservado para otro período", conflicts
        
        return True, None, None
    
    @staticmethod
    def create_tentative_schedule(
        user_id: str,
        equipment_ids: List[str],
        pickup_date: date,
        return_date: date,
        pickup_time: time,
        return_time: time,
        expires_minutes: int = 30
    ) -> List[TentativeSchedule]:
        """Crea agendas tentativas para los equipos seleccionados."""
        tentative_schedules = []
        expires_at = timezone.now() + timedelta(minutes=expires_minutes)
        
        for equipment_id in equipment_ids:
            # Verificar disponibilidad antes de crear agenda tentativa
            available, _, _ = AvailabilityService.is_equipment_available(
                equipment_id=equipment_id,
                pickup_date=pickup_date,
                return_date=return_date,
                pickup_time=pickup_time,
                return_time=return_time
            )
            
            if not available:
                continue
            
            # Eliminar agendas tentativas expiradas del usuario para este equipo
            TentativeSchedule.objects.filter(
                user_id=user_id,
                equipment_id=equipment_id,
                expires_at__lt=timezone.now()
            ).delete()
            
            # Crear nueva agenda tentativa
            tentative = TentativeSchedule.objects.create(
                user_id=user_id,
                equipment_id=equipment_id,
                pickup_date=pickup_date,
                return_date=return_date,
                pickup_time=pickup_time,
                return_time=return_time,
                expires_at=expires_at,
                is_confirmed=False
            )
            tentative_schedules.append(tentative)
        
        return tentative_schedules
    
    @staticmethod
    def cleanup_expired_tentatives() -> int:
        """Elimina todas las agendas tentativas expiradas."""
        deleted, _ = TentativeSchedule.objects.filter(
            expires_at__lt=timezone.now(),
            is_confirmed=False
        ).delete()
        return deleted
    
    @staticmethod
    def get_user_tentative_schedules(user_id: str) -> List[TentativeSchedule]:
        """Obtiene todas las agendas tentativas activas de un usuario."""
        return TentativeSchedule.objects.filter(
            user_id=user_id,
            expires_at__gt=timezone.now(),
            is_confirmed=False
        ).select_related('equipment')
    
    @staticmethod
    def confirm_tentative_schedule(tentative_id: str, loan_id: str) -> bool:
        """Confirma una agenda tentativa y la asocia a un préstamo."""
        try:
            tentative = TentativeSchedule.objects.get(id=tentative_id)
            tentative.is_confirmed = True
            tentative.save()
            return True
        except TentativeSchedule.DoesNotExist:
            return False
    
    @staticmethod
    def get_blocked_dates(start_date: date, end_date: date) -> List[date]:
        """
        Obtiene todas las fechas bloqueadas en un rango.
        """
        blocked = BlockedDate.objects.filter(
            date__range=[start_date, end_date],
            is_active=True
        ).values_list('date', flat=True)
        return list(blocked)
    
    @staticmethod
    def get_equipment_availability_for_date_range(
        equipment_id: str,
        start_date: date,
        end_date: date
    ) -> dict:
        """
        Obtiene la disponibilidad de un equipo para un rango de fechas.
        Retorna un diccionario con fechas como llaves y disponibilidad como valor.
        """
        availability = {}
        
        # Obtener días bloqueados
        blocked_dates = BlockedDate.objects.filter(
            date__range=[start_date, end_date],
            is_active=True
        ).values_list('date', flat=True)
        blocked_list = list(blocked_dates)
        
        # Obtener préstamos activos que incluyan este equipo
        active_statuses = ['RESERVED', 'LOANED']
        active_items = LoanItemModel.objects.filter(
            equipment_id=equipment_id,
            status__in=active_statuses
        ).select_related('loan')
        
        # Crear diccionario de disponibilidad
        current_date = start_date
        while current_date <= end_date:
            is_blocked = current_date in blocked_list
            is_reserved = False
            
            # Verificar si hay préstamos activos para esta fecha
            for item in active_items:
                loan = item.loan
                if loan.pickup_date <= current_date <= loan.return_date:
                    is_reserved = True
                    break
            
            availability[current_date.isoformat()] = {
                'available': not is_blocked and not is_reserved,
                'blocked': is_blocked,
                'reserved': is_reserved
            }
            
            current_date += timedelta(days=1)
        
        return availability