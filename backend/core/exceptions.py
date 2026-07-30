"""
Excepciones base compartidas entre todos los módulos.
"""

class DomainException(Exception):
    """Excepción base para errores de dominio."""
    pass

class NotFoundError(DomainException):
    """Error cuando un recurso no existe."""
    pass

class ValidationError(DomainException):
    """Error cuando falla una validación de negocio."""
    pass

class UnauthorizedError(DomainException):
    """Error cuando un usuario no está autorizado."""
    pass

class ConflictError(DomainException):
    """Error cuando hay un conflicto (ej: recurso ya existe)."""
    pass