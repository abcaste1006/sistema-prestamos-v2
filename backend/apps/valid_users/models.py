"""
Modelos para la gestión de usuarios validados vía CSV.
"""

from django.db import models
from core.models import BaseModel
import uuid

from apps.authentication.infrastructure.models import UserModel


class ValidUserList(BaseModel):
    """
    Histórico limitado de listas de usuarios autorizados.
    Solo la lista más reciente está activa. Se mantienen 5 versiones.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    semester = models.CharField(max_length=50, help_text="Semestre o periodo académico")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        UserModel,
        on_delete=models.PROTECT,
        related_name='uploaded_lists'
    )
    is_active = models.BooleanField(default=True, help_text="Si esta lista está activa")

    class Meta:
        db_table = 'valid_user_lists'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Lista {self.semester} - {self.uploaded_at.strftime('%Y-%m-%d')}"


class ValidUser(BaseModel):
    """
    Usuarios autorizados para registrarse en el sistema.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identification = models.CharField(max_length=20, db_index=True, unique=True, help_text="Cédula de identidad")
    email = models.EmailField(max_length=255, db_index=True, help_text="Correo institucional")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True, help_text="Si está autorizado actualmente")
    is_admin = models.BooleanField(default=False, help_text="Si el usuario debe ser administrador")
    list = models.ForeignKey(
        ValidUserList,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    last_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'valid_users'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.identification})"