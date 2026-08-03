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


class RegisterView(APIView):
    """Endpoint para registro de usuarios."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generar y guardar código de verificación
            code = ''.join(random.choices(string.digits, k=6))
            expires_at = timezone.now() + timezone.timedelta(minutes=15)
            VerificationCodeModel.objects.create(
                user=user,
                code=code,
                expires_at=expires_at,
            )
            
            # Aquí se enviaría el correo (etapa 11)
            
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
        
        if not user.is_active:
            return Response({
                'detail': 'Usuario desactivado'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if not user.is_verified:
            return Response({
                'detail': 'Usuario no verificado. Se ha enviado un nuevo código.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # --- GENERAR JWT REAL CON CLAIMS PERSONALIZADOS ---
        refresh = RefreshToken.for_user(user)  # ← Esta línea es obligatorias

        # Agregar claims personalizados (esto funciona para TODOS los usuarios)
        refresh['is_admin'] = user.is_admin  # True o False según el usuario
        refresh['user_id'] = str(user.id)
        refresh['email'] = user.email

        access_token = str(refresh.access_token)
        # --- FIN ---
        
        user_data = UserResponseSerializer(user).data
        
        return Response({
            'access_token': access_token,
            'refresh_token': str(refresh),
            'token_type': 'bearer',
            'user': user_data,
        }, status=status.HTTP_200_OK)


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
        
        # Generar nuevo código
        code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timezone.timedelta(minutes=15)
        
        # Eliminar códigos anteriores no usados
        VerificationCodeModel.objects.filter(user=user, is_used=False).delete()
        
        # Crear nuevo código
        VerificationCodeModel.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
        )
        
        return Response({
            'message': 'Código reenviado exitosamente'
        }, status=status.HTTP_200_OK)