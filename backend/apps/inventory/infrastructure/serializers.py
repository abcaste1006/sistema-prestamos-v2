from rest_framework import serializers
from .models import EquipmentModel


class EquipmentSerializer(serializers.ModelSerializer):
    """Serializer para equipos."""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = EquipmentModel
        fields = [
            'id', 'name', 'description', 'category', 'status',
            'status_display', 'serial_number', 'specifications',
            'image_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']