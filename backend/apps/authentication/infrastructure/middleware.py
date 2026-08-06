"""
Middleware para verificar la versión de lista de usuarios.
"""

from django.http import JsonResponse
from rest_framework_simplejwt.tokens import AccessToken
from apps.config.models import SystemConfig


class ListVersionMiddleware:
    """
    Middleware que verifica si la versión de lista del token coincide con la actual.
    Si no coinciden, fuerza logout del usuario.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Solo verificar rutas que requieren autenticación
        # Excluir rutas públicas
        public_paths = ['/api/v1/auth/login', '/api/v1/auth/register', 
                        '/api/v1/auth/verify', '/api/v1/auth/resend',
                        '/api/v1/auth/refresh', '/api/v1/equipment/']
        
        # Si es una ruta pública, no verificar
        for path in public_paths:
            if request.path.startswith(path):
                return self.get_response(request)
        
        # Obtener el token del header
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token_string = auth_header.split(' ')[1]
            try:
                token = AccessToken(token_string)
                token_version = token.get('list_version', 0)
                
                # Obtener la versión actual
                config = SystemConfig.objects.filter(key='list_version').first()
                current_version = int(config.value) if config else 0
                
                # Si no coinciden, forzar logout
                if token_version != current_version:
                    return JsonResponse({
                        'detail': 'Sesión expirada. La lista de usuarios ha cambiado. Por favor, inicia sesión nuevamente.',
                        'code': 'list_version_mismatch'
                    }, status=401)
            except Exception as e:
                # Token inválido, continuar (el authentication lo manejará)
                pass
        
        return self.get_response(request)