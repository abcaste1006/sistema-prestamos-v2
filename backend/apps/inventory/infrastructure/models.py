from django.db import models
from core.models import BaseModel
import uuid

class EquipmentModel(BaseModel):
    """Modelo ORM para equipos."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=[
            ('AVAILABLE', 'Disponible'),
            ('LOANED', 'En préstamo'),
            ('MAINTENANCE', 'En mantenimiento'),
            ('DAMAGED', 'Dañado'),
        ],
        default='AVAILABLE'
    )
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    specifications = models.TextField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)  # ← AGREGAR ESTA LÍNEA

    class Meta:
        db_table = 'inventory_equipments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.category})"