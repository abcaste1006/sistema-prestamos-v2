"""
Serializers para el módulo de préstamos.
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import datetime
from .models import LoanModel, LoanItemModel
from apps.inventory.infrastructure.models import EquipmentModel


class LoanItemSerializer(serializers.ModelSerializer):
    """Serializer para items de préstamo."""
    
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    equipment_id = serializers.UUIDField(source='equipment.id', read_only=True)
    
    class Meta:
        model = LoanItemModel
        fields = [
            'id', 'loan', 'equipment', 'equipment_id', 'equipment_name',
            'status', 'is_returned', 'returned_at', 'condition_notes'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateLoanItemSerializer(serializers.Serializer):
    """Serializer para crear items de préstamo."""
    
    equipment_id = serializers.UUIDField()
    
    def validate_equipment_id(self, value):
        """Validar que el equipo existe y está disponible."""
        try:
            equipment = EquipmentModel.objects.get(id=value)
            if equipment.status != 'AVAILABLE':
                raise serializers.ValidationError(
                    f"El equipo '{equipment.name}' no está disponible"
                )
            return value
        except EquipmentModel.DoesNotExist:
            raise serializers.ValidationError("Equipo no encontrado")


class CreateLoanSerializer(serializers.Serializer):
    """Serializer para crear un préstamo."""
    
    equipment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="Lista de IDs de equipos a solicitar"
    )
    pickup_date = serializers.DateField()
    return_date = serializers.DateField()
    pickup_time = serializers.CharField(max_length=20)
    return_time = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    terms_accepted = serializers.BooleanField(default=False)
    
    def validate(self, data):
        """Validaciones cruzadas corregidas para permitir mismo día."""
        pickup_date = data.get('pickup_date')
        return_date = data.get('return_date')
        pickup_time = data.get('pickup_time')
        return_time = data.get('return_time')
        
        # Validar que la fecha de retiro no sea en el pasado
        today = timezone.now().date()
        if pickup_date and pickup_date < today:
            raise serializers.ValidationError({
                'pickup_date': 'La fecha de retiro no puede ser en el pasado'
            })
        
        # Validar fechas y horas combinadas
        if pickup_date and return_date:
            # Caso 1: Fecha de devolución anterior a fecha de retiro -> ERROR
            if return_date < pickup_date:
                raise serializers.ValidationError({
                    'return_date': 'La fecha de devolución no puede ser anterior a la fecha de retiro'
                })
            
            # Caso 2: Misma fecha -> validar horas
            if return_date == pickup_date:
                if not pickup_time or not return_time:
                    raise serializers.ValidationError({
                        'pickup_time': 'Se requiere hora de retiro para reservas del mismo día',
                        'return_time': 'Se requiere hora de devolución para reservas del mismo día'
                    })
                
                try:
                    pickup_time_obj = datetime.strptime(pickup_time, "%H:%M").time()
                    return_time_obj = datetime.strptime(return_time, "%H:%M").time()
                    
                    if return_time_obj <= pickup_time_obj:
                        raise serializers.ValidationError({
                            'return_time': 'La hora de devolución debe ser posterior a la hora de retiro'
                        })
                except ValueError:
                    raise serializers.ValidationError({
                        'pickup_time': 'Formato de hora inválido. Use HH:MM (ej: 14:30)'
                    })
            
            # Caso 3: Fecha de devolución posterior -> válido siempre
        
        # Validar términos
        if not data.get('terms_accepted', False):
            raise serializers.ValidationError({
                'terms_accepted': 'Debes aceptar los términos y condiciones'
            })
        
        return data


class LoanSerializer(serializers.ModelSerializer):
    """Serializer para listar préstamos."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items_count = serializers.SerializerMethodField()
    returned_items_count = serializers.SerializerMethodField()
    
    # CORREGIDO: Formato de fecha para evitar problemas de zona horaria
    pickup_date = serializers.DateField(format='%Y-%m-%d')
    return_date = serializers.DateField(format='%Y-%m-%d')
    
    class Meta:
        model = LoanModel
        fields = [
            'id', 'user', 'user_email', 'user_name', 'status', 'status_display',
            'items_count', 'returned_items_count', 'requested_at', 'approved_at',
            'rejected_at', 'rejected_reason', 'dispatched_at', 'returned_at',
            'pickup_date', 'return_date', 'pickup_time', 'return_time',
            'notes', 'terms_accepted', 'terms_accepted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Obtiene el nombre completo del usuario."""
        return f"{obj.user.first_name} {obj.user.last_name}".strip()
    
    def get_items_count(self, obj):
        """Cantidad total de equipos en el préstamo."""
        return obj.items.count()
    
    def get_returned_items_count(self, obj):
        """Cantidad de equipos devueltos."""
        return obj.items.filter(is_returned=True).count()


class LoanDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de un préstamo (con items)."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = LoanItemSerializer(many=True, read_only=True)
    
    # CORREGIDO: Formato de fecha para evitar problemas de zona horaria
    pickup_date = serializers.DateField(format='%Y-%m-%d')
    return_date = serializers.DateField(format='%Y-%m-%d')
    
    class Meta:
        model = LoanModel
        fields = [
            'id', 'user', 'user_email', 'user_name', 'status', 'status_display',
            'items', 'requested_at', 'approved_at', 'rejected_at', 'rejected_reason',
            'dispatched_at', 'returned_at', 'pickup_date', 'return_date',
            'pickup_time', 'return_time', 'notes', 'terms_accepted',
            'terms_accepted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Obtiene el nombre completo del usuario."""
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class ApproveLoanSerializer(serializers.Serializer):
    """Serializer para aprobar un préstamo."""
    pass


class RejectLoanSerializer(serializers.Serializer):
    """Serializer para rechazar un préstamo."""
    
    reason = serializers.CharField(max_length=500, required=True)
    
    def validate_reason(self, value):
        """Validar que el motivo no esté vacío."""
        if not value or not value.strip():
            raise serializers.ValidationError("El motivo del rechazo es obligatorio")
        return value.strip()


class DispatchItemSerializer(serializers.Serializer):
    """Serializer para despachar un equipo individual."""
    
    equipment_id = serializers.UUIDField()
    
    def validate_equipment_id(self, value):
        """Validar que el equipo existe."""
        try:
            EquipmentModel.objects.get(id=value)
            return value
        except EquipmentModel.DoesNotExist:
            raise serializers.ValidationError("Equipo no encontrado")


class DispatchSerializer(serializers.Serializer):
    """Serializer para despachar equipos de un préstamo."""
    
    equipment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="IDs de equipos a despachar. Si está vacío, se despachan todos."
    )
    
    def validate_equipment_ids(self, value):
        """Validar que los equipos existen."""
        if value:
            for equipment_id in value:
                try:
                    EquipmentModel.objects.get(id=equipment_id)
                except EquipmentModel.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Equipo con ID '{equipment_id}' no encontrado"
                    )
        return value


