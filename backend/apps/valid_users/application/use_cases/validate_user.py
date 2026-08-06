"""
Caso de uso: Validar si un usuario está autorizado para registrarse.
"""

from typing import Optional
from apps.valid_users.models import ValidUser


class ValidateUserUseCase:
    """
    Verifica si un usuario existe en la lista activa de autorizados.
    """

    def execute(self, identification: str, email: str) -> tuple[bool, Optional[str]]:
        """
        Valida si el usuario está autorizado.

        Returns:
            tuple[bool, Optional[str]]: (es_valido, mensaje_error)
        """
        try:
            # Buscar en la lista activa
            valid_user = ValidUser.objects.filter(
                identification=identification,
                is_active=True,
                list__is_active=True
            ).first()

            if not valid_user:
                return False, "Usuario no autorizado. Contacte al administrador."

            # Verificar que el email coincida
            if valid_user.email.lower() != email.lower():
                return False, "El correo no coincide con el registrado en la lista autorizada."

            return True, None

        except Exception as e:
            return False, f"Error al validar usuario: {str(e)}"