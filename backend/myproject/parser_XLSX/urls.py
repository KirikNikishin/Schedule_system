from django.urls import path
from .views import UpdateTeachersFromExcelView

urlpatterns = [
    path('update-teachers/', UpdateTeachersFromExcelView.as_view(), name='update_teachers'),
]