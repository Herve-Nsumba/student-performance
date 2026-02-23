from rest_framework.routers import DefaultRouter
from students.views import StudentViewSet
from records.views import StudentRecordViewSet
from predictions.views import PredictionResultViewSet

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="students")
router.register(r"records", StudentRecordViewSet, basename="records")
router.register(r"predictions", PredictionResultViewSet, basename="predictions")

urlpatterns = router.urls
