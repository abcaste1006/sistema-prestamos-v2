"""
Caso de uso: Listar equipos con filtros.
"""

from typing import List, Optional
from apps.inventory.domain.entities import Equipment, EquipmentStatus
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface


class ListEquipmentUseCase:
    """Caso de uso para listar equipos con filtros opcionales."""
    
    def __init__(self, repository: EquipmentRepositoryInterface):
        self.repository = repository
    
    def execute(
        self,
        category: Optional[str] = None,
        status: Optional[EquipmentStatus] = None,
        search: Optional[str] = None,
        include_inactive: bool = False,
    ) -> List[Equipment]:
        """
        Lista equipos aplicando filtros.
        
        Args:
            category: Filtrar por categoría
            status: Filtrar por estado
            search: Buscar por nombre o descripción
            include_inactive: Incluir equipos inactivos (soft delete)
        
        Returns:
            List[Equipment]: Lista de equipos que coinciden con los filtros
        """
        return self.repository.list_all(
            category=category,
            status=status,
            search=search,
            include_inactive=include_inactive,
        )