from django.urls import path
from .views import BatchPDFProcessView

urlpatterns = [
    path('batch-upload-pdf/', BatchPDFProcessView.as_view(), name='batch-upload-pdf'),
]