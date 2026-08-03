"""
Interfaces (puertos) para repositorios del módulo de inventario.
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from apps.inventory.domain.entities import Equipment, EquipmentStatus


class EquipmentRepositoryInterface(ABC):
    """Interface para el repositorio de equipos."""

    @abstractmethod
    def save(self, equipment: Equipment) -> Equipment:
        """Guarda un equipo."""
        pass

    @abstractmethod
    def get_by_id(self, equipment_id: str) -> Optional[Equipment]:
        """Obtiene un equipo por su ID."""
        pass

    @abstractmethod
    def get_by_serial_number(self, serial_number: str) -> Optional[Equipment]:
        """Obtiene un equipo por su número de serie."""
        pass

    @abstractmethod
    def list_all(
        self,
        category: Optional[str] = None,
        status: Optional[EquipmentStatus] = None,
        search: Optional[str] = None,
        include_inactive: bool = False,
    ) -> List[Equipment]:
        """Lista equipos con filtros opcionales."""
        pass

    @abstractmethod
    def list_available(self) -> List[Equipment]:
        """Lista equipos disponibles para préstamo."""
        pass

    @abstractmethod
    def exists_by_serial_number(self, serial_number: str) -> bool:
        """Verifica si existe un equipo con el número de serie dado."""
        pass

    @abstractmethod
    def delete(self, equipment_id: str) -> None:
        """Elimina (soft delete) un equipo por su ID."""
        pass