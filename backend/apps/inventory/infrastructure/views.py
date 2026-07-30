from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import EquipmentModel
from .serializers import EquipmentSerializer


class EquipmentListView(generics.ListCreateAPIView):
    """Listar y crear equipos."""
    
    queryset = EquipmentModel.objects.all()
    serializer_class = EquipmentSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            # Cualquier usuario (autenticado o no) puede ver el catálogo
            return [AllowAny()]
        # Solo admins pueden crear, editar o eliminar
        return [IsAuthenticated()]


class EquipmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Ver, actualizar o eliminar un equipo específico."""
    
    queryset = EquipmentModel.objects.all()
    serializer_class = EquipmentSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]