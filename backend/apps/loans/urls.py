from django.urls import path
from .infrastructure.views import (
    CreateLoanView,
    ListUserLoansView,
    LoanDetailView,
    ApproveLoanView,
    RejectLoanView,
    DispatchView,
    ReturnView,
    ReceiveView,
    ListPendingLoansView,
    ListApprovedLoansView,
    ListDispatchedLoansView,
    ListReturnedLoansView,
    ListHistoryLoansView,  # <-- AGREGAR
    UserLoansView,         # <-- AGREGAR
)

urlpatterns = [
    path('loans/', CreateLoanView.as_view(), name='loan-create'),
    path('loans/my/', ListUserLoansView.as_view(), name='loan-list-user'),
    path('loans/<uuid:loan_id>/', LoanDetailView.as_view(), name='loan-detail'),
    
    # Rutas de admin
    path('admin/loans/pending/', ListPendingLoansView.as_view(), name='loan-list-pending'),
    path('admin/loans/approved/', ListApprovedLoansView.as_view(), name='loan-list-approved'),
    path('admin/loans/dispatched/', ListDispatchedLoansView.as_view(), name='loan-list-dispatched'),
    path('admin/loans/returned/', ListReturnedLoansView.as_view(), name='loan-list-returned'),
    path('admin/loans/history/', ListHistoryLoansView.as_view(), name='loan-list-history'),  # <-- AGREGAR
    path('admin/loans/<uuid:loan_id>/approve/', ApproveLoanView.as_view(), name='loan-approve'),
    path('admin/loans/<uuid:loan_id>/reject/', RejectLoanView.as_view(), name='loan-reject'),
    path('admin/loans/<uuid:loan_id>/dispatch/', DispatchView.as_view(), name='loan-dispatch'),
    path('admin/loans/<uuid:loan_id>/receive/', ReceiveView.as_view(), name='loan-receive'),
    path('admin/loans/<uuid:loan_id>/return/', ReturnView.as_view(), name='loan-return'),
    path('admin/users/<uuid:user_id>/loans/', UserLoansView.as_view(), name='user-loans'),  # <-- AGREGAR
]