"""
Caso de uso: Verificación de usuario.
"""

from datetime import datetime, timedelta
from apps.authentication.domain.entities import VerificationCode
from apps.authentication.domain.exceptions import (
    UserNotFoundError,
    InvalidVerificationCodeError,
    VerificationCodeExpiredError,
)
from apps.authentication.interfaces.repositories import (
    UserRepositoryInterface,s
    VerificationCodeRepositoryInterface,
)


class VerifyUserUseCase:
    """Caso de uso para verificar un usuario con código."""
    
    def __init__(
        self,
        user_repository: UserRepositoryInterface,
        verification_repository: VerificationCodeRepositoryInterface,
    ):
        self.user_repository = user_repository
        self.verification_repository = verification_repository
    
    def execute(self, user_id: str, code: str) -> bool:
        """
        Verifica un usuario usando el código de verificación.
        
        Args:
            user_id: ID del usuario
            code: Código de verificación
        
        Returns:
            bool: True si la verificación fue exitosa
        
        Raises:
            UserNotFoundError: Si el usuario no existe
            InvalidVerificationCodeError: Si el código es inválido
            VerificationCodeExpiredError: Si el código ha expirado
        """
        # Verificar que el usuario existe
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"Usuario con ID '{user_id}' no encontrado")
        
        # Obtener el código de verificación
        verification = self.verification_repository.get_by_code(code)
        if not verification or verification.user_id != user_id:
            raise InvalidVerificationCodeError("Código inválido")
        
        # Verificar si el código ha expirado
        if verification.is_expired:
            raise VerificationCodeExpiredError("El código ha expirado")
        
        # Verificar si el código ya fue usado
        if verification.is_used:
            raise InvalidVerificationCodeError("El código ya fue usado")
        
        # Marcar el código como usado
        self.verification_repository.mark_as_used(verification.id)
        
        # Marcar al usuario como verificado
        user.verify()
        self.user_repository.save(user)
        
        return True