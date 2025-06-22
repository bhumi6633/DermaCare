from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import re
import hmac
import hashlib
import time
import base64

# INCI Beauty API credentials
ACCESS_KEY = "df9e2b9cd6a94aa0"
SECRET_KEY = "QlIbnGvMx7ZceKenANc9Cm7XSLuHb64a"

# Gemini API Key for AI recommendations
GEMINI_API_KEY = "AIzaSyCTHv7Z6IIMxp78tksAZ_y14RPc0FJn7SU"

# SerpAPI Key for product recommendations
SERPAPI_KEY = "3e61eaca77010dc489451152be4e2402c6d93cc73a360f2f0ce9f2e700a87bf0"

# Initialize Gemini AI for recommendations
try:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)  # type: ignore
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")  # type: ignore
    AI_AVAILABLE = True
    print("AI recommendations enabled")
except Exception as e:
    print(f"AI not available: {e}")
    AI_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Load harmful ingredients database
def load_bad_ingredients():
    try:
        with open('data/bad_ingredients.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("bad_ingredients.json not found.")
        return {}

# Load skincare recommendations
def load_skincare_recommendations():
    try:
        with open('data/skincare_recommendations.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(" skincare_recommendations.json not found.")
        return {}

BAD_INGREDIENTS = load_bad_ingredients()
SKINCARE_RECOMMENDATIONS = load_skincare_recommendations()

# Simple scan cache to avoid hammering the API
recent_scans = {}
SCAN_TIMEOUT = 10  # seconds

def has_scanned_recently(barcode):
    now = time.time()
    if barcode in recent_scans and now - recent_scans[barcode] < SCAN_TIMEOUT:
        return True
    recent_scans[barcode] = now
    return False

# Parse ingredients string into list
def parse_ingredients(ingredients_text):
    if not ingredients_text:
        return []
    return [i.strip().lower() for i in re.split(r'[,;.\n\u2022]', ingredients_text) if i.strip()]

# Check for harmful ingredients
def analyze_ingredients(ingredients_list):
    harmful_found = {}
    total_harmful = 0
    total_weightage = 0
    found_ingredients = set()  # Track found ingredients to avoid duplicates
    
    for ingredient in ingredients_list:
        for category, data in BAD_INGREDIENTS.items():
            for bad in data['ingredients']:
                if bad.lower() in ingredient and ingredient not in found_ingredients:
                    if category not in harmful_found:
                        harmful_found[category] = {
                            'description': data['description'],
                            'severity': data.get('severity', 'MODERATE'),
                            'weightage': data.get('weightage', 10),
                            'ingredients': []
                        }
                    harmful_found[category]['ingredients'].append(ingredient)
                    found_ingredients.add(ingredient)  # Mark as found
                    total_harmful += 1
                    total_weightage += data.get('weightage', 10)
    
    # Calculate safety score based on weightages
    safety_score = max(0, 100 - total_weightage)
    
    return {
        'safe': total_harmful == 0,
        'harmful_count': total_harmful,
        'total_weightage': total_weightage,
        'harmful_ingredients': harmful_found,
        'total_ingredients_checked': len(ingredients_list),
        'safety_score': safety_score
    }

# Fetch product info from INCI Beauty
def get_product_info_from_incibeauty(ean):
    try:
        path = f"/product/composition/{ean}/en_GB?accessKeyId={ACCESS_KEY}"
        hmac_signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            path.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        url = f"https://api.incibeauty.com{path}&hmac={hmac_signature}"
        print("Calling:", url)

        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()

            # Handle compositions as a list
            compositions_list = data.get('compositions', [])
            ingredients_raw = []

            if compositions_list and isinstance(compositions_list, list):
                ingredients_raw = compositions_list[0].get('ingredients', [])

            ingredients_str = ", ".join([ing.get('name') or ing.get('official_name') for ing in ingredients_raw if ing.get('name') or ing.get('official_name')])

            product_title = data.get('name', 'Unknown Product')
            product_brand = data.get('brand', 'Unknown Brand')
            
            # Search for product image on the internet
            product_image = search_product_image(product_title, product_brand)
            
            # Fallback to INCI Beauty image if internet search fails
            if not product_image:
                product_image = data.get('images', {}).get('image')
                if product_image:
                    print(f" Using INCI Beauty image as fallback")

            return {
                'title': product_title,
                'brand': product_brand,
                'ingredients': ingredients_str,
                'image': product_image
            }

        else:
            print(f"[INCI] Status Code: {response.status_code} | Body: {response.text}")

    except Exception as e:
        print(f"[INCI Beauty] Error: {e}")

    return None

def search_product_image(product_title, product_brand):
    """Search for product image using SerpAPI image search"""
    if not SERPAPI_KEY or SERPAPI_KEY == "your_serpapi_key_here":
        print("SerpAPI key not configured for image search")
        return None
    
    try:
        # Create search query with brand and product name
        search_query = f"{product_brand} {product_title}"
        print(f"Searching for product image: {search_query}")
        
        url = "https://serpapi.com/search"
        params = {
            "q": search_query,
            "api_key": SERPAPI_KEY,
            "engine": "google",
            "tbm": "isch",  # Image search
            "num": 3,  # Get first 3 images to try
            "safe": "active",
            "img_type": "photo"  # Prefer product photos
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Image search response keys: {list(data.keys())}")
            images_results = data.get('images_results', [])
            
            print(f"🖼️ Found {len(images_results)} image results")
            
            if images_results:
                # Try to find the best image (prefer original size)
                for i, img in enumerate(images_results[:3]):
                    print(f"🔍 Checking image {i+1}: {list(img.keys())}")
                    
                    # Prefer images marked as products
                    is_product = img.get('is_product', False)
                    image_url = img.get('original') or img.get('thumbnail')
                    
                    if image_url:
                        print(f" Found product image: {image_url[:50]}... (Product: {is_product})")
                        return image_url
                
                print(" No valid images found in search results")
            else:
                print(" No images found in search results")
        else:
            print(f" Image search failed: {response.status_code}")
            print(f" Error response: {response.text}")
            
    except Exception as e:
        print(f" Image search error: {e}")
    
    return None

def get_personalized_analysis(ingredients_list, user_profile):
    """
    Analyze ingredients with personalized scoring based on user profile
    Returns: dict with safety verdict, personalized score, and recommendations
    """
    harmful_found = {}
    total_harmful = 0
    total_weightage = 0
    found_ingredients = set()  # Track found ingredients to avoid duplicates
    personalized_score = 100  # Start with perfect score

    # Base analysis with weightages
    for ingredient in ingredients_list:
        for category, data in BAD_INGREDIENTS.items():
            for bad in data['ingredients']:
                if bad.lower() in ingredient and ingredient not in found_ingredients:
                    if category not in harmful_found:
                        harmful_found[category] = {
                            'description': data['description'],
                            'severity': data.get('severity', 'MODERATE'),
                            'weightage': data.get('weightage', 10),
                            'ingredients': []
                        }
                    harmful_found[category]['ingredients'].append(ingredient)
                    found_ingredients.add(ingredient)  # Mark as found
                    total_harmful += 1
                    total_weightage += data.get('weightage', 10)

    # Calculate base safety score using weightages
    base_safety_score = max(0, 100 - total_weightage)
    personalized_score = base_safety_score

    # Personalized scoring based on user profile
    if user_profile:
        age = user_profile.get('age', '')
        gender = user_profile.get('gender', '')
        skin_type = user_profile.get('skinType', '')

        # Age-based adjustments (multiplier for weightage impact)
        age_multiplier = 1.0
        if age == 'under_18':
            # Young skin is more sensitive to all ingredients
            age_multiplier = 1.3
        elif age == '18_32':
            # Young adult skin can handle some ingredients better
            age_multiplier = 1.0
        elif age == '32_56':
            # Mature skin needs gentler ingredients
            age_multiplier = 1.1
        elif age == '56_plus':
            # Senior skin is most sensitive
            age_multiplier = 1.4

        # Apply age multiplier to weightage
        adjusted_weightage = total_weightage * age_multiplier
        personalized_score = max(0, 100 - adjusted_weightage)

        # Skin type adjustments (additional penalties for specific ingredients)
        if skin_type == 'dry':
            # Dry skin is more sensitive to drying ingredients
            for category, data in harmful_found.items():
                if 'alcohols' in category or 'sulfates' in category:
                    personalized_score -= data.get('weightage', 10) * 0.2  # Additional 20% penalty
        elif skin_type == 'oily':
            # Oily skin can handle some ingredients better but sensitive to comedogenic ones
            for category, data in harmful_found.items():
                if 'mineral_oil' in category:
                    personalized_score -= data.get('weightage', 10) * 0.3  # Additional 30% penalty
        elif skin_type == 'combination':
            # Combination skin needs balanced approach
            personalized_score -= total_weightage * 0.1  # Additional 10% penalty

    # Ensure score doesn't go below 0
    personalized_score = max(0, personalized_score)

    # Get personalized recommendations
    recommendations = get_personalized_recommendations(user_profile)

    return {
        'safe': total_harmful == 0,
        'harmful_count': total_harmful,
        'total_weightage': total_weightage,
        'harmful_ingredients': harmful_found,
        'total_ingredients_checked': len(ingredients_list),
        'personalized_score': round(personalized_score),
        'score_category': get_score_category(personalized_score),
        'recommendations': recommendations
    }

def get_score_category(score):
    """Convert numerical score to category"""
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 60:
        return "Fair"
    elif score >= 40:
        return "Poor"
    else:
        return "Very Poor"

def get_product_recommendations_serpapi(user_profile, current_product_info):
    """Get product recommendations using SerpAPI based on user profile and current product"""
    if not SERPAPI_KEY or SERPAPI_KEY == "your_serpapi_key_here":
        print(" SerpAPI key not configured")
        return None
    
    try:
        print(f"🔍 Starting SerpAPI search for product: {current_product_info.get('title', 'Unknown')}")
        
        # Build search query based on user profile and current product
        search_terms = []
        
        # Add skin type specific terms (use default if no profile)
        skin_type = user_profile.get('skinType', 'normal') if user_profile else 'normal'
        if skin_type == 'dry':
            search_terms.extend(['hydrating', 'moisturizing', 'gentle'])
        elif skin_type == 'oily':
            search_terms.extend(['oil-free', 'non-comedogenic', 'mattifying'])
        elif skin_type == 'combination':
            search_terms.extend(['balancing', 'gentle', 'non-irritating'])
        elif skin_type == 'sensitive':
            search_terms.extend(['fragrance-free', 'hypoallergenic', 'gentle'])
        else:
            # Default for normal skin or no profile
            search_terms.extend(['gentle', 'effective'])
        
        # Add age-specific terms (use default if no profile)
        age = user_profile.get('age', '18_32') if user_profile else '18_32'
        if age == 'under_18':
            search_terms.extend(['teen', 'gentle', 'simple'])
        elif age == '18_32':
            search_terms.extend(['anti-aging', 'preventive'])
        elif age == '32_56':
            search_terms.extend(['anti-aging', 'mature skin'])
        elif age == '56_plus':
            search_terms.extend(['mature skin', 'rich', 'nourishing'])
        
        # Determine product type from current product
        current_product_name = current_product_info.get('title', '').lower()
        product_type = 'skincare'
        if 'cleanser' in current_product_name or 'wash' in current_product_name:
            product_type = 'cleanser'
        elif 'moisturizer' in current_product_name or 'cream' in current_product_name:
            product_type = 'moisturizer'
        elif 'sunscreen' in current_product_name or 'spf' in current_product_name:
            product_type = 'sunscreen'
        elif 'serum' in current_product_name:
            product_type = 'serum'
        
        # Build search query
        search_query = f"best {product_type} for {skin_type} skin"
        if search_terms:
            search_query += f" {' '.join(search_terms[:3])}"  # Limit to 3 terms
        
        print(f"🔍 Search query: {search_query}")
        
        # SerpAPI search
        url = "https://serpapi.com/search"
        params = {
            "q": search_query,
            "api_key": SERPAPI_KEY,
            "engine": "google",
            "num": 4,  # Get 4 recommendations
            "tbm": "shop"  # Shopping tab for Google
        }
        
        print(f"🌐 Making SerpAPI request with params: {params}")
        response = requests.get(url, params=params, timeout=10)
        
        print(f"📡 SerpAPI Response Status: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ SerpAPI error response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Full SerpAPI response keys: {list(data.keys())}")
            
            # Try different result fields
            shopping_results = (
                data.get('shopping_results', []) or 
                data.get('organic_results', []) or 
                data.get('results', [])
            )
            
            print(f"📊 SerpAPI returned {len(shopping_results)} shopping results")
            
            # Debug: Print first result structure
            if shopping_results:
                print(f"🔍 First result structure: {json.dumps(shopping_results[0], indent=2)}")
            
            recommendations = []
            for result in shopping_results[:4]:  # Limit to 4 results
                # Try multiple possible link fields
                product_link = (
                    result.get('product_link') or  # Primary field from SerpAPI
                    result.get('link') or 
                    result.get('url') or 
                    result.get('product_url') or
                    result.get('shopping_url') or
                    result.get('displayed_link') or
                    result.get('source')
                )
                
                # Try to get direct merchant link from SerpAPI product API
                direct_link = None
                if result.get('serpapi_product_api'):
                    try:
                        print(f"🔍 Fetching detailed product info from: {result.get('serpapi_product_api')}")
                        product_response = requests.get(result.get('serpapi_product_api'), timeout=5)
                        if product_response.status_code == 200:
                            product_data = product_response.json()
                            # Look for merchant links in the detailed product data
                            if 'merchants' in product_data:
                                for merchant in product_data['merchants']:
                                    if merchant.get('link'):
                                        direct_link = merchant['link']
                                        print(f" Found direct merchant link: {direct_link}")
                                        break
                    except Exception as e:
                        print(f" Could not fetch detailed product info: {e}")
                
                # Use direct merchant link if available, otherwise use product_link
                final_link = direct_link or product_link
                
                # Fallback: Create a Google search link if no direct link is available
                if not final_link and result.get('title'):
                    product_title = result.get('title', '')
                    # Clean the title for search
                    search_title = product_title.replace('&', 'and').replace('®', '').replace('™', '')
                    final_link = f"https://www.google.com/search?q={search_title.replace(' ', '+')}+buy+online"
                    print(f"🔍 Created fallback search link for: {product_title}")
                
                recommendation = {
                    'title': result.get('title', ''),
                    'price': result.get('price', ''),
                    'image': result.get('thumbnail', '') or result.get('image', ''),
                    'link': final_link,
                    'rating': result.get('rating', ''),
                    'reviews': result.get('reviews', ''),
                    'source': result.get('source', '') or result.get('merchant', '')
                }
                
                print(f" Product: {recommendation['title'][:50]}... | Link: {final_link[:50] if final_link else 'None'}...")
                recommendations.append(recommendation)
            
            print(f" Processed {len(recommendations)} recommendations")
            return recommendations
        else:
            print(f" SerpAPI error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f" SerpAPI recommendations failed: {e}")
        return None

def get_personalized_recommendations(user_profile):
    """Get AI-powered personalized skincare recommendations based on user profile"""
    if not user_profile:
        return None

    age = user_profile.get('age', '')
    gender = user_profile.get('gender', '')
    skin_type = user_profile.get('skinType', '')

    # Try AI recommendations first
    if AI_AVAILABLE:
        try:
            prompt = f"""
You are a skincare expert. Provide personalized skincare recommendations for this user profile.

User Profile:
- Age Group: {age.replace('_', '-') if age else 'Unknown'}
- Gender: {gender or 'Unknown'}
- Skin Type: {skin_type or 'Unknown'}

Provide recommendations in this exact JSON format:
{{
  "products": ["Product 1", "Product 2", "Product 3"],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "avoid_ingredients": ["ingredient1", "ingredient2"],
  "look_for_ingredients": ["ingredient1", "ingredient2"]
}}

Focus on specific product recommendations and actionable tips for this user's profile.
"""

            response = gemini_model.generate_content(prompt)
            ai_recommendations = json.loads(response.text)
            print(f" AI recommendations generated successfully")
            return ai_recommendations
        except Exception as e:
            print(f" AI recommendations failed: {e}")
            # Fall through to basic recommendations
    
    # Fallback to basic recommendations based on user profile
    print(f" Using fallback recommendations for {age}, {gender}, {skin_type}")
    
    fallback_recommendations = {
        "products": [],
        "tips": [],
        "avoid_ingredients": [],
        "look_for_ingredients": []
    }
    
    # Basic recommendations based on skin type
    if skin_type == 'dry':
        fallback_recommendations["tips"].extend([
            "Use gentle, hydrating cleansers",
            "Apply moisturizer while skin is still damp",
            "Avoid hot water when washing face"
        ])
        fallback_recommendations["look_for_ingredients"].extend([
            "hyaluronic acid",
            "ceramides",
            "glycerin"
        ])
        fallback_recommendations["avoid_ingredients"].extend([
            "alcohol",
            "fragrance",
            "sulfates"
        ])
    elif skin_type == 'oily':
        fallback_recommendations["tips"].extend([
            "Use oil-free, non-comedogenic products",
            "Don't skip moisturizer - use lightweight formulas",
            "Consider double cleansing"
        ])
        fallback_recommendations["look_for_ingredients"].extend([
            "niacinamide",
            "salicylic acid",
            "zinc"
        ])
        fallback_recommendations["avoid_ingredients"].extend([
            "mineral oil",
            "petrolatum",
            "heavy oils"
        ])
    elif skin_type == 'combination':
        fallback_recommendations["tips"].extend([
            "Use different products for different areas",
            "Focus on balancing the skin",
            "Consider multi-masking"
        ])
        fallback_recommendations["look_for_ingredients"].extend([
            "niacinamide",
            "hyaluronic acid",
            "vitamin C"
        ])
    
    # Age-based recommendations
    if age == 'under_18':
        fallback_recommendations["tips"].append("Keep it simple - focus on gentle cleansing and sun protection")
    elif age == '18_32':
        fallback_recommendations["tips"].append("Start incorporating antioxidants and retinoids gradually")
    elif age == '32_56':
        fallback_recommendations["tips"].append("Focus on anti-aging ingredients and collagen support")
    elif age == '56_plus':
        fallback_recommendations["tips"].append("Use richer moisturizers and gentle exfoliation")
    
    return fallback_recommendations

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'harmful_ingredients_loaded': len(BAD_INGREDIENTS) > 0
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': ' DermaScan API Running',
        'endpoints': ['/analyze (POST)', '/health'],
        'harmful_ingredients_loaded': len(BAD_INGREDIENTS)
    })

@app.route('/analyze', methods=['POST'])
def analyze_product():
    try:
        data = request.get_json()
        print("🛠 Received JSON:", data)
        barcode = data.get('barcode')
        ingredients_text = data.get('ingredients')
        user_profile = data.get('user_profile')  # New field for user profile
        product_info = None

        if barcode and len(barcode) == 13 and barcode.startswith("0"):
            barcode = barcode[1:]
            print(f" Trimmed barcode to 12 digits: {barcode}")

        if barcode:
            print(f" Scanning barcode: {barcode}")
            
            product_info = get_product_info_from_incibeauty(barcode)
            print(f"PRODUCT INFO {product_info}")

            if not product_info or not product_info.get('ingredients'):
                print(" UPC failed or missing ingredients. Trying INCI...")
                product_info = get_product_info_from_incibeauty(barcode)

            if not product_info:
                return jsonify({
                    'error': 'Sorry! We could not find this product, please try again',
                    'barcode': barcode
                }), 404

            ingredients_text = product_info.get('ingredients', '')

        if not ingredients_text:
            return jsonify({
                'error': 'No ingredients found to analyze',
                'product_info': product_info
            }), 400

        ingredients_list = parse_ingredients(ingredients_text)
        
        # Use personalized analysis if user profile is provided
        if user_profile:
            analysis = get_personalized_analysis(ingredients_list, user_profile)
        else:
            analysis = analyze_ingredients(ingredients_list)
        
        # Get SerpAPI product recommendations (always try to get them if we have product info)
        if product_info:
            print(f"🛒 Attempting to get SerpAPI recommendations for product: {product_info.get('title', 'Unknown')}")
            serpapi_recommendations = get_product_recommendations_serpapi(user_profile or {}, product_info)
            if serpapi_recommendations:
                print(f" Found {len(serpapi_recommendations)} SerpAPI recommendations")
                analysis['serpapi_recommendations'] = serpapi_recommendations
            else:
                print(" No SerpAPI recommendations found")
        else:
            print("ℹ️ No product info available, skipping SerpAPI recommendations")

        return jsonify({
            'success': True,
            'analysis': analysis,
            'product_info': product_info,
            'ingredients_analyzed': ingredients_list
        })

    except Exception as e:
        print(f" Error in /analyze: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print(" DermaScan Backend Starting...")
    print(f"Loaded {len(BAD_INGREDIENTS)} harmful ingredient categories")
    app.run(debug=True, host='0.0.0.0', port=5000)
