"""
Excepciones de dominio del módulo de autenticación.
"""

from core.exceptions import DomainException, NotFoundError, ConflictError


class UserAlreadyExistsError(ConflictError):
    """Error cuando un usuario ya existe."""
    pass


class InvalidCredentialsError(DomainException):
    """Error cuando las credenciales son inválidas."""
    pass


class UserNotFoundError(NotFoundError):
    """Error cuando un usuario no existe."""
    pass


class UserNotVerifiedError(DomainException):
    """Error cuando un usuario no está verificado."""
    pass


class InvalidVerificationCodeError(DomainException):
    """Error cuando el código de verificación es inválido."""
    pass


class VerificationCodeExpiredError(DomainException):
    """Error cuando el código de verificación ha expirado."""
    pass