"""
Caso de uso: Agregar un nuevo equipo (solo admin).
"""

from typing import Optional
from apps.inventory.domain.entities import Equipment, EquipmentStatus
from apps.inventory.domain.exceptions import EquipmentAlreadyExistsError
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface


class AddEquipmentUseCase:
    """Caso de uso para agregar un nuevo equipo."""
    
    def __init__(self, repository: EquipmentRepositoryInterface):
        self.repository = repository
    
    def execute(
        self,
        name: str,
        category: str,
        description: Optional[str] = None,
        serial_number: Optional[str] = None,
        specifications: Optional[str] = None,
        image_url: Optional[str] = None,
        status: EquipmentStatus = EquipmentStatus.AVAILABLE,
    ) -> Equipment:
        """
        Agrega un nuevo equipo al inventario.
        
        Args:
            name: Nombre del equipo
            category: Categoría
            description: Descripción (opcional)
            serial_number: Número de serie (opcional)
            specifications: Especificaciones (opcional)
            image_url: URL de la imagen (opcional)
            status: Estado inicial (por defecto AVAILABLE)
        
        Returns:
            Equipment: El equipo creado
        
        Raises:
            EquipmentAlreadyExistsError: Si ya existe un equipo con ese número de serie
        """
        # Verificar duplicado por número de serie (si se proporciona)
        if serial_number and self.repository.exists_by_serial_number(serial_number):
            raise EquipmentAlreadyExistsError(
                f"Ya existe un equipo con el número de serie '{serial_number}'"
            )
        
        equipment = Equipment(
            name=name,
            category=category,
            description=description,
            serial_number=serial_number,
            specifications=specifications,
            image_url=image_url,
            status=status,
            is_active=True,
        )
        
        return self.repository.save(equipment)