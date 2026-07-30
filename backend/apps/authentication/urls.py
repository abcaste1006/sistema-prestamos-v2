"""
URLs para el módulo de autenticación.
"""

from django.urls import path
from .infrastructure.views import (
    RegisterView,
    LoginView,
    VerifyView,
    ResendCodeView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/verify/', VerifyView.as_view(), name='auth-verify'),
    path('auth/resend-code/', ResendCodeView.as_view(), name='auth-resend'),
]
