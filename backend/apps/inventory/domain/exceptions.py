"""
Excepciones de dominio del módulo de inventario.
"""

from core.exceptions import DomainException, NotFoundError


class EquipmentNotFoundError(NotFoundError):
    """Error cuando un equipo no existe."""
    pass


class EquipmentNotAvailableError(DomainException):
    """Error cuando un equipo no está disponible para préstamo."""
    pass


class EquipmentAlreadyExistsError(DomainException):
    """Error cuando un equipo ya existe (duplicado por número de serie)."""
    pass


class EquipmentCannotBeDeletedError(DomainException):
    """Error cuando un equipo tiene préstamos activos y no puede ser desactivado."""
    pass