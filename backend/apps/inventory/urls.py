from django.urls import path
from .infrastructure.views import EquipmentListView, EquipmentDetailView

urlpatterns = [
    path('equipment/', EquipmentListView.as_view(), name='equipment-list'),
    path('equipment/<uuid:pk>/', EquipmentDetailView.as_view(), name='equipment-detail'),
]
