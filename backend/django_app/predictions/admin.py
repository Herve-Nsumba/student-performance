from django.contrib import admin
from .models import PredictionResult

@admin.register(PredictionResult)
class PredictionResultAdmin(admin.ModelAdmin):
    list_display = ("student", "predicted_value", "risk_level", "created_at")
    list_filter = ("risk_level", "created_at")
