"""
Entidades de dominio del módulo de autenticación.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum
import uuid


class UserRole(str, Enum):
    """Roles de usuario en el sistema."""
    ADMIN = 'admin'
    USER = 'user'


@dataclass
class User:
    """Entidad User - representa un usuario del sistema."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str = ''
    last_name: str = ''
    email: str = ''
    identification: str = ''
    password_hash: str = ''
    phone: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True
    role: UserRole = UserRole.USER
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @property
    def full_name(self) -> str:
        """Retorna el nombre completo del usuario."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def verify(self) -> None:
        """Marca al usuario como verificado."""
        self.is_verified = True
    
    def deactivate(self) -> None:
        """Desactiva al usuario."""
        self.is_active = False
    
    def activate(self) -> None:
        """Activa al usuario."""
        self.is_active = True


@dataclass
class VerificationCode:
    """Entidad VerificationCode - código de verificación por email."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ''
    code: str = ''
    expires_at: Optional[datetime] = None
    is_used: bool = False
    created_at: Optional[datetime] = None
    
    @property
    def is_expired(self) -> bool:
        """Verifica si el código ha expirado."""
        if not self.expires_at:
            return True
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Verifica si el código es válido (no expirado y no usado)."""
        return not self.is_expired and not self.is_used