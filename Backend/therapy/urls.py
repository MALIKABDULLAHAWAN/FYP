from django.urls import path, include
from therapy.views import (
    SessionListCreateView,
    SessionDetailView,
    SessionStartView,
    SessionEndView,
    SessionAddTrialView,
    TrialStartView,
    TrialFinalizeView,
    SessionAddObservationView,
    GameSessionListCreateView,
    GameSessionDetailView,
    ChildProgressMetricsView,
)
from therapy.api.insight_views import SessionInsightView
from therapy.api.dashboard_views import (
    DashboardStatsView,
    ChildProgressView,
    SessionHistoryView,
)
from therapy.api.game_images import (
    list_game_images,
    get_game_image_detail,
    list_game_categories,
    get_random_game_images,
    list_scenario_images,
    get_scenario_detail,
    get_image_dataset_stats,
)
from therapy.api.image_validation import (
    validate_all_images,
    validate_single_image,
    batch_validate,
    get_validation_report,
    fix_recommendations,
)
from therapy.api.voice_assistant import (
    process_voice_command,
    process_voice_audio,
    stop_voice_playback,
    clear_voice_history,
    voice_assistant_status,
)
from therapy.api.ai_endpoints import (
    ai_chat,
    ai_agents,
    generate_game_question,
    get_personalized_hint,
    continue_story,
    generate_encouragement,
    explain_concept,
    ai_health,
    generate_content,
)

urlpatterns = [
    # --- Existing therapy APIs (unchanged & correct) ---
    path("sessions", SessionListCreateView.as_view(), name="therapy-sessions-list-create"),
    path("sessions/<int:session_id>", SessionDetailView.as_view(), name="therapy-sessions-detail"),
    path("sessions/<int:session_id>/start", SessionStartView.as_view(), name="therapy-sessions-start"),
    path("sessions/<int:session_id>/end", SessionEndView.as_view(), name="therapy-sessions-end"),

    path("sessions/<int:session_id>/trials", SessionAddTrialView.as_view(), name="therapy-trials-add"),
    path("sessions/<int:session_id>/trials/<int:trial_id>/start", TrialStartView.as_view(), name="therapy-trials-start"),
    path("sessions/<int:session_id>/trials/<int:trial_id>/finalize", TrialFinalizeView.as_view(), name="therapy-trials-finalize"),

    path("sessions/<int:session_id>/observations", SessionAddObservationView.as_view(), name="therapy-observations-add"),

    # --- Game Sessions (Child-Friendly UI) ---
    path("children/<int:child_id>/game-sessions", GameSessionListCreateView.as_view(), name="game-sessions-list-create"),
    path("game-sessions/<int:session_id>", GameSessionDetailView.as_view(), name="game-sessions-detail"),
    path("children/<int:child_id>/progress-metrics", ChildProgressMetricsView.as_view(), name="child-progress-metrics"),

    # --- Dashboard & Analytics ---
    path("dashboard/stats", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("children/<int:child_id>/progress", ChildProgressView.as_view(), name="child-progress"),
    path("children/<int:child_id>/insights", SessionInsightView.as_view(), name="child-insights"),
    path("sessions/history", SessionHistoryView.as_view(), name="session-history"),

    # --- Joint Attention Game (legacy routes) ---
    # API
    path("games/ja/", include("therapy.api.game_ja_urls")),

    # UI (HTML/JS)
    path("games/ja/ui/", include("therapy.api.game_ja_urls_ui")),

    # --- Generic Game API (matching, object_discovery, problem_solving, etc.) ---
    path("games/", include("therapy.api.game_generic_urls")),

    # --- Game Image Dataset API ---
    path("images", list_game_images, name="game-images-list"),
    path("images/<int:pk>", get_game_image_detail, name="game-images-detail"),
    path("images/categories", list_game_categories, name="game-images-categories"),
    path("images/random", get_random_game_images, name="game-images-random"),
    path("images/stats", get_image_dataset_stats, name="game-images-stats"),
    
    # --- Scenario Images (Scene Description) ---
    path("scenarios", list_scenario_images, name="scenario-images-list"),
    path("scenarios/<int:pk>", get_scenario_detail, name="scenario-images-detail"),
    
    # --- Image Validation API ---
    path("validate-images", validate_all_images, name="validate-all-images"),
    path("validate-image/<str:game_key>/<str:item_name>", validate_single_image, name="validate-single-image"),
    path("validate-images/batch", batch_validate, name="batch-validate"),
    path("validation-report", get_validation_report, name="validation-report"),
    path("fix-recommendations", fix_recommendations, name="fix-recommendations"),
    
    # --- Voice Assistant API ---
    path("voice/command", process_voice_command, name="voice-command"),
    path("voice/audio", process_voice_audio, name="voice-audio"),
    path("voice/stop", stop_voice_playback, name="voice-stop"),
    path("voice/clear-history", clear_voice_history, name="voice-clear-history"),
    path("voice/status", voice_assistant_status, name="voice-status"),
    
    # --- AI Service API (Unified) ---
    path("ai/chat", ai_chat, name="ai-chat"),
    path("ai/agents", ai_agents, name="ai-agents"),
    path("ai/health", ai_health, name="ai-health"),
    path("ai/game-question", generate_game_question, name="ai-game-question"),
    path("ai/hint", get_personalized_hint, name="ai-hint"),
    path("ai/continue-story", continue_story, name="ai-continue-story"),
    path("ai/encouragement", generate_encouragement, name="ai-encouragement"),
    path("ai/explain", explain_concept, name="ai-explain"),
    path("ai/generate-content", generate_content, name="ai-generate-content"),
]