class ReturnItemSerializer(serializers.Serializer):
    """Serializer para devolver un equipo individual."""
    
    equipment_id = serializers.UUIDField()
    condition_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def validate_equipment_id(self, value):
        """Validar que el equipo existe."""
        try:
            EquipmentModel.objects.get(id=value)
            return value
        except EquipmentModel.DoesNotExist:
            raise serializers.ValidationError("Equipo no encontrado")


class ReturnSerializer(serializers.Serializer):
    """Serializer para devolver equipos de un préstamo."""
    
    equipment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="IDs de equipos a devolver. Si está vacío, se devuelven todos."
    )
    condition_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def validate_equipment_ids(self, value):
        """Validar que los equipos existen."""
        if value:
            for equipment_id in value:
                try:
                    EquipmentModel.objects.get(id=equipment_id)
                except EquipmentModel.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Equipo con ID '{equipment_id}' no encontrado"
                    )
        return value
class ReceiveSerializer(serializers.Serializer):
    """Serializer para recepción de equipos."""
    
    equipment_id = serializers.UUIDField()
    return_status = serializers.ChoiceField(
        choices=['OK', 'DAMAGED', 'MISSING', 'LATE'],
        required=True
    )
    return_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def validate_equipment_id(self, value):
        """Validar que el equipo existe."""
        try:
            EquipmentModel.objects.get(id=value)
            return value
        except EquipmentModel.DoesNotExist:
            raise serializers.ValidationError("Equipo no encontrado")