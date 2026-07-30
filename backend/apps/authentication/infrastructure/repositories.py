"""
Implementación de repositorios para el módulo de autenticación.
"""

from typing import Optional
from django.core.exceptions import ObjectDoesNotExist
from apps.authentication.domain.entities import User, VerificationCode, UserRole
from apps.authentication.interfaces.repositories import (
    UserRepositoryInterface,
    VerificationCodeRepositoryInterface,
)
from .models import UserModel, VerificationCodeModel


class UserRepository(UserRepositoryInterface):
    """Repositorio para usuarios usando Django ORM."""
    
    def save(self, user: User) -> User:
        """Guarda un usuario."""
        user_model, created = UserModel.objects.update_or_create(
            id=user.id,
            defaults={
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'identification': user.identification,
                'password_hash': user.password_hash,
                'phone': user.phone or '',
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'is_admin': user.role == UserRole.ADMIN,
            }
        )
        return self._to_domain(user_model)
    
    def get_by_id(self, user_id: str) -> Optional[User]:
        """Obtiene un usuario por su ID."""
        try:
            user_model = UserModel.objects.get(id=user_id)
            return self._to_domain(user_model)
        except ObjectDoesNotExist:
            return None
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Obtiene un usuario por su email."""
        try:
            user_model = UserModel.objects.get(email=email)
            return self._to_domain(user_model)
        except ObjectDoesNotExist:
            return None
    
    def get_by_identification(self, identification: str) -> Optional[User]:
        """Obtiene un usuario por su cédula."""
        try:
            user_model = UserModel.objects.get(identification=identification)
            return self._to_domain(user_model)
        except ObjectDoesNotExist:
            return None
    
    def exists_by_email(self, email: str) -> bool:
        """Verifica si existe un usuario con el email dado."""
        return UserModel.objects.filter(email=email).exists()
    
    def exists_by_identification(self, identification: str) -> bool:
        """Verifica si existe un usuario con la cédula dada."""
        return UserModel.objects.filter(identification=identification).exists()
    
    def _to_domain(self, model: UserModel) -> User:
        """Convierte un modelo ORM a una entidad de dominio."""
        return User(
            id=str(model.id),
            first_name=model.first_name,
            last_name=model.last_name,
            email=model.email,
            identification=model.identification,
            password_hash=model.password_hash,
            phone=model.phone or None,
            is_verified=model.is_verified,
            is_active=model.is_active,
            role=UserRole.ADMIN if model.is_admin else UserRole.USER,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class VerificationCodeRepository(VerificationCodeRepositoryInterface):
    """Repositorio para códigos de verificación usando Django ORM."""
    
    def save(self, code: VerificationCode) -> VerificationCode:
        """Guarda un código de verificación."""
        code_model, created = VerificationCodeModel.objects.update_or_create(
            id=code.id,
            defaults={
                'user_id': code.user_id,
                'code': code.code,
                'expires_at': code.expires_at,
                'is_used': code.is_used,
            }
        )
        return self._to_domain(code_model)
    
    def get_by_user_id(self, user_id: str) -> Optional[VerificationCode]:
        """Obtiene el código activo (no usado) de un usuario."""
        try:
            code_model = VerificationCodeModel.objects.filter(
                user_id=user_id,
                is_used=False
            ).first()
            if code_model:
                return self._to_domain(code_model)
            return None
        except ObjectDoesNotExist:
            return None
    
    def get_by_code(self, code: str) -> Optional[VerificationCode]:
        """Obtiene un código por su valor (activo y no usado)."""
        try:
            code_model = VerificationCodeModel.objects.filter(
                code=code,
                is_used=False
            ).first()
            if code_model:
                return self._to_domain(code_model)
            return None
        except ObjectDoesNotExist:
            return None
    
    def mark_as_used(self, code_id: str) -> None:
        """Marca un código como usado."""
        VerificationCodeModel.objects.filter(id=code_id).update(is_used=True)
    
    def delete_expired(self) -> None:
        """Elimina los códigos expirados."""
        from django.utils import timezone
        VerificationCodeModel.objects.filter(expires_at__lt=timezone.now()).delete()
    
    def _to_domain(self, model: VerificationCodeModel) -> VerificationCode:
        """Convierte un modelo ORM a una entidad de dominio."""
        return VerificationCode(
            id=str(model.id),
            user_id=str(model.user_id),
            code=model.code,
            expires_at=model.expires_at,
            is_used=model.is_used,
            created_at=model.created_at,
        )