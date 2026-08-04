"""
Vistas (API endpoints) para el módulo de préstamos.
"""

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction

from .models import LoanModel
from .serializers import LoanSerializer



from .serializers import (
    LoanSerializer,
    LoanDetailSerializer,
    CreateLoanSerializer,
    ApproveLoanSerializer,
    RejectLoanSerializer,
    DispatchSerializer,
    ReturnSerializer,
)
from .repositories import LoanRepository, LoanItemRepository
from apps.inventory.infrastructure.repositories import EquipmentRepository
from apps.loans.application.use_cases import (
    CreateLoanUseCase,
    ListUserLoansUseCase,
    GetLoanDetailUseCase,
    ApproveLoanUseCase,
    RejectLoanUseCase,
    DispatchEquipmentUseCase,
    ReturnEquipmentUseCase,
)


# Inicializar repositorios
loan_repository = LoanRepository()
loan_item_repository = LoanItemRepository()
equipment_repository = EquipmentRepository()


class CreateLoanView(APIView):
    """Endpoint para crear una solicitud de préstamo."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateLoanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Obtener datos del usuario autenticado
        user = request.user
        user_id = str(user.id)
        user_name = f"{user.first_name} {user.last_name}".strip()
        user_email = user.email
        
        use_case = CreateLoanUseCase(loan_repository, equipment_repository)
        
        try:
            loan = use_case.execute(
                user_id=user_id,
                user_name=user_name,
                user_email=user_email,
                equipment_ids=data['equipment_ids'],
                pickup_date=data['pickup_date'],
                return_date=data['return_date'],
                pickup_time=data['pickup_time'],
                return_time=data['return_time'],
                terms_accepted=data.get('terms_accepted', False),
                notes=data.get('notes'),
            )
            
            return Response({
                'message': 'Solicitud de préstamo creada exitosamente',
                'loan_id': loan.id,
                'status': loan.status.value,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ListUserLoansView(APIView):
    """Endpoint para listar préstamos del usuario autenticado."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        loans = LoanModel.objects.filter(user=request.user)
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoanDetailView(APIView):
    """Endpoint para obtener detalle de un préstamo."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, loan_id):
        use_case = GetLoanDetailUseCase(loan_repository)
        
        try:
            loan = use_case.execute(loan_id, str(request.user.id))
            serializer = LoanDetailSerializer(loan)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_404_NOT_FOUND)


# En ApproveLoanView, actualizar la creación del caso de uso:
class ApproveLoanView(APIView):
    """Endpoint para aprobar una solicitud de préstamo (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, loan_id):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Inicializar con ambos repositorios
        use_case = ApproveLoanUseCase(loan_repository, equipment_repository)
        
        try:
            loan = use_case.execute(loan_id)
            return Response({
                'message': 'Préstamo aprobado exitosamente',
                'loan_id': loan.id,
                'status': loan.status.value,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class RejectLoanView(APIView):
    """Endpoint para rechazar una solicitud de préstamo (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, loan_id):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = RejectLoanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Inicializar con ambos repositorios
        use_case = RejectLoanUseCase(loan_repository, equipment_repository)
        
        try:
            loan = use_case.execute(loan_id, serializer.validated_data['reason'])
            return Response({
                'message': 'Préstamo rechazado y equipos liberados',
                'loan_id': loan.id,
                'status': loan.status.value,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class DispatchView(APIView):
    """Endpoint para despachar equipos de un préstamo (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, loan_id):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DispatchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        use_case = DispatchEquipmentUseCase(loan_repository)
        
        try:
            loan = use_case.execute(loan_id)
            return Response({
                'message': 'Equipos despachados exitosamente',
                'loan_id': loan.id,
                'status': loan.status.value,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ReturnView(APIView):
    """Endpoint para devolver equipos de un préstamo (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, loan_id):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ReturnSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        equipment_ids = data.get('equipment_ids')
        condition_notes = data.get('condition_notes')
        
        use_case = ReturnEquipmentUseCase(loan_repository, equipment_repository)
        
        try:
            # Si no se especifican equipos, devolver todos
            if not equipment_ids:
                # Obtener el préstamo para conocer sus items
                loan = loan_repository.get_by_id(loan_id)
                if not loan:
                    return Response({
                        'detail': 'Préstamo no encontrado'
                    }, status=status.HTTP_404_NOT_FOUND)
                equipment_ids = [item.equipment_id for item in loan.items if not item.is_returned]
            
            # Devolver cada equipo
            for equipment_id in equipment_ids:
                use_case.execute(loan_id, equipment_id, condition_notes)
            
            # Obtener el préstamo actualizado
            loan = loan_repository.get_by_id(loan_id)
            
            return Response({
                'message': 'Equipos devueltos exitosamente',
                'loan_id': loan.id,
                'status': loan.status.value,
                'items_returned': loan.returned_items_count,
                'total_items': loan.total_items_count,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
class ListPendingLoansView(APIView):
    """Endpoint para listar préstamos pendientes de aprobación (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        loans = LoanModel.objects.filter(status='PENDING').order_by('-requested_at')
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListApprovedLoansView(APIView):
    """Endpoint para listar préstamos aprobados listos para despachar (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        loans = LoanModel.objects.filter(status='APPROVED').order_by('-approved_at')
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListDispatchedLoansView(APIView):
    """Endpoint para listar préstamos activos (en uso) (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        loans = LoanModel.objects.filter(status='DISPATCHED').order_by('-dispatched_at')
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListReturnedLoansView(APIView):
    """Endpoint para listar préstamos devueltos (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Verificar que el usuario es admin
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        loans = LoanModel.objects.filter(status='RETURNED').order_by('-returned_at')
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    