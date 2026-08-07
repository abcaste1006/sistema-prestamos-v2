"""
Vistas (API endpoints) para el módulo de autenticación.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import random
import string

from .models import UserModel, VerificationCodeModel
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    VerifySerializer,
    UserResponseSerializer,
)
from django.conf import settings
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail


class RegisterView(APIView):
    """Endpoint para registro de usuarios."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        # VALIDACIÓN CONTRA CSV
        from apps.valid_users.application.use_cases.validate_user import ValidateUserUseCase
        
        identification = request.data.get('identification')
        email = request.data.get('email')
        
        if not identification or not email:
            return Response({
                'detail': 'Cédula y correo son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validate_use_case = ValidateUserUseCase()
        is_valid, error_message = validate_use_case.execute(identification, email)
        
        if not is_valid:
            return Response({
                'detail': error_message
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            code = ''.join(random.choices(string.digits, k=6))
            expires_at = timezone.now() + timezone.timedelta(minutes=15)
            verification = VerificationCodeModel.objects.create(
                user=user,
                code=code,
                expires_at=expires_at,
            )
            
            # ENVIAR CORREO DE VERIFICACIÓN
            try:
                send_mail(
                    subject='Código de verificación - Sistema de Préstamos',
                    message=f'''
Hola {user.first_name},

Tu código de verificación es: {code}

Este código expirará en 15 minutos.

Si no solicitaste este registro, ignora este mensaje.

Saludos,
Sistema de Préstamos de Equipos
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@prestamos.com',
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Error al enviar correo: {e}")
            
            return Response({
                'message': 'Usuario registrado exitosamente. Revisa tu correo para el código de verificación.',
                'user_id': str(user.id),
                'requires_verification': True,
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyView(APIView):
    """Endpoint para verificar código."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = VerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = serializer.validated_data['user_id']
        code = serializer.validated_data['code']
        
        try:
            verification = VerificationCodeModel.objects.get(
                user_id=user_id,
                code=code,
                is_used=False,
                expires_at__gt=timezone.now(),
            )
        except VerificationCodeModel.DoesNotExist:
            return Response({
                'detail': 'Código inválido o expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Marcar código como usado
        verification.is_used = True
        verification.save()
        
        # Marcar usuario como verificado
        user = verification.user
        user.is_verified = True
        user.save()
        
        return Response({
            'message': 'Usuario verificado exitosamente'
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    """Endpoint para login de usuarios."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            return Response({
                'detail': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.check_password(password):
            return Response({
                'detail': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_verified:
            return Response({
                'detail': 'Usuario no verificado. Se ha enviado un nuevo código.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # VALIDACIÓN CONTRA CSV EN LOGIN
        from apps.valid_users.application.use_cases.validate_user import ValidateUserUseCase
        
        validate_use_case = ValidateUserUseCase()
        is_valid, error_message = validate_use_case.execute(
            identification=user.identification,
            email=user.email
        )
        
        if not is_valid:
            return Response({
                'detail': 'Usuario no autorizado. Contacte al administrador.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Si el usuario estaba desactivado, reactivarlo
        if not user.is_active:
            user.is_active = True
            user.save()
        
        # Obtener la versión actual de la lista
        from apps.config.models import SystemConfig
        config = SystemConfig.objects.filter(key='list_version').first()
        current_version = int(config.value) if config else 0
        
        # Guardar la versión en el usuario
        user.last_list_version = current_version
        user.save()
        
        # Generar token con la versión
        refresh = RefreshToken.for_user(user)
        refresh['is_admin'] = user.is_admin
        refresh['user_id'] = str(user.id)
        refresh['email'] = user.email
        refresh['list_version'] = current_version  # <-- Guardar en el token

        access_token = str(refresh.access_token)
        user_data = UserResponseSerializer(user).data

        response = Response({
            'access_token': access_token,
            'refresh_token': str(refresh),
            'token_type': 'bearer',
            'user': user_data,
        }, status=status.HTTP_200_OK)

        secure = not settings.DEBUG
        refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME')
        max_age = None
        try:
            max_age = int(refresh_lifetime.total_seconds())
        except Exception:
            max_age = None

        response.set_cookie(
            'refresh_token',
            str(refresh),
            httponly=True,
            secure=secure,
            samesite='Lax',
            path='/',
            max_age=max_age,
        )

        return response


class ResendCodeView(APIView):
    """Endpoint para reenviar código de verificación."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                'detail': 'El email es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            return Response({
                'detail': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if user.is_verified:
            return Response({
                'detail': 'El usuario ya está verificado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timezone.timedelta(minutes=15)
        
        VerificationCodeModel.objects.filter(user=user, is_used=False).delete()
        
        verification = VerificationCodeModel.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
        )
        
        # ENVIAR CORREO CON NUEVO CÓDIGO
        try:
            send_mail(
                subject='Nuevo código de verificación - Sistema de Préstamos',
                message=f'''
Hola {user.first_name},

Tu nuevo código de verificación es: {code}

Este código expirará en 15 minutos.

Si no solicitaste este reenvío, ignora este mensaje.

Saludos,
Sistema de Préstamos de Equipos
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@prestamos.com',
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error al enviar correo: {e}")
        
        return Response({
            'message': 'Código reenviado exitosamente'
        }, status=status.HTTP_200_OK)


class RefreshView(APIView):
    """Endpoint para refrescar access token usando refresh token en cookie HttpOnly."""

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.COOKIES.get('refresh_token')
        if not token:
            return Response({'detail': 'No refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(token)
            access_token = str(refresh.access_token)
        except TokenError:
            return Response({'detail': 'Refresh token inválido o expirado'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({'access_token': access_token}, status=status.HTTP_200_OK)