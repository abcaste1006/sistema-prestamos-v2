"""
Caso de uso: Actualizar un equipo existente (solo admin).
"""

from typing import Optional
from apps.inventory.domain.entities import Equipment, EquipmentStatus
from apps.inventory.domain.exceptions import EquipmentNotFoundError, EquipmentAlreadyExistsError
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface


class UpdateEquipmentUseCase:
    """Caso de uso para actualizar un equipo existente."""
    
    def __init__(self, repository: EquipmentRepositoryInterface):
        self.repository = repository
    
    def execute(
        self,
        equipment_id: str,
        name: Optional[str] = None,
        category: Optional[str] = None,
        description: Optional[str] = None,
        serial_number: Optional[str] = None,
        specifications: Optional[str] = None,
        image_url: Optional[str] = None,
        status: Optional[EquipmentStatus] = None,
    ) -> Equipment:
        """
        Actualiza un equipo existente.
        
        Args:
            equipment_id: ID del equipo a actualizar
            name: Nuevo nombre (opcional)
            category: Nueva categoría (opcional)
            description: Nueva descripción (opcional)
            serial_number: Nuevo número de serie (opcional)
            specifications: Nuevas especificaciones (opcional)
            image_url: Nueva URL de imagen (opcional)
            status: Nuevo estado (opcional)
        
        Returns:
            Equipment: El equipo actualizado
        
        Raises:
            EquipmentNotFoundError: Si el equipo no existe
            EquipmentAlreadyExistsError: Si el nuevo número de serie ya está en uso
        """
        equipment = self.repository.get_by_id(equipment_id)
        if not equipment:
            raise EquipmentNotFoundError(f"Equipo con ID '{equipment_id}' no encontrado")
        
        # Verificar duplicado por número de serie (si se cambia)
        if serial_number and serial_number != equipment.serial_number:
            if self.repository.exists_by_serial_number(serial_number):
                raise EquipmentAlreadyExistsError(
                    f"Ya existe un equipo con el número de serie '{serial_number}'"
                )
        
        # Actualizar campos
        if name is not None:
            equipment.name = name
        if category is not None:
            equipment.category = category
        if description is not None:
            equipment.description = description
        if serial_number is not None:
            equipment.serial_number = serial_number
        if specifications is not None:
            equipment.specifications = specifications
        if image_url is not None:
            equipment.image_url = image_url
        if status is not None:
            equipment.status = status
        
        return self.repository.save(equipment)