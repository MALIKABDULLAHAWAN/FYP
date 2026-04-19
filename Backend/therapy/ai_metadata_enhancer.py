"""
AI-powered metadata enhancer for therapy game images.

Uses AI to generate rich descriptions, alternative search terms,
and better image sources for game items.
"""
import os
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional
from groq import Groq

# Initialize Groq client
groq_client = None
try:
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        groq_client = Groq(api_key=api_key)
except Exception:
    pass


def generate_enhanced_metadata(
    item_name: str,
    category: str,
    existing_metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Use AI to generate enhanced metadata for a game item.
    
    Args:
        item_name: Name of the item (e.g., "Cat", "Apple")
        category: Category of the item (e.g., "animal", "food")
        existing_metadata: Current metadata from JSON
        
    Returns:
        Enhanced metadata with AI-generated descriptions and tags
    """
    if not groq_client:
        return existing_metadata
    
    try:
        prompt = f"""Generate enhanced metadata for a therapy game item used in child speech therapy.

Item: {item_name}
Category: {category}

Provide:
1. A child-friendly description (1 sentence, simple words)
2. 3-5 alternative search terms for finding better images
3. Educational context (why this item is good for therapy)

Format as JSON:
{{
  "child_description": "...",
  "search_terms": ["term1", "term2", ...],
  "therapy_context": "...",
  "difficulty_level": "beginner|intermediate|advanced"
}}"""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a speech therapy assistant. Always respond with valid JSON only, no markdown or explanations."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        
        ai_metadata = json.loads(content)
        
        # Merge with existing metadata
        enhanced = dict(existing_metadata)
        enhanced.update({
            "ai_description": ai_metadata.get("child_description"),
            "ai_search_terms": ai_metadata.get("search_terms", []),
            "therapy_context": ai_metadata.get("therapy_context"),
            "difficulty_level": ai_metadata.get("difficulty_level", "beginner")
        })
        
        return enhanced
        
    except Exception as e:
        print(f"AI metadata generation failed for {item_name}: {e}")
        return existing_metadata


def get_unsplash_image_url(search_term: str, width: int = 320, height: int = 320) -> str:
    """
    Generate Unsplash Source URL for better quality images.
    
    Unsplash Source provides free, high-quality photos without API key.
    """
    # Clean search term
    clean_term = search_term.lower().replace(" ", ",")
    return f"https://source.unsplash.com/{width}x{height}/?{clean_term}"


def get_pexels_image_url(search_term: str, width: int = 320, height: int = 320) -> str:
    """
    Generate Pexels image URL (requires API key for production).
    For now, returns a placeholder that can be upgraded.
    """
    # Pexels requires API key, so we'll use Lorem Picsum as fallback
    seed = abs(hash(search_term)) % 1000
    return f"https://picsum.photos/seed/{seed}/{width}/{height}"


def enhance_image_url(
    item_name: str,
    loremflickr_tags: List[str],
    ai_search_terms: Optional[List[str]] = None
) -> str:
    """
    Generate the best possible image URL using available services.
    
    Priority:
    1. Unsplash (best quality, no API key needed)
    2. Lorem Flickr with AI-enhanced tags
    3. Lorem Picsum (geometric fallback)
    """
    # Use AI search terms if available, otherwise use loremflickr tags
    search_terms = ai_search_terms or loremflickr_tags
    
    if search_terms:
        # Use first 2 terms for Unsplash
        primary_terms = search_terms[:2]
        return get_unsplash_image_url(",".join(primary_terms))
    
    # Fallback to item name
    return get_unsplash_image_url(item_name)


def enhance_dataset_metadata(input_path: Path, output_path: Path) -> None:
    """
    Process the entire dataset and enhance metadata with AI.
    
    Args:
        input_path: Path to labeled_game_images.json
        output_path: Path to save enhanced version
    """
    if not input_path.exists():
        print(f"Input file not found: {input_path}")
        return
    
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)
    
    enhanced_data = {
        "version": data.get("version", 3),
        "description": data.get("description", "") + " [AI Enhanced]",
    }
    
    # Process each game type
    for game_key in ["memory_match", "object_discovery", "scene_description", "problem_solving"]:
        if game_key not in data:
            continue
            
        enhanced_items = []
        items = data[game_key]
        
        print(f"\nEnhancing {game_key} ({len(items)} items)...")
        
        for item in items:
            item_name = item.get("name") or item.get("title", "Unknown")
            category = item.get("category", "general")
            
            print(f"  Processing: {item_name}")
            
            # Generate AI metadata
            enhanced_metadata = generate_enhanced_metadata(
                item_name,
                category,
                item.get("metadata", {})
            )
            
            # Enhance image URL
            ai_search_terms = enhanced_metadata.get("ai_search_terms")
            enhanced_image_url_val = enhance_image_url(
                item_name,
                item.get("loremflickr_tags", []),
                ai_search_terms
            )
            
            # Update item
            enhanced_item = dict(item)
            enhanced_item["metadata"] = enhanced_metadata
            enhanced_item["enhanced_image_url"] = enhanced_image_url_val
            
            enhanced_items.append(enhanced_item)
        
        enhanced_data[game_key] = enhanced_items
    
    # Save enhanced dataset
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(enhanced_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Enhanced dataset saved to: {output_path}")


if __name__ == "__main__":
    # Run enhancement
    base_dir = Path(__file__).resolve().parent
    input_file = base_dir / "data" / "labeled_game_images.json"
    output_file = base_dir / "data" / "labeled_game_images_enhanced.json"
    
    enhance_dataset_metadata(input_file, output_file)
