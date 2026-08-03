"""
Caso de uso: Obtener detalle de un equipo.
"""

from apps.inventory.domain.entities import Equipment
from apps.inventory.domain.exceptions import EquipmentNotFoundError
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface


class GetEquipmentDetailUseCase:
    """Caso de uso para obtener el detalle de un equipo."""
    
    def __init__(self, repository: EquipmentRepositoryInterface):
        self.repository = repository
    
    def execute(self, equipment_id: str) -> Equipment:
        """
        Obtiene un equipo por su ID.
        
        Args:
            equipment_id: ID del equipo
        
        Returns:
            Equipment: El equipo encontrado
        
        Raises:
            EquipmentNotFoundError: Si el equipo no existe
        """
        equipment = self.repository.get_by_id(equipment_id)
        if not equipment:
            raise EquipmentNotFoundError(f"Equipo con ID '{equipment_id}' no encontrado")
        return equipment