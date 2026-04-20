from django.urls import path
from . import views

urlpatterns = [
    path('command/', views.voice_command, name='voice_command'),
    path('process-audio/', views.process_audio, name='process_audio'),
    path('generate-audio/', views.generate_audio, name='generate_audio'),
]
