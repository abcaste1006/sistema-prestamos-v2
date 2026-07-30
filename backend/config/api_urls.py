from django.urls import path, include

urlpatterns = [
    path('', include('apps.authentication.urls')),
    path('', include('apps.inventory.urls')),
]
