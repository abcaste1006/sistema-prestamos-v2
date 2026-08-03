"""
Entidades de dominio del módulo de inventario.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum
import uuid


class EquipmentStatus(str, Enum):
    """Estados posibles de un equipo."""
    AVAILABLE = 'AVAILABLE'
    LOANED = 'LOANED'
    MAINTENANCE = 'MAINTENANCE'
    DAMAGED = 'DAMAGED'


@dataclass
class Equipment:
    """Entidad Equipment - representa un equipo del inventario."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ''
    description: Optional[str] = None
    category: str = ''
    status: EquipmentStatus = EquipmentStatus.AVAILABLE
    serial_number: Optional[str] = None
    specifications: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def mark_as_loaned(self) -> None:
        """Marca el equipo como prestado."""
        if self.status != EquipmentStatus.AVAILABLE:
            raise EquipmentNotAvailableError(f"El equipo '{self.name}' no está disponible")
        self.status = EquipmentStatus.LOANED

    def mark_as_available(self) -> None:
        """Marca el equipo como disponible."""
        self.status = EquipmentStatus.AVAILABLE

    def mark_as_maintenance(self) -> None:
        """Marca el equipo como en mantenimiento."""
        self.status = EquipmentStatus.MAINTENANCE

    def mark_as_damaged(self) -> None:
        """Marca el equipo como dañado."""
        self.status = EquipmentStatus.DAMAGED

    def deactivate(self) -> None:
        """Desactiva el equipo (soft delete)."""
        self.is_active = False

    def activate(self) -> None:
        """Activa el equipo."""
        self.is_active = True