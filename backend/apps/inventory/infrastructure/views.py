from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from datetime import datetime
from .models import EquipmentModel
from .serializers import EquipmentSerializer
from apps.loans.application.services.availability_service import AvailabilityService


class EquipmentListView(generics.ListCreateAPIView):
    """Listar y crear equipos."""
    
    queryset = EquipmentModel.objects.all()
    serializer_class = EquipmentSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """
        Crea un equipo y automáticamente genera sus horarios por defecto (24/7).
        """
        # Guardar el equipo
        equipment = serializer.save()
        
        # Crear horarios por defecto (24/7) automáticamente
        equipment.create_default_schedules()


class EquipmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Ver, actualizar o eliminar un equipo específico."""
    
    queryset = EquipmentModel.objects.all()
    serializer_class = EquipmentSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


class EquipmentAvailabilityView(APIView):
    """Endpoint para consultar disponibilidad de equipos."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Consulta disponibilidad de equipos para un rango de fechas y horas.
        
        Query params:
            - equipment_id: ID del equipo (opcional)
            - start_date: Fecha de inicio (YYYY-MM-DD)
            - end_date: Fecha de fin (YYYY-MM-DD) (opcional)
            - pickup_time: Hora de retiro (HH:MM) (opcional)
            - return_time: Hora de devolución (HH:MM) (opcional)
        """
        equipment_id = request.query_params.get('equipment_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date', start_date_str)
        pickup_time_str = request.query_params.get('pickup_time')
        return_time_str = request.query_params.get('return_time')
        
        # Validar fechas
        if not start_date_str:
            return Response({
                'error': 'Se requiere start_date'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else start_date
        except ValueError:
            return Response({
                'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar horas (opcional)
        pickup_time = None
        return_time = None
        if pickup_time_str:
            try:
                pickup_time = datetime.strptime(pickup_time_str, '%H:%M').time()
            except ValueError:
                return Response({
                    'error': 'Formato de hora inválido. Use HH:MM'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if return_time_str:
            try:
                return_time = datetime.strptime(return_time_str, '%H:%M').time()
            except ValueError:
                return Response({
                    'error': 'Formato de hora inválido. Use HH:MM'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Si se proporciona equipment_id, verificar solo ese equipo
        if equipment_id:
            try:
                equipment = EquipmentModel.objects.get(id=equipment_id, is_active=True)
            except EquipmentModel.DoesNotExist:
                return Response({
                    'error': 'Equipo no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Si se proporcionan horas, verificar disponibilidad para el período
            if pickup_time and return_time:
                available, reason, conflicts = AvailabilityService.is_equipment_available(
                    equipment_id=equipment_id,
                    pickup_date=start_date,
                    return_date=end_date,
                    pickup_time=pickup_time,
                    return_time=return_time
                )
                
                return Response({
                    'equipment': {
                        'id': equipment.id,
                        'name': equipment.name,
                        'category': equipment.category,
                        'status': equipment.status,
                    },
                    'availability': {
                        'available': available,
                        'reason': reason,
                        'conflicts': conflicts,
                        'start_date': start_date.isoformat(),
                        'end_date': end_date.isoformat(),
                        'pickup_time': pickup_time.isoformat() if pickup_time else None,
                        'return_time': return_time.isoformat() if return_time else None,
                    }
                }, status=status.HTTP_200_OK)
            
            # Si no hay horas, obtener disponibilidad para el rango de fechas
            availability = AvailabilityService.get_equipment_availability_for_date_range(
                equipment_id=equipment_id,
                start_date=start_date,
                end_date=end_date
            )
            
            return Response({
                'equipment': {
                    'id': equipment.id,
                    'name': equipment.name,
                    'category': equipment.category,
                    'status': equipment.status,
                },
                'availability': availability
            }, status=status.HTTP_200_OK)
        
        # Si no se proporciona equipment_id, devolver disponibilidad de todos los equipos activos
        equipments = EquipmentModel.objects.filter(is_active=True)
        result = []
        
        for equipment in equipments:
            availability = AvailabilityService.get_equipment_availability_for_date_range(
                equipment_id=equipment.id,
                start_date=start_date,
                end_date=end_date
            )
            
            result.append({
                'equipment': {
                    'id': equipment.id,
                    'name': equipment.name,
                    'category': equipment.category,
                    'status': equipment.status,
                },
                'availability': availability
            })
        
        return Response({
            'results': result,
            'total': len(result)
        }, status=status.HTTP_200_OK)