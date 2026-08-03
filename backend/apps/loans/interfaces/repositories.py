"""
Interfaces (puertos) para repositorios del módulo de préstamos.
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from apps.loans.domain.entities import Loan, LoanItem, LoanStatus


class LoanRepositoryInterface(ABC):
    """Interface para el repositorio de préstamos."""
    
    @abstractmethod
    def save(self, loan: Loan) -> Loan:
        """Guarda un préstamo."""
        pass
    
    @abstractmethod
    def get_by_id(self, loan_id: str) -> Optional[Loan]:
        """Obtiene un préstamo por su ID."""
        pass
    
    @abstractmethod
    def list_by_user(self, user_id: str) -> List[Loan]:
        """Lista préstamos de un usuario específico."""
        pass
    
    @abstractmethod
    def list_by_status(self, status: LoanStatus) -> List[Loan]:
        """Lista préstamos por estado."""
        pass
    
    @abstractmethod
    def list_pending(self) -> List[Loan]:
        """Lista préstamos pendientes de aprobación."""
        pass
    
    @abstractmethod
    def list_active(self) -> List[Loan]:
        """Lista préstamos activos (en uso)."""
        pass
    
    @abstractmethod
    def list_overdue(self) -> List[Loan]:
        """Lista préstamos vencidos."""
        pass
    
    @abstractmethod
    def list_approved_ready_for_dispatch(self) -> List[Loan]:
        """Lista préstamos aprobados listos para despachar."""
        pass


class LoanItemRepositoryInterface(ABC):
    """Interface para el repositorio de items de préstamo."""
    
    @abstractmethod
    def save(self, item: LoanItem) -> LoanItem:
        """Guarda un item de préstamo."""
        pass
    
    @abstractmethod
    def get_by_loan_id(self, loan_id: str) -> List[LoanItem]:
        """Obtiene todos los items de un préstamo."""
        pass
    
    @abstractmethod
    def get_by_equipment_id(self, equipment_id: str) -> List[LoanItem]:
        """Obtiene todos los items asociados a un equipo."""
        pass