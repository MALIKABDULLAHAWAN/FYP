"""
API ENDPOINTS FOR IMAGE VALIDATION
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from pathlib import Path

# Import the validator
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from image_validator import ImageMetadataValidator, validate_game_images


@require_http_methods(["GET"])
def validate_all_images(request):
    """
    GET /api/v1/therapy/validate-images/
    Returns validation report for all game images
    """
    try:
        validator = ImageMetadataValidator()
        
        # Run validation
        validator.validate_all_images()
        summary = validator.get_summary_report()
        
        return JsonResponse({
            "success": True,
            "data": summary
        })
    
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@require_http_methods(["GET"])
def validate_single_image(request, game_key, item_name):
    """
    GET /api/v1/therapy/validate-image/<game_key>/<item_name>/
    Returns validation for a specific image
    """
    try:
        validator = ImageMetadataValidator()
        dataset = validator.load_dataset()
        
        items = dataset.get(game_key, [])
        item = None
        
        for i in items:
            if isinstance(i, dict) and i.get("name") == item_name:
                item = i
                break
        
        if not item:
            return JsonResponse({
                "success": False,
                "error": f"Item '{item_name}' not found in '{game_key}'"
            }, status=404)
        
        result = validator.validate_single_item(item, game_key)
        
        return JsonResponse({
            "success": True,
            "data": result
        })
    
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def batch_validate(request):
    """
    POST /api/v1/therapy/validate-images/batch/
    Batch validate specific items
    """
    try:
        data = json.loads(request.body)
        items = data.get("items", [])  # List of {game_key, item_name}
        
        validator = ImageMetadataValidator()
        results = []
        
        for item_ref in items:
            game_key = item_ref.get("game_key")
            item_name = item_ref.get("item_name")
            
            dataset = validator.load_dataset()
            items_list = dataset.get(game_key, [])
            
            for i in items_list:
                if isinstance(i, dict) and i.get("name") == item_name:
                    result = validator.validate_single_item(i, game_key)
                    results.append(result)
                    break
        
        return JsonResponse({
            "success": True,
            "data": {
                "validated_count": len(results),
                "results": results
            }
        })
    
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@require_http_methods(["GET"])
def get_validation_report(request):
    """
    GET /api/v1/therapy/validation-report/
    Get detailed validation report with recommendations
    """
    try:
        validator = ImageMetadataValidator()
        validator.validate_all_images()
        
        summary = validator.get_summary_report()
        
        # Export to file
        report_path = validator.export_report()
        
        return JsonResponse({
            "success": True,
            "data": {
                "summary": summary,
                "report_file": report_path,
                "total_issues": summary.get("needs_attention", 0),
                "top_issues": summary.get("top_issues", [])
            }
        })
    
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@require_http_methods(["GET"])
def fix_recommendations(request):
    """
    GET /api/v1/therapy/fix-recommendations/
    Get actionable fix recommendations
    """
    try:
        validator = ImageMetadataValidator()
        validator.validate_all_images()
        
        # Collect all recommendations
        fixes = []
        
        for result in validator.validation_results:
            if result.get("status") in ["needs_improvement", "critical"]:
                for rec in result.get("recommendations", []):
                    fixes.append({
                        "item": result.get("name"),
                        "game": result.get("game_key"),
                        "current_score": result.get("overall_score"),
                        "recommendation": rec,
                        "priority": "high" if result.get("status") == "critical" else "medium"
                    })
        
        # Group by priority
        high_priority = [f for f in fixes if f["priority"] == "high"]
        medium_priority = [f for f in fixes if f["priority"] == "medium"]
        
        return JsonResponse({
            "success": True,
            "data": {
                "total_fixes_needed": len(fixes),
                "high_priority_count": len(high_priority),
                "medium_priority_count": len(medium_priority),
                "high_priority": high_priority[:10],
                "medium_priority": medium_priority[:10],
                "quick_wins": [
                    f for f in fixes 
                    if "commons_file" in f["recommendation"] 
                    or "tags" in f["recommendation"]
                ][:5]
            }
        })
    
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)
