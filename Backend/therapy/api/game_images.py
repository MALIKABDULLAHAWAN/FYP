"""
API endpoints for Game Image datasets.
Provides images for Memory Match, Object Discovery, Problem Solving games.
"""
from __future__ import annotations

from typing import List, Optional

from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from therapy.dataset_metadata import get_game_item_metadata, get_scenario_metadata
from therapy.models import GameImage, ScenarioImage


# ═══════════════════════════════════════════════════════════════
# Serializers
# ═══════════════════════════════════════════════════════════════

class GameImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = GameImage
        fields = [
            "id", "name", "game_type", "category", "image_url", "emoji",
            "difficulty", "tags", "metadata", "question", "correct_answer", "options",
            "hint", "is_active", "usage_count", "created_at"
        ]

    def get_metadata(self, obj: GameImage) -> dict:
        return get_game_item_metadata(obj.game_type, obj.name)

    def get_image_url(self, obj: GameImage) -> Optional[str]:
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["emoji"] = ""
        return data


class ScenarioImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = ScenarioImage
        fields = [
            "id", "title", "image_url", "expected_description", "level",
            "key_elements", "metadata", "is_active", "created_at"
        ]

    def get_metadata(self, obj: ScenarioImage) -> dict:
        return get_scenario_metadata(obj.title)

    def get_image_url(self, obj: ScenarioImage) -> Optional[str]:
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# ═══════════════════════════════════════════════════════════════
# Game Image Endpoints
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_game_images(request):
    """
    List game images with filtering.
    
    Query params:
        - game_type: memory_match|object_discovery|problem_solving|etc.
        - category: animal|food|vehicle|etc.
        - difficulty: 1|2|3
        - tags: comma-separated tags
    """
    game_type = request.query_params.get("game_type")
    category = request.query_params.get("category")
    difficulty = request.query_params.get("difficulty")
    tags = request.query_params.get("tags")
    
    queryset = GameImage.objects.filter(is_active=True)
    
    if game_type:
        queryset = queryset.filter(game_type=game_type)
    if category:
        queryset = queryset.filter(category__iexact=category)
    if difficulty:
        queryset = queryset.filter(difficulty=int(difficulty))
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            queryset = queryset.filter(tags__contains=[tag])
    
    # Limit results for performance
    queryset = queryset[:100]
    
    serializer = GameImageSerializer(queryset, many=True, context={"request": request})
    return Response({
        "count": len(serializer.data),
        "results": serializer.data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_game_image_detail(request, pk):
    """Get a single game image by ID."""
    image = get_object_or_404(GameImage, pk=pk, is_active=True)
    serializer = GameImageSerializer(image, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_game_categories(request):
    """List all available game image categories."""
    categories = GameImage.objects.filter(is_active=True).values_list(
        "game_type", "category"
    ).distinct().order_by("game_type", "category")
    
    result = {}
    for game_type, category in categories:
        if game_type not in result:
            result[game_type] = []
        if category:
            result[game_type].append(category)
    
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_random_game_images(request):
    """
    Get random game images for a game session.
    
    Query params:
        - game_type: required
        - count: number of images (default 8)
        - difficulty: filter by difficulty
    """
    import random
    
    game_type = request.query_params.get("game_type")
    count = int(request.query_params.get("count", 8))
    difficulty = request.query_params.get("difficulty")
    
    if not game_type:
        return Response(
            {"error": "game_type parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    queryset = GameImage.objects.filter(game_type=game_type, is_active=True)
    
    if difficulty:
        queryset = queryset.filter(difficulty=int(difficulty))
    
    # Get all matching images
    images = list(queryset)
    
    if len(images) < count:
        return Response({
            "warning": f"Only {len(images)} images available",
            "results": GameImageSerializer(images, many=True, context={"request": request}).data
        })
    
    # Random selection
    selected = random.sample(images, count)
    
    # Update usage count
    for img in selected:
        img.usage_count += 1
        img.save(update_fields=["usage_count"])
    
    serializer = GameImageSerializer(selected, many=True, context={"request": request})
    return Response({
        "count": len(serializer.data),
        "results": serializer.data
    })


# ═══════════════════════════════════════════════════════════════
# Scenario Image Endpoints (Scene Description Game)
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_scenario_images(request):
    """
    List scenario images for Scene Description game.
    
    Query params:
        - level: 1|2|3
        - count: number of images to return
    """
    import random
    
    level = request.query_params.get("level")
    count = int(request.query_params.get("count", 10))
    
    queryset = ScenarioImage.objects.filter(is_active=True)
    
    if level:
        queryset = queryset.filter(level=int(level))
    
    images = list(queryset)
    
    if len(images) > count:
        images = random.sample(images, count)
    
    serializer = ScenarioImageSerializer(images, many=True, context={"request": request})
    return Response({
        "count": len(serializer.data),
        "results": serializer.data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_scenario_detail(request, pk):
    """Get a single scenario image by ID."""
    scenario = get_object_or_404(ScenarioImage, pk=pk, is_active=True)
    serializer = ScenarioImageSerializer(scenario, context={"request": request})
    return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════
# Stats & Management
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_image_dataset_stats(request):
    """Get statistics about the image datasets."""
    from django.db.models import Count
    
    # Game image stats
    game_stats = GameImage.objects.values("game_type").annotate(
        count=Count("id"),
        categories=Count("category", distinct=True)
    ).order_by("game_type")
    
    # Scenario stats
    scenario_stats = ScenarioImage.objects.values("level").annotate(
        count=Count("id")
    ).order_by("level")
    
    # Total counts
    total_game_images = GameImage.objects.count()
    total_scenarios = ScenarioImage.objects.count()
    
    return Response({
        "total_game_images": total_game_images,
        "total_scenarios": total_scenarios,
        "by_game_type": list(game_stats),
        "scenarios_by_level": list(scenario_stats),
    })
