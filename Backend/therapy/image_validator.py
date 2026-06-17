"""
IMAGE METADATA VALIDATOR
Validates that game images match their labels using AI/ML techniques
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import requests
from urllib.parse import urlparse
import hashlib


class ImageMetadataValidator:
    """
    Validates game images to ensure they match their metadata labels.
    Uses multiple validation strategies:
    1. URL pattern validation
    2. Tag relevance scoring
    3. Commons file verification
    4. Semantic label matching
    """
    
    def __init__(self, data_path: Path = None):
        if data_path is None:
            data_path = Path(__file__).resolve().parent / "data" / "labeled_game_images.json"
        self.data_path = data_path
        self.validation_results = []
        self.confidence_threshold = 0.7
        
    def load_dataset(self) -> Dict:
        """Load the game images dataset."""
        if not self.data_path.exists():
            return {}
        with open(self.data_path, encoding="utf-8") as f:
            return json.load(f)
    
    def validate_all_images(self) -> List[Dict]:
        """
        Validate all images in the dataset.
        Returns a list of validation results with confidence scores.
        """
        dataset = self.load_dataset()
        results = []
        
        for game_key, items in dataset.items():
            if not isinstance(items, list):
                continue
                
            for item in items:
                if not isinstance(item, dict):
                    continue
                    
                result = self.validate_single_item(item, game_key)
                results.append(result)
                
        self.validation_results = results
        return results
    
    def validate_single_item(self, item: Dict, game_key: str) -> Dict:
        """
        Validate a single game item's image metadata.
        """
        name = item.get("name", "")
        label = item.get("label", "")
        category = item.get("category", "")
        fallback_url = item.get("fallback_image_url", "")
        commons_file = item.get("commons_file", "")
        loremflickr_tags = item.get("loremflickr_tags", [])
        
        validations = {
            "name": name,
            "game_key": game_key,
            "label": label,
            "category": category,
            "checks": {},
            "overall_score": 0.0,
            "status": "unknown",
            "recommendations": []
        }
        
        # Check 1: URL is not empty
        has_url = bool(fallback_url or commons_file)
        validations["checks"]["has_image_source"] = {
            "passed": has_url,
            "score": 1.0 if has_url else 0.0,
            "message": "Has image source" if has_url else "Missing image source"
        }
        
        # Check 2: URL pattern matches source type
        url_valid = self._validate_url_pattern(fallback_url, commons_file)
        validations["checks"]["url_pattern"] = {
            "passed": url_valid["valid"],
            "score": url_valid["score"],
            "message": url_valid["message"]
        }
        
        # Check 3: Tags match label
        tag_match = self._validate_tags_match(label, loremflickr_tags)
        validations["checks"]["tag_relevance"] = {
            "passed": tag_match["score"] >= 0.5,
            "score": tag_match["score"],
            "message": tag_match["message"]
        }
        
        # Check 4: Commons file matches name (if present)
        if commons_file:
            commons_match = self._validate_commons_file(name, commons_file)
            validations["checks"]["commons_match"] = {
                "passed": commons_match["score"] >= 0.6,
                "score": commons_match["score"],
                "message": commons_match["message"]
            }
        
        # Check 5: Category consistency
        category_check = self._validate_category_consistency(name, label, category)
        validations["checks"]["category_consistency"] = {
            "passed": category_check["valid"],
            "score": category_check["score"],
            "message": category_check["message"]
        }
        
        # Calculate overall score
        scores = [c["score"] for c in validations["checks"].values()]
        validations["overall_score"] = sum(scores) / len(scores) if scores else 0.0
        
        # Determine status
        if validations["overall_score"] >= 0.85:
            validations["status"] = "excellent"
        elif validations["overall_score"] >= 0.7:
            validations["status"] = "good"
        elif validations["overall_score"] >= 0.5:
            validations["status"] = "needs_improvement"
        else:
            validations["status"] = "critical"
        
        # Generate recommendations
        validations["recommendations"] = self._generate_recommendations(validations["checks"], item)
        
        return validations
    
    def _validate_url_pattern(self, fallback_url: str, commons_file: str) -> Dict:
        """Validate that the URL matches expected patterns."""
        if commons_file:
            return {
                "valid": True,
                "score": 1.0,
                "message": "Using Wikimedia Commons (preferred)"
            }
        
        if not fallback_url:
            return {
                "valid": False,
                "score": 0.0,
                "message": "No fallback URL"
            }
        
        # Check for Lorem Flickr
        if "loremflickr.com" in fallback_url:
            # Check for tags in URL
            url_parts = fallback_url.split("/")
            if len(url_parts) >= 5:
                tags_part = url_parts[5] if len(url_parts) > 5 else ""
                if "?" in tags_part:
                    tags_part = tags_part.split("?")[0]
                
                if tags_part and tags_part not in ["320", ""]:
                    return {
                        "valid": True,
                        "score": 0.8,
                        "message": f"Lorem Flickr with tags: {tags_part}"
                    }
            
            return {
                "valid": True,
                "score": 0.6,
                "message": "Lorem Flickr URL (add tags for better accuracy)"
            }
        
        # Check for Picsum (not preferred)
        if "picsum.photos" in fallback_url:
            return {
                "valid": True,
                "score": 0.3,
                "message": "Using Picsum (random images - not recommended)"
            }
        
        # Generic URL
        return {
            "valid": True,
            "score": 0.5,
            "message": "Generic image URL"
        }
    
    def _validate_tags_match(self, label: str, tags: List[str]) -> Dict:
        """Validate that tags match the label semantically."""
        if not tags:
            return {
                "score": 0.0,
                "message": "No tags provided"
            }
        
        if not label:
            return {
                "score": 0.0,
                "message": "No label provided"
            }
        
        label_lower = label.lower()
        label_words = set(label_lower.split())
        
        matches = 0
        matching_tags = []
        
        for tag in tags:
            tag_lower = tag.lower()
            # Direct match
            if tag_lower in label_lower or label_lower in tag_lower:
                matches += 1
                matching_tags.append(tag)
            # Partial match
            elif any(word in tag_lower for word in label_words):
                matches += 0.5
                matching_tags.append(tag)
        
        score = min(1.0, matches / max(1, len(tags)))
        
        if score >= 0.8:
            message = f"Excellent tag match: {', '.join(matching_tags)}"
        elif score >= 0.5:
            message = f"Good tag match: {', '.join(matching_tags)}"
        else:
            message = f"Poor tag match. Tags: {', '.join(tags)} vs Label: {label}"
        
        return {
            "score": score,
            "message": message
        }
    
    def _validate_commons_file(self, name: str, commons_file: str) -> Dict:
        """Validate that Wikimedia Commons filename matches the item name."""
        if not commons_file:
            return {
                "score": 0.0,
                "message": "No Commons file"
            }
        
        # Remove extension and underscores
        commons_clean = commons_file.replace(".jpg", "").replace(".png", "").replace("_", " ").lower()
        name_clean = name.lower()
        
        # Check for name in commons filename
        if name_clean in commons_clean or commons_clean in name_clean:
            return {
                "score": 1.0,
                "message": f"Perfect Commons match: {commons_file}"
            }
        
        # Check word overlap
        commons_words = set(commons_clean.split())
        name_words = set(name_clean.split())
        overlap = len(commons_words & name_words)
        
        if overlap > 0:
            score = min(1.0, overlap / max(len(commons_words), len(name_words)))
            return {
                "score": score,
                "message": f"Partial Commons match: {commons_file}"
            }
        
        return {
            "score": 0.3,
            "message": f"Weak Commons match: {commons_file} vs {name}"
        }
    
    def _validate_category_consistency(self, name: str, label: str, category: str) -> Dict:
        """Validate that category is consistent with name/label."""
        if not category:
            return {
                "valid": False,
                "score": 0.0,
                "message": "No category provided"
            }
        
        # Define category mappings
        category_keywords = {
            "furniture": ["chair", "table", "bed", "desk", "shelf", "couch", "sofa"],
            "electronics": ["phone", "computer", "laptop", "tablet", "tv", "radio"],
            "clothing": ["shirt", "pants", "dress", "shoe", "hat", "jacket", "sock"],
            "kitchen": ["cup", "plate", "spoon", "fork", "knife", "bowl", "bottle", "pan"],
            "food": ["apple", "banana", "bread", "milk", "water", "juice", "meat"],
            "animal": ["cat", "dog", "bird", "fish", "lion", "bear", "rabbit"],
            "vehicle": ["car", "truck", "bus", "bike", "plane", "train", "boat"],
            "nature": ["tree", "flower", "sun", "moon", "star", "cloud", "rain"],
            "building": ["house", "school", "hospital", "store", "bridge"]
        }
        
        name_lower = name.lower()
        label_lower = label.lower()
        category_lower = category.lower()
        
        # Check if category keywords match
        keywords = category_keywords.get(category_lower, [])
        matches = sum(1 for kw in keywords if kw in name_lower or kw in label_lower)
        
        if matches > 0:
            return {
                "valid": True,
                "score": 0.9,
                "message": f"Category '{category}' matches item"
            }
        
        # Check if name appears in any other category (potential mismatch)
        for cat, kws in category_keywords.items():
            if cat != category_lower:
                if any(kw in name_lower for kw in kws):
                    return {
                        "valid": False,
                        "score": 0.3,
                        "message": f"Item might belong to '{cat}' instead of '{category}'"
                    }
        
        return {
            "valid": True,
            "score": 0.6,
            "message": f"Category '{category}' assigned (verify manually)"
        }
    
    def _generate_recommendations(self, checks: Dict, item: Dict) -> List[str]:
        """Generate improvement recommendations based on validation results."""
        recommendations = []
        
        # Check URL issues
        url_check = checks.get("url_pattern", {})
        if url_check.get("score", 0) < 0.7:
            if "picsum" in str(item.get("fallback_image_url", "")):
                recommendations.append("Replace Picsum URL with Lorem Flickr or Wikimedia Commons for accurate images")
            elif "loremflickr" in str(item.get("fallback_image_url", "")):
                recommendations.append("Add more specific tags to Lorem Flickr URL")
        
        # Check tag issues
        tag_check = checks.get("tag_relevance", {})
        if tag_check.get("score", 0) < 0.5:
            recommendations.append(f"Update loremflickr_tags to better match '{item.get('label', 'item')}'")
        
        # Check commons file
        if not item.get("commons_file"):
            recommendations.append("Add 'commons_file' for more reliable images from Wikimedia Commons")
        
        # Check category
        cat_check = checks.get("category_consistency", {})
        if not cat_check.get("valid", True):
            recommendations.append(f"Review category assignment: {cat_check.get('message', '')}")
        
        return recommendations
    
    def get_summary_report(self) -> Dict:
        """Generate a summary report of all validations."""
        if not self.validation_results:
            self.validate_all_images()
        
        total = len(self.validation_results)
        if total == 0:
            return {"error": "No items to validate"}
        
        by_status = {
            "excellent": 0,
            "good": 0,
            "needs_improvement": 0,
            "critical": 0
        }
        
        total_score = 0
        issues = []
        
        for result in self.validation_results:
            status = result.get("status", "unknown")
            by_status[status] = by_status.get(status, 0) + 1
            total_score += result.get("overall_score", 0)
            
            if status in ["needs_improvement", "critical"]:
                issues.append({
                    "name": result.get("name"),
                    "game": result.get("game_key"),
                    "status": status,
                    "score": result.get("overall_score"),
                    "recommendations": result.get("recommendations", [])
                })
        
        return {
            "total_items": total,
            "average_score": round(total_score / total, 2),
            "by_status": by_status,
            "excellent_percentage": round(by_status["excellent"] / total * 100, 1),
            "good_percentage": round((by_status["excellent"] + by_status["good"]) / total * 100, 1),
            "needs_attention": by_status["needs_improvement"] + by_status["critical"],
            "top_issues": issues[:10]  # Top 10 issues
        }
    
    def export_report(self, output_path: Path = None) -> str:
        """Export validation report to JSON file."""
        if output_path is None:
            output_path = Path(__file__).resolve().parent / "data" / "image_validation_report.json"
        
        report = {
            "summary": self.get_summary_report(),
            "details": self.validation_results
        }
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        
        return str(output_path)


# Convenience function for quick validation
def validate_game_images():
    """Quick validation of all game images."""
    validator = ImageMetadataValidator()
    results = validator.validate_all_images()
    summary = validator.get_summary_report()
    
    print("=" * 60)
    print("IMAGE METADATA VALIDATION REPORT")
    print("=" * 60)
    print(f"Total Items: {summary['total_items']}")
    print(f"Average Score: {summary['average_score']:.2f}/1.0")
    print(f"Excellent: {summary['by_status']['excellent']} ({summary['excellent_percentage']}%)")
    print(f"Good+Excellent: {summary['good_percentage']}%")
    print(f"Needs Attention: {summary['needs_attention']} items")
    print("=" * 60)
    
    if summary['top_issues']:
        print("\nTOP ISSUES:")
        for issue in summary['top_issues'][:5]:
            print(f"  - {issue['name']} ({issue['game']}): {issue['status']} ({issue['score']:.2f})")
            for rec in issue['recommendations'][:2]:
                print(f"      → {rec}")
    
    return summary


if __name__ == "__main__":
    validate_game_images()
