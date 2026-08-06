from django.apps import AppConfig


class ValidUsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.valid_users'
    label = 'valid_users'
    verbose_name = 'Usuarios Válidos'