"""
Interfaces (puertos) para repositorios del módulo de autenticación.
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from apps.authentication.domain.entities import User, VerificationCode

class UserRepositoryInterface(ABC):
    """Interface para el repositorio de usuarios."""
    
    @abstractmethod
    def save(self, user: User) -> User:
        """Guarda un usuario."""
        pass
    
    @abstractmethod
    def get_by_id(self, user_id: str) -> Optional[User]:
        """Obtiene un usuario por su ID."""
        pass
    
    @abstractmethod
    def get_by_email(self, email: str) -> Optional[User]:
        """Obtiene un usuario por su email."""
        pass
    
    @abstractmethod
    def get_by_identification(self, identification: str) -> Optional[User]:
        """Obtiene un usuario por su cédula."""
        pass
    
    @abstractmethod
    def exists_by_email(self, email: str) -> bool:
        """Verifica si existe un usuario con el email dado."""
        pass
    
    @abstractmethod
    def exists_by_identification(self, identification: str) -> bool:
        """Verifica si existe un usuario con la cédula dada."""
        pass


class VerificationCodeRepositoryInterface(ABC):
    """Interface para el repositorio de códigos de verificación."""
    
    @abstractmethod
    def save(self, code: VerificationCode) -> VerificationCode:
        """Guarda un código de verificación."""
        pass
    
    @abstractmethod
    def get_by_user_id(self, user_id: str) -> Optional[VerificationCode]:
        """Obtiene el código activo de un usuario."""
        pass
    
    @abstractmethod
    def get_by_code(self, code: str) -> Optional[VerificationCode]:
        """Obtiene un código por su valor."""
        pass
    
    @abstractmethod
    def mark_as_used(self, code_id: str) -> None:
        """Marca un código como usado."""
        pass
    
    @abstractmethod
    def delete_expired(self) -> None:
        """Elimina los códigos expirados."""
        pass