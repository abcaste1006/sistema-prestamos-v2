"""
Caso de uso: Registro de usuario.
"""

from typing import Optional
from apps.authentication.domain.entities import User, UserRole
from apps.authentication.domain.exceptions import UserAlreadyExistsError
from apps.authentication.interfaces.repositories import UserRepositoryInterface


class RegisterUserUseCase:
    """Caso de uso para registrar un nuevo usuario."""
    
    def __init__(self, user_repository: UserRepositoryInterface):
        self.user_repository = user_repository
    
    def execute(
        self,
        first_name: str,
        last_name: str,
        email: str,
        identification: str,
        password_hash: str,
        phone: Optional[str] = None,
    ) -> User:
        """
        Registra un nuevo usuario en el sistema.
        
        Args:
            first_name: Nombre del usuario
            last_name: Apellido del usuario
            email: Correo institucional
            identification: Cédula de identidad
            password_hash: Hash de la contraseña
            phone: Teléfono (opcional)
        
        Returns:
            User: Usuario registrado
        
        Raises:
            UserAlreadyExistsError: Si el usuario ya existe
        """
        # Verificar si el usuario ya existe
        if self.user_repository.exists_by_email(email):
            raise UserAlreadyExistsError(f"El usuario con email '{email}' ya existe")
        
        if self.user_repository.exists_by_identification(identification):
            raise UserAlreadyExistsError(f"El usuario con cédula '{identification}' ya existe")
        
        # Crear el usuario
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            identification=identification,
            password_hash=password_hash,
            phone=phone,
            is_verified=False,
            is_active=True,
            role=UserRole.USER,
        )
        
        # Guardar el usuario
        return self.user_repository.save(user)