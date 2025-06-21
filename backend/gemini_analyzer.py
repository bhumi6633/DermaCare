import google.generativeai as genai
import json
from typing import Dict, List, Optional, Any

# Type hints to help linter understand the module
configure = genai.configure  # type: ignore
GenerativeModel = genai.GenerativeModel  # type: ignore

class GeminiAnalyzer:
    def __init__(self, api_key: str):
        """Initialize Gemini AI with manually provided API key."""
        if not api_key:
            raise ValueError("Gemini API key must be provided.")
        configure(api_key=api_key)
        self.model = GenerativeModel("gemini-1.5-flash")

    def analyze_ingredients(self, ingredients_list: List[str], user_profile: Optional[Dict] = None) -> Dict[str, Any]:
        """Use Gemini to analyze ingredients and return a safety score, insights, and recommendations."""
        profile_context = ""
        if user_profile:
            profile_context = f"""
User Profile:
- Age Group: {user_profile.get('age', '').replace('_', '-') or 'Unknown'}
- Gender: {user_profile.get('gender', '') or 'Unknown'}
- Skin Type: {user_profile.get('skinType', '') or 'Unknown'}
"""

        prompt = f"""
You are a certified dermatologist and skincare expert. Analyze the following skincare ingredients.

Use this severity scale:
- CRITICAL (-30 to -40): Carcinogens, hormone disruptors
- HIGH (-20 to -30): Strong irritants, allergens
- MODERATE (-10 to -20): Drying alcohols, sulfates
- LOW (-3 to -10): Fragrances, synthetic fillers
- SAFE (0): Generally safe

{profile_context}

Ingredients to analyze:
{", ".join(ingredients_list)}

Respond only in this exact JSON format:
{{
  "safety_score": 85,
  "score_category": "Good",
  "harmful_ingredients": {{
    "ingredient_name": {{
      "severity": "HIGH",
      "reason": "Known allergen",
      "severity_score": -25,
      "alternatives": "Use gentler preservatives"
    }}
  }},
  "recommendations": {{
    "products": ["Product 1", "Product 2"],
    "tips": ["Tip 1", "Tip 2"],
    "avoid_ingredients": ["paraben"],
    "look_for_ingredients": ["niacinamide", "ceramides"]
  }},
  "analysis_summary": "Summary of the product's safety profile."
}}
"""

        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON from Gemini: {e}")
        except Exception as e:
            raise Exception(f"Gemini analysis failed: {e}")
