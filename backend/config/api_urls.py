from django.urls import path, include

urlpatterns = [
    path('', include('apps.authentication.urls')),
    path('', include('apps.inventory.urls')),
    path('', include('apps.loans.urls')),
    path('', include('apps.valid_users.urls')),  # <-- AGREGAR
]