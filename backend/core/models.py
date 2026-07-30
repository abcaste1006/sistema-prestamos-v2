"""
Modelos base compartidos entre todos los módulos.
"""

from django.db import models

class BaseModel(models.Model):
    """Modelo base con campos comunes para todos los modelos."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True