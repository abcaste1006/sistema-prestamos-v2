"""
Entidades de dominio del módulo de préstamos.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum
import uuid


class LoanStatus(str, Enum):
    """Estados posibles de un préstamo."""
    PENDING = 'PENDING'          # Solicitud pendiente de aprobación
    APPROVED = 'APPROVED'        # Aprobado, pendiente de entrega
    REJECTED = 'REJECTED'        # Rechazado
    ACTIVE = 'ACTIVE'            # Equipos entregados, en uso
    OVERDUE = 'OVERDUE'          # Vencido (no devuelto a tiempo)
    RETURNED = 'RETURNED'        # Todos los equipos devueltos
    CLOSED = 'CLOSED'            # Cerrado (completamente finalizado)


@dataclass
class LoanItem:
    """Entidad LoanItem - representa un equipo dentro de un préstamo."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str = ''
    equipment_id: str = ''
    equipment_name: str = ''
    is_returned: bool = False
    returned_at: Optional[datetime] = None
    condition_notes: Optional[str] = None  # Notas sobre el estado al devolver
    
    def mark_as_returned(self, notes: Optional[str] = None) -> None:
        """Marca el equipo como devuelto."""
        self.is_returned = True
        self.returned_at = datetime.utcnow()
        if notes:
            self.condition_notes = notes


@dataclass
class Loan:
    """Entidad Loan - representa un préstamo de equipos."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ''
    user_name: str = ''
    user_email: str = ''
    status: LoanStatus = LoanStatus.PENDING
    items: List[LoanItem] = field(default_factory=list)
    requested_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None
    dispatched_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    pickup_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    pickup_time: Optional[str] = None
    return_time: Optional[str] = None
    notes: Optional[str] = None
    terms_accepted: bool = False
    terms_accepted_at: Optional[datetime] = None
    
    @property
    def is_pending(self) -> bool:
        return self.status == LoanStatus.PENDING
    
    @property
    def is_approved(self) -> bool:
        return self.status == LoanStatus.APPROVED
    
    @property
    def is_rejected(self) -> bool:
        return self.status == LoanStatus.REJECTED
    
    @property
    def is_active(self) -> bool:
        return self.status == LoanStatus.ACTIVE
    
    @property
    def is_overdue(self) -> bool:
        return self.status == LoanStatus.OVERDUE
    
    @property
    def is_returned(self) -> bool:
        return self.status == LoanStatus.RETURNED
    
    @property
    def is_closed(self) -> bool:
        return self.status == LoanStatus.CLOSED
    
    @property
    def all_items_returned(self) -> bool:
        """Verifica si todos los equipos han sido devueltos."""
        if not self.items:
            return False
        return all(item.is_returned for item in self.items)
    
    @property
    def returned_items_count(self) -> int:
        """Cantidad de equipos devueltos."""
        return sum(1 for item in self.items if item.is_returned)
    
    @property
    def total_items_count(self) -> int:
        """Cantidad total de equipos en el préstamo."""
        return len(self.items)
    
    def approve(self) -> None:
        """Aprueba el préstamo."""
        if self.status != LoanStatus.PENDING:
            raise InvalidLoanStatusError(f"No se puede aprobar un préstamo en estado '{self.status}'")
        self.status = LoanStatus.APPROVED
        self.approved_at = datetime.utcnow()
    
    def reject(self, reason: str) -> None:
        """Rechaza el préstamo con un motivo."""
        if self.status != LoanStatus.PENDING:
            raise InvalidLoanStatusError(f"No se puede rechazar un préstamo en estado '{self.status}'")
        self.status = LoanStatus.REJECTED
        self.rejected_at = datetime.utcnow()
        self.rejected_reason = reason
    
    def dispatch(self) -> None:
        """Marca el préstamo como despachado (equipos entregados)."""
        if self.status != LoanStatus.APPROVED:
            raise InvalidLoanStatusError(f"No se puede despachar un préstamo en estado '{self.status}'")
        self.status = LoanStatus.ACTIVE
        self.dispatched_at = datetime.utcnow()
    
    def mark_as_returned(self) -> None:
        """Marca el préstamo como devuelto (todos los equipos)."""
        if self.status not in [LoanStatus.ACTIVE, LoanStatus.OVERDUE]:
            raise InvalidLoanStatusError(f"No se puede marcar como devuelto un préstamo en estado '{self.status}'")
        if not self.all_items_returned:
            raise ValueError("No se puede cerrar el préstamo porque no todos los equipos han sido devueltos")
        self.status = LoanStatus.RETURNED
        self.returned_at = datetime.utcnow()
    
    def close(self) -> None:
        """Cierra el préstamo (finalizado)."""
        if self.status != LoanStatus.RETURNED:
            raise InvalidLoanStatusError(f"No se puede cerrar un préstamo en estado '{self.status}'")
        self.status = LoanStatus.CLOSED
    
    def mark_as_overdue(self) -> None:
        """Marca el préstamo como vencido."""
        if self.status != LoanStatus.ACTIVE:
            raise InvalidLoanStatusError(f"No se puede marcar como vencido un préstamo en estado '{self.status}'")
        self.status = LoanStatus.OVERDUE
    
    def add_item(self, equipment_id: str, equipment_name: str) -> None:
        """Agrega un equipo al préstamo."""
        if self.status != LoanStatus.PENDING:
            raise InvalidLoanStatusError(f"No se pueden agregar equipos a un préstamo en estado '{self.status}'")
        item = LoanItem(
            loan_id=self.id,
            equipment_id=equipment_id,
            equipment_name=equipment_name,
        )
        self.items.append(item)
    
    def accept_terms(self) -> None:
        """Registra la aceptación de términos y condiciones."""
        self.terms_accepted = True
        self.terms_accepted_at = datetime.utcnow()