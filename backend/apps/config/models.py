"""
Modelos para configuración del sistema.
"""

from django.db import models
from core.models import BaseModel
import uuid


class SystemConfig(BaseModel):
    """
    Configuraciones del sistema (key-value).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'system_config'
        ordering = ['key']

    def __str__(self):
        return f"{self.key}: {self.value}"