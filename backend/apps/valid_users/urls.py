from django.urls import path
from .infrastructure.views import ImportUsersView, ListValidUsersView

urlpatterns = [
    path('admin/users/import/', ImportUsersView.as_view(), name='users-import'),
    path('admin/users/valid/', ListValidUsersView.as_view(), name='users-valid'),
]