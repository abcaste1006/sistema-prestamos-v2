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
    is_returned = models.BooleanField(default=False)
    returned_at = models.DateTimeField(null=True, blank=True)
    condition_notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'loan_items'
        ordering = ['-created_at']

    def __str__(self):
        return f"Item de {self.loan.id[:8]} - {self.equipment.name}"