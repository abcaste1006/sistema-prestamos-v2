"""
Caso de uso: Login de usuario.
"""

from typing import Tuple
from apps.authentication.domain.entities import User
from apps.authentication.domain.exceptions import InvalidCredentialsError, UserNotVerifiedError
from apps.authentication.interfaces.repositories import UserRepositoryInterface


class LoginUserUseCase:
    """Caso de uso para autenticar un usuario."""
    
    def __init__(self, user_repository: UserRepositoryInterface):
        self.user_repository = user_repository
    
    def execute(self, email: str, password_hash: str) -> Tuple[User, str]:
        """
        Autentica a un usuario y genera un token de acceso.
        
        Args:
            email: Correo del usuario
            password_hash: Hash de la contraseña (para comparar)
        
        Returns:
            Tuple[User, str]: Usuario autenticado y token JWT
        
        Raises:
            InvalidCredentialsError: Si las credenciales son inválidas
            UserNotVerifiedError: Si el usuario no está verificado
        """
        # Buscar usuario por email
        user = self.user_repository.get_by_email(email)
        if not user:
            raise InvalidCredentialsError("Credenciales inválidas")
        
        # Verificar contraseña (en el repo se comparará el hash)
        # La verificación real se hace en el repositorio con el hash almacenado
        if user.password_hash != password_hash:
            raise InvalidCredentialsError("Credenciales inválidas")
        
        # Verificar que el usuario esté activo
        if not user.is_active:
            raise InvalidCredentialsError("Usuario desactivado")
        
        # Verificar que el usuario esté verificado
        if not user.is_verified:
            raise UserNotVerifiedError("Usuario no verificado")
        
        # Generar token JWT (se hará en el adaptador)
        return user, "token_generado"