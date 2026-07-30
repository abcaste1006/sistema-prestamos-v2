"""
Serializers para el módulo de autenticación.
"""

from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import UserModel, VerificationCodeModel


class UserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo UserModel."""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserModel
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'identification', 'phone',
            'is_verified', 'is_active', 'is_admin',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.full_name


class RegisterSerializer(serializers.Serializer):
    """Serializer para el registro de usuarios."""
    
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=255)
    identification = serializers.CharField(max_length=20)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(max_length=128, write_only=True)
    
    def validate_email(self, value):
        """Validar que el email no esté registrado."""
        if UserModel.objects.filter(email=value).exists():
            raise serializers.ValidationError("El email ya está registrado")
        return value
    
    def validate_identification(self, value):
        """Validar que la cédula no esté registrada."""
        if UserModel.objects.filter(identification=value).exists():
            raise serializers.ValidationError("La cédula ya está registrada")
        return value
    
    def create(self, validated_data):
        """Crear un nuevo usuario."""
        password = validated_data.pop('password')
        user = UserModel(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer para el login."""
    
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(max_length=128, write_only=True)


class VerifySerializer(serializers.Serializer):
    """Serializer para la verificación de código."""
    
    user_id = serializers.CharField()
    code = serializers.CharField(max_length=6)


class UserResponseSerializer(serializers.ModelSerializer):
    """Serializer para respuestas de usuario (sin datos sensibles)."""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserModel
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'identification', 'phone',
            'is_verified', 'is_active', 'is_admin'
        ]
    
    def get_full_name(self, obj):
        return obj.full_name