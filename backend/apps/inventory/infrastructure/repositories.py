"""
Implementación del repositorio para el módulo de inventario.
"""

from typing import Optional, List
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from apps.inventory.domain.entities import Equipment, EquipmentStatus
from apps.inventory.interfaces.repositories import EquipmentRepositoryInterface
from .models import EquipmentModel


class EquipmentRepository(EquipmentRepositoryInterface):
    """Repositorio para equipos usando Django ORM."""

    def save(self, equipment: Equipment) -> Equipment:
        """Guarda un equipo."""
        equipment_model, created = EquipmentModel.objects.update_or_create(
            id=equipment.id,
            defaults={
                'name': equipment.name,
                'description': equipment.description,
                'category': equipment.category,
                'status': equipment.status.value,
                'serial_number': equipment.serial_number,
                'specifications': equipment.specifications,
                'image_url': equipment.image_url,
                'is_active': equipment.is_active,
            }
        )
        return self._to_domain(equipment_model)

    def get_by_id(self, equipment_id: str) -> Optional[Equipment]:
        """Obtiene un equipo por su ID."""
        try:
            equipment_model = EquipmentModel.objects.get(id=equipment_id)
            return self._to_domain(equipment_model)
        except ObjectDoesNotExist:
            return None

    def get_by_serial_number(self, serial_number: str) -> Optional[Equipment]:
        """Obtiene un equipo por su número de serie."""
        try:
            equipment_model = EquipmentModel.objects.get(serial_number=serial_number)
            return self._to_domain(equipment_model)
        except ObjectDoesNotExist:
            return None

    def list_all(
        self,
        category: Optional[str] = None,
        status: Optional[EquipmentStatus] = None,
        search: Optional[str] = None,
        include_inactive: bool = False,
    ) -> List[Equipment]:
        """Lista equipos con filtros opcionales."""
        queryset = EquipmentModel.objects.all()

        if not include_inactive:
            queryset = queryset.filter(is_active=True)

        if category:
            queryset = queryset.filter(category__iexact=category)

        if status:
            queryset = queryset.filter(status=status.value)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        return [self._to_domain(model) for model in queryset]

    def list_available(self) -> List[Equipment]:
        """Lista equipos disponibles para préstamo."""
        queryset = EquipmentModel.objects.filter(
            status=EquipmentStatus.AVAILABLE.value,
            is_active=True,
        )
        return [self._to_domain(model) for model in queryset]

    def exists_by_serial_number(self, serial_number: str) -> bool:
        """Verifica si existe un equipo con el número de serie dado."""
        return EquipmentModel.objects.filter(serial_number=serial_number).exists()

    def delete(self, equipment_id: str) -> None:
        """Elimina (soft delete) un equipo por su ID."""
        EquipmentModel.objects.filter(id=equipment_id).update(is_active=False)

    def _to_domain(self, model: EquipmentModel) -> Equipment:
        """Convierte un modelo ORM a una entidad de dominio."""
        return Equipment(
            id=str(model.id),
            name=model.name,
            description=model.description,
            category=model.category,
            status=EquipmentStatus(model.status),
            serial_number=model.serial_number,
            specifications=model.specifications,
            image_url=model.image_url,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )