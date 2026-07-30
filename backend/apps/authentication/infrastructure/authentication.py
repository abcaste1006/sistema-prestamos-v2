from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed

from .models import UserModel


class CustomJWTAuthentication(JWTAuthentication):
    """Autenticación JWT compatible con el modelo de usuarios propio del proyecto."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_model = UserModel

    def get_user(self, validated_token):
        user_id = validated_token.get(api_settings.USER_ID_CLAIM)
        if not user_id:
            raise AuthenticationFailed('Token sin identificador de usuario')

        try:
            user = self.user_model.objects.get(pk=user_id)
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

        if not user.is_active:
            raise AuthenticationFailed('Usuario inactivo')

        return user
