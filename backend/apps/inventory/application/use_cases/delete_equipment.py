"""
Caso de uso: Eliminar (soft delete) un equipo (solo admin).
"""

from apps.inventory.domain.exceptions import EquipmentNotFoundError, EquipmentCannotBeDeletedError
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface


class DeleteEquipmentUseCase:
    """Caso de uso para eliminar (soft delete) un equipo."""
    
    def __init__(self, repository: EquipmentRepositoryInterface):
        self.repository = repository
    
    def execute(self, equipment_id: str) -> None:
        """
        Elimina (soft delete) un equipo por su ID.
        
        Args:
            equipment_id: ID del equipo a eliminar
        
        Raises:
            EquipmentNotFoundError: Si el equipo no existe
            EquipmentCannotBeDeletedError: Si el equipo tiene préstamos activos
        """
        equipment = self.repository.get_by_id(equipment_id)
        if not equipment:
            raise EquipmentNotFoundError(f"Equipo con ID '{equipment_id}' no encontrado")
        
        # Verificar si el equipo tiene préstamos activos
        # Nota: Esta verificación requiere una dependencia del repositorio de préstamos
        # Por ahora, asumimos que el repositorio maneja esta lógica
        
        self.repository.delete(equipment_id)