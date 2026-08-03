"""
Excepciones de dominio del módulo de préstamos.
"""

from core.exceptions import DomainException, NotFoundError, ConflictError


class LoanNotFoundError(NotFoundError):
    """Error cuando un préstamo no existe."""
    pass


class InvalidLoanStatusError(DomainException):
    """Error cuando se intenta realizar una acción inválida para el estado actual."""
    pass


class EquipmentAlreadyLoanedError(ConflictError):
    """Error cuando un equipo ya está en préstamo y no está disponible."""
    pass


class LoanCannotBeModifiedError(DomainException):
    """Error cuando se intenta modificar un préstamo que ya no se puede modificar."""
    pass


class LoanTermsNotAcceptedError(DomainException):
    """Error cuando se intenta crear un préstamo sin aceptar los términos."""
    pass


class PickupDateInvalidError(DomainException):
    """Error cuando la fecha de retiro no es válida."""
    pass


class ReturnDateInvalidError(DomainException):
    """Error cuando la fecha de devolución no es válida."""
    pass