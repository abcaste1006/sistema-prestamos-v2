"""
Modelos ORM para el módulo de autenticación.
"""

from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from core.models import BaseModel
import uuid


class UserModel(BaseModel):
    """Modelo ORM para usuarios."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    identification = models.CharField(max_length=20, unique=True, db_index=True)
    password_hash = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    last_list_version = models.IntegerField(default=0, help_text="Versión de lista cuando inició sesión")  # <-- AGREGAR

    class Meta:
        db_table = 'auth_users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def set_password(self, raw_password: str):
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password_hash)


class VerificationCodeModel(BaseModel):
    """Modelo ORM para códigos de verificación."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        UserModel,
        on_delete=models.CASCADE,
        related_name='verification_codes'
    )
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'auth_verification_codes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Code {self.code} for {self.user.email}"