"""
Modelos ORM para el módulo de préstamos.
"""

from django.db import models
from core.models import BaseModel
import uuid

from apps.authentication.infrastructure.models import UserModel
from apps.inventory.infrastructure.models import EquipmentModel

class LoanModel(BaseModel):
    """Modelo ORM para préstamos."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        UserModel,
        on_delete=models.PROTECT,
        related_name='loans'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pendiente'),
            ('APPROVED', 'Aprobado'),
            ('REJECTED', 'Rechazado'),
            ('ACTIVE', 'Activo'),
            ('OVERDUE', 'Vencido'),
            ('RETURNED', 'Devuelto'),
            ('CLOSED', 'Cerrado'),
        ],
        default='PENDING'
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_reason = models.TextField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    pickup_date = models.DateField()
    return_date = models.DateField()
    pickup_time = models.CharField(max_length=20)
    return_time = models.CharField(max_length=20)
    notes = models.TextField(null=True, blank=True)
    terms_accepted = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'loans'
        ordering = ['-created_at']

    def __str__(self):
        return f"Préstamo #{self.id[:8]} - {self.user.email} - {self.status}"


class LoanItemModel(BaseModel):
    """Modelo ORM para items de préstamo (equipos individuales)."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(
        LoanModel,
        on_delete=models.PROTECT,
        related_name='items'
    )
    equipment = models.ForeignKey(
        EquipmentModel,
        on_delete=models.PROTECT,
        related_name='loan_items'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('RESERVED', 'Reservado'),
            ('LOANED', 'En préstamo'),
            ('RETURNED', 'Devuelto'),
        ],
        default='RESERVED'
    )
    is_returned = models.BooleanField(default=False)
    returned_at = models.DateTimeField(null=True, blank=True)
    condition_notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'loan_items'
        ordering = ['-created_at']

    def __str__(self):
        return f"Item de {self.loan.id[:8]} - {self.equipment.name}"


class EquipmentSchedule(BaseModel):
    """
    Modelo ORM para franjas horarias de disponibilidad de equipos.
    Define disponibilidad base (horario de operación).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment = models.ForeignKey(
        EquipmentModel,
        on_delete=models.CASCADE,
        related_name='schedules'
    )
    day_of_week = models.IntegerField(
        choices=[
            (0, 'Lunes'),
            (1, 'Martes'),
            (2, 'Miércoles'),
            (3, 'Jueves'),
            (4, 'Viernes'),
            (5, 'Sábado'),
            (6, 'Domingo'),
        ],
        help_text="Día de la semana (0=Lunes, 6=Domingo)"
    )
    start_time = models.TimeField(help_text="Hora de inicio de disponibilidad")
    end_time = models.TimeField(help_text="Hora de fin de disponibilidad")
    is_active = models.BooleanField(default=True, help_text="Si esta franja está activa")
    
    class Meta:
        db_table = 'equipment_schedules'
        ordering = ['equipment', 'day_of_week', 'start_time']
        unique_together = ['equipment', 'day_of_week', 'start_time', 'end_time']
    
    def __str__(self):
        days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        return f"{self.equipment.name} - {days[self.day_of_week]} {self.start_time}-{self.end_time}"
    
    def is_time_in_range(self, time):
        """Verifica si una hora está dentro de esta franja."""
        return self.start_time <= time <= self.end_time


class TentativeSchedule(BaseModel):
    """
    Modelo ORM para agendas tentativas (reservas en espera de confirmación).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        UserModel,
        on_delete=models.CASCADE,
        related_name='tentative_schedules'
    )
    equipment = models.ForeignKey(
        EquipmentModel,
        on_delete=models.CASCADE,
        related_name='tentative_schedules'
    )
    pickup_date = models.DateField()
    return_date = models.DateField()
    pickup_time = models.TimeField()
    return_time = models.TimeField()
    expires_at = models.DateTimeField(help_text="Fecha y hora de expiración")
    is_confirmed = models.BooleanField(default=False, help_text="Si ya fue confirmada como préstamo")
    
    class Meta:
        db_table = 'tentative_schedules'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'expires_at']),
            models.Index(fields=['equipment', 'pickup_date', 'return_date']),
        ]
    
    def __str__(self):
        return f"Agenda tentativa de {self.user.email} para {self.equipment.name}"
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


class BlockedDate(BaseModel):
    """
    Modelo ORM para días no laborables o bloqueados.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(unique=True, help_text="Fecha bloqueada")
    reason = models.CharField(max_length=255, blank=True, null=True, help_text="Motivo del bloqueo")
    is_active = models.BooleanField(default=True, help_text="Si este bloqueo está activo")
    created_by = models.ForeignKey(
        UserModel,
        on_delete=models.PROTECT,
        related_name='blocked_dates'
    )
    
    class Meta:
        db_table = 'blocked_dates'
        ordering = ['date']
    
    def __str__(self):
        return f"{self.date} - {self.reason or 'Bloqueado'}"

class ReturnStatus(models.TextChoices):
    OK = 'OK', 'En buen estado'
    DAMAGED = 'DAMAGED', 'Dañado'
    MISSING = 'MISSING', 'Faltante'
    LATE = 'LATE', 'Devuelto tarde'
    PENDING = 'PENDING', 'Pendiente de recepción'

class LoanItemModel(BaseModel):
    """Modelo ORM para items de préstamo (equipos individuales)."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(
        LoanModel,
        on_delete=models.PROTECT,
        related_name='items'
    )
    equipment = models.ForeignKey(
        EquipmentModel,
        on_delete=models.PROTECT,
        related_name='loan_items'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('RESERVED', 'Reservado'),
            ('LOANED', 'En préstamo'),
            ('RETURNED', 'Devuelto'),
        ],
        default='RESERVED'
    )
    is_returned = models.BooleanField(default=False)
    returned_at = models.DateTimeField(null=True, blank=True)
    return_status = models.CharField(
        max_length=20,
        choices=[
            ('OK', 'En buen estado'),
            ('DAMAGED', 'Dañado'),
            ('MISSING', 'Faltante'),
            ('LATE', 'Devuelto tarde'),
            ('PENDING', 'Pendiente de recepción'),
        ],
        default='PENDING',
        help_text="Estado de la devolución del equipo"
    )
    return_notes = models.TextField(null=True, blank=True, help_text="Notas sobre el estado al devolver")
    condition_notes = models.TextField(null=True, blank=True)  # Mantener por compatibilidad

    class Meta:
        db_table = 'loan_items'
        ordering = ['-created_at']

    def __str__(self):
        return f"Item de {self.loan.id[:8]} - {self.equipment.name}"