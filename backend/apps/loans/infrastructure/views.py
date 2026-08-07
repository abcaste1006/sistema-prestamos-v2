"""
Vistas (API endpoints) para el módulo de préstamos.
"""

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction

from .models import LoanModel
from .serializers import (
    LoanSerializer,
    LoanDetailSerializer,
    CreateLoanSerializer,
    ApproveLoanSerializer,
    RejectLoanSerializer,
    DispatchSerializer,
    ReturnSerializer,
    ReceiveSerializer,
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
    ReceiveEquipmentUseCase,
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
        try:
            # Usar ORM directamente con prefetch para items
            loan = LoanModel.objects.filter(id=loan_id).prefetch_related(
                'items',
                'items__equipment'
            ).first()
            
            if not loan:
                return Response({
                    'detail': 'Préstamo no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Verificar permisos: admin puede ver todo, usuario solo sus préstamos
            if not request.user.is_admin and str(loan.user_id) != str(request.user.id):
                return Response({
                    'detail': 'No tienes permiso para ver este préstamo'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = LoanDetailSerializer(loan)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ApproveLoanView(APIView):
    """Endpoint para aprobar una solicitud de préstamo (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, loan_id):
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
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
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = RejectLoanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
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
            if not equipment_ids:
                loan = loan_repository.get_by_id(loan_id)
                if not loan:
                    return Response({
                        'detail': 'Préstamo no encontrado'
                    }, status=status.HTTP_404_NOT_FOUND)
                equipment_ids = [item.equipment_id for item in loan.items if not item.is_returned]
            
            for equipment_id in equipment_ids:
                use_case.execute(loan_id, equipment_id, condition_notes)
            
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


class ReceiveView(APIView):
    """Endpoint para recepción parcial de equipos (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, loan_id):
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ReceiveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        use_case = ReceiveEquipmentUseCase(loan_repository, equipment_repository)
        
        try:
            loan = use_case.execute(
                loan_id=loan_id,
                equipment_id=str(data['equipment_id']),
                return_status=data['return_status'],
                return_notes=data.get('return_notes')
            )
            
            return Response({
                'message': 'Equipo recepcionado exitosamente',
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
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        loans = LoanModel.objects.filter(status='ACTIVE').order_by('-dispatched_at')
        serializer = LoanDetailSerializer(loans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListReturnedLoansView(APIView):
    """Endpoint para listar préstamos devueltos (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        loans = LoanModel.objects.filter(status='RETURNED').order_by('-returned_at')
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListHistoryLoansView(APIView):
    """Endpoint para listar todos los préstamos con filtros (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener parámetros de filtro
        user_id = request.query_params.get('user_id')
        status_filter = request.query_params.get('status')
        equipment_id = request.query_params.get('equipment_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        search = request.query_params.get('search')
        
        # Query base
        queryset = LoanModel.objects.all().select_related('user').prefetch_related(
            'items',
            'items__equipment'
        )
        
        # Aplicar filtros
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if equipment_id:
            queryset = queryset.filter(items__equipment_id=equipment_id).distinct()
        
        if start_date:
            queryset = queryset.filter(requested_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(requested_at__lte=end_date)
        
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(id__icontains=search)
            )
        
        # Ordenar por más reciente
        queryset = queryset.order_by('-created_at')
        
        # Paginación (opcional)
        page_size = int(request.query_params.get('page_size', 50))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        loans = queryset[start:end]
        
        serializer = LoanDetailSerializer(loans, many=True)
        
        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }, status=status.HTTP_200_OK)


class UserLoansView(APIView):
    """Endpoint para listar préstamos de un usuario específico (admin)."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from apps.authentication.infrastructure.models import UserModel
        
        try:
            user = UserModel.objects.get(id=user_id)
        except UserModel.DoesNotExist:
            return Response({
                'detail': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener filtros de fecha
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status_filter = request.query_params.get('status')
        
        queryset = LoanModel.objects.filter(user_id=user_id).prefetch_related(
            'items',
            'items__equipment'
        )
        
        if start_date:
            queryset = queryset.filter(requested_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(requested_at__lte=end_date)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        queryset = queryset.order_by('-created_at')
        
        serializer = LoanDetailSerializer(queryset, many=True)
        
        return Response({
            'user': {
                'id': str(user.id),
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'identification': user.identification
            },
            'loans': serializer.data,
            'total': queryset.count()
        }, status=status.HTTP_200_OK)