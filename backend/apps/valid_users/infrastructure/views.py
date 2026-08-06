"""
Vistas para la gestión de usuarios validados.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import csv
import io
from django.utils import timezone

from apps.valid_users.models import ValidUser, ValidUserList
from apps.authentication.infrastructure.models import UserModel
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


class ImportUsersView(APIView):
    """
    Endpoint para importar usuarios desde un archivo CSV.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        semester = request.data.get('semester', '')

        if not file:
            return Response({
                'detail': 'No se proporcionó ningún archivo'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not semester:
            return Response({
                'detail': 'El semestre es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)

            # Crear nueva lista activa
            new_list = ValidUserList.objects.create(
                semester=semester,
                uploaded_by=request.user,
                is_active=True
            )

            # Desactivar listas anteriores
            ValidUserList.objects.filter(is_active=True).exclude(id=new_list.id).update(is_active=False)

            # Mantener solo las últimas 5 listas para histórico
            list_ids = ValidUserList.objects.values_list('id', flat=True).order_by('-uploaded_at')
            if list_ids.count() > 5:
                old_list_ids = list_ids[5:]
                ValidUserList.objects.filter(id__in=old_list_ids).delete()

            imported_count = 0
            updated_count = 0
            errors = []
            new_identifications = []

            for row in reader:
                identification = row.get('identification', '').strip()
                email = row.get('email', '').strip()
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                is_admin = row.get('is_admin', 'false').strip().lower() in ('true', '1', 'yes')

                if not all([identification, email, first_name, last_name]):
                    errors.append(f"Fila incompleta: {row}")
                    continue

                new_identifications.append(identification)

                try:
                    valid_user, created = ValidUser.objects.update_or_create(
                        identification=identification,
                        defaults={
                            'email': email,
                            'first_name': first_name,
                            'last_name': last_name,
                            'is_active': True,
                            'is_admin': is_admin,
                            'list': new_list,
                            'last_updated_at': timezone.now()
                        }
                    )
                    if created:
                        imported_count += 1
                    else:
                        updated_count += 1
                except Exception as e:
                    errors.append(f"Error importando {identification}: {str(e)}")

            # Desactivar usuarios que ya no están en el nuevo CSV
            desactivated_count = ValidUser.objects.filter(
                is_active=True
            ).exclude(
                identification__in=new_identifications
            ).update(
                is_active=False,
                list=new_list,
                last_updated_at=timezone.now()
            )

            # INCREMENTAR LA VERSIÓN DE LA LISTA
            from apps.config.models import SystemConfig
            config, created = SystemConfig.objects.get_or_create(
                key='list_version',
                defaults={'value': '0', 'description': 'Versión de la lista de usuarios autorizados'}
            )
            new_version = int(config.value) + 1
            config.value = str(new_version)
            config.save()

            # Guardar la versión en la lista
            new_list.version = new_version
            new_list.save()

            return Response({
                'message': f'Importación completada',
                'imported': imported_count,
                'updated': updated_count,
                'desactivated': desactivated_count,
                'errors': errors,
                'list_id': str(new_list.id),
                'semester': semester,
                'new_version': new_version,
                'force_logout_all': True
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'detail': f'Error al procesar el archivo: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

class ListValidUsersView(APIView):
    """
    Endpoint para listar usuarios autorizados.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({
                'detail': 'No tienes permiso para realizar esta acción'
            }, status=status.HTTP_403_FORBIDDEN)

        # Obtener la lista activa
        active_list = ValidUserList.objects.filter(is_active=True).first()

        if not active_list:
            return Response({
                'users': [],
                'total': 0,
                'list': None
            }, status=status.HTTP_200_OK)

        users = ValidUser.objects.filter(list=active_list, is_active=True)

        return Response({
            'users': [{
                'id': str(u.id),
                'identification': u.identification,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'full_name': f"{u.first_name} {u.last_name}".strip(),
                'is_admin': u.is_admin
            } for u in users],
            'total': users.count(),
            'list': {
                'id': str(active_list.id),
                'semester': active_list.semester,
                'uploaded_at': active_list.uploaded_at,
                'uploaded_by': active_list.uploaded_by.email
            }
        }, status=status.HTTP_200_OK)