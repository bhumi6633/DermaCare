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
ACCESS_KEY = #accesskey
SECRET_KEY = #secretkey

# Gemini API Key for AI recommendations
GEMINI_API_KEY = #geminiapi

# SerpAPI Key for product recommendations
SERPAPI_KEY = #serpapi

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

            return {
                'title': data.get('name', 'Unknown Product'),
                'brand': data.get('brand', 'Unknown Brand'),
                'ingredients': ingredients_str,
                'image': data.get('images', {}).get('image')
            }

        else:
            print(f"[INCI] Status Code: {response.status_code} | Body: {response.text}")

    except Exception as e:
        print(f"[INCI Beauty] Error: {e}")

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
    print(f"📝 Using fallback recommendations for {age}, {gender}, {skin_type}")
    
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

def get_product_recommendations(current_product, user_profile, harmful_ingredients):
    """
    Get product recommendations using SerpAPI based on current product and user profile
    Returns: list of recommended products with images, links, and reviews
    """
    if not SERPAPI_KEY or SERPAPI_KEY == "YOUR_SERPAPI_KEY_HERE":
        print("SerpAPI key not configured")
        return []
    
    try:
        # Build search query based on current product and user profile
        search_terms = []
        
        # Get product type from current product name
        product_name = current_product.get('title', '').lower()
        if 'cleanser' in product_name or 'wash' in product_name:
            search_terms.append('gentle cleanser')
        elif 'moisturizer' in product_name or 'cream' in product_name:
            search_terms.append('moisturizer')
        elif 'serum' in product_name:
            search_terms.append('serum')
        elif 'sunscreen' in product_name or 'spf' in product_name:
            search_terms.append('sunscreen')
        else:
            search_terms.append('skincare product')
        
        # Add skin type specific terms
        skin_type = user_profile.get('skinType', '') if user_profile else ''
        if skin_type == 'dry':
            search_terms.append('hydrating')
            search_terms.append('for dry skin')
        elif skin_type == 'oily':
            search_terms.append('oil-free')
            search_terms.append('for oily skin')
        elif skin_type == 'combination':
            search_terms.append('for combination skin')
        elif skin_type == 'sensitive':
            search_terms.append('gentle')
            search_terms.append('for sensitive skin')
        
        # Add ingredients to look for
        if user_profile:
            recommendations = get_personalized_recommendations(user_profile)
            if recommendations and recommendations.get('look_for_ingredients'):
                for ingredient in recommendations['look_for_ingredients'][:2]:  # Limit to 2 ingredients
                    search_terms.append(ingredient)
        
        # Build final search query
        search_query = ' '.join(search_terms)
        search_query += ' buy online purchase best alternatives'
        
        print(f"Searching for: {search_query}")
        
        url = "https://serpapi.com/search"
        recommendations = []
        
        # 1. Get product info and images from Google Shopping
        params_shopping = {
            "q": search_query,
            "api_key": SERPAPI_KEY,
            "engine": "google_shopping",
            "num": 8,
            "gl": "us",
            "hl": "en"
        }
        response = requests.get(url, params=params_shopping, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            shopping_results = data.get('shopping_results', [])
            
            for result in shopping_results:
                if len(recommendations) >= 4:
                    break
                    
                title = result.get('title', 'Unknown Product')
                price = result.get('price', 'Price not available')
                image = result.get('thumbnail', '') or result.get('image', '') or result.get('image_url', '')
                rating = result.get('rating', 'No rating')
                reviews = result.get('reviews', 'No reviews')
                source = result.get('source', 'Unknown')
                
                # Try to find a purchase link for this product
                purchase_link = result.get('link', '')
                
                # If no direct link from shopping results, search for it
                if not purchase_link:
                    try:
                        # Search for the product on major retailers
                        link_search_query = f'"{title}" site:amazon.com OR site:target.com OR site:walmart.com OR site:ulta.com OR site:sephora.com'
                        params_link_search = {
                            "q": link_search_query,
                            "api_key": SERPAPI_KEY,
                            "engine": "google",
                            "num": 3,
                            "gl": "us",
                            "hl": "en"
                        }
                        link_response = requests.get(url, params=params_link_search, timeout=5)
                        
                        if link_response.status_code == 200:
                            link_data = link_response.json()
                            link_results = link_data.get('organic_results', [])
                            
                            for link_result in link_results:
                                link_url = link_result.get('link', '')
                                if any(domain in link_url for domain in ['amazon.com', 'target.com', 'walmart.com', 'ulta.com', 'sephora.com']):
                                    purchase_link = link_url
                                    # Update source based on the found link
                                    if 'amazon.com' in link_url:
                                        source = "Amazon"
                                    elif 'target.com' in link_url:
                                        source = "Target"
                                    elif 'walmart.com' in link_url:
                                        source = "Walmart"
                                    elif 'ulta.com' in link_url:
                                        source = "Ulta"
                                    elif 'sephora.com' in link_url:
                                        source = "Sephora"
                                    break
                    except:
                        pass  # If link search fails, continue without link
                
                # Only add if we have either an image or a link
                if image or purchase_link:
                    recommendations.append({
                        'title': title,
                        'price': price,
                        'image': image,
                        'link': purchase_link,
                        'rating': rating,
                        'reviews': reviews,
                        'source': source
                    })
        
        # 2. If we still don't have 4 recommendations, fill with Google Search results
        if len(recommendations) < 4:
            params_search = {
                "q": search_query,
                "api_key": SERPAPI_KEY,
                "engine": "google",
                "num": 15,
                "gl": "us",
                "hl": "en"
            }
            response = requests.get(url, params=params_search, timeout=10)
            if response.status_code == 200:
                data = response.json()
                organic_results = data.get('organic_results', [])
                for result in organic_results:
                    if len(recommendations) >= 4:
                        break
                    title = result.get('title', '')
                    link = result.get('link', '')
                    snippet = result.get('snippet', '')
                    # Skip if no link or if it's a review/article
                    if not link or any(skip_word in title.lower() for skip_word in ['review', 'best', 'top', 'guide', 'article', 'blog']):
                        continue
                    # Only include if it's a product page or has product keywords
                    is_product_page = any(domain in link for domain in [
                        'amazon.com', 'target.com', 'walmart.com', 'ulta.com', 'sephora.com', 
                        'cvs.com', 'walgreens.com', 'riteaid.com', 'drugstore.com', 'beauty.com',
                        'dermstore.com', 'skinstore.com', 'lovelyskin.com', 'skincare.com'
                    ])
                    has_product_keywords = any(keyword in title.lower() for keyword in [
                        'cleanser', 'moisturizer', 'serum', 'cream', 'lotion', 'wash', 
                        'skincare', 'beauty', 'facial', 'face'
                    ])
                    if is_product_page or has_product_keywords:
                        price = "Price varies"
                        if '$' in snippet:
                            import re
                            price_match = re.search(r'\$\d+(?:\.\d{2})?', snippet)
                            if price_match:
                                price = price_match.group()
                        rating = "No rating"
                        if '⭐' in snippet or 'star' in snippet.lower():
                            rating = "4.0+ stars"
                        source = "Online Store"
                        if 'amazon.com' in link:
                            source = "Amazon"
                        elif 'target.com' in link:
                            source = "Target"
                        elif 'walmart.com' in link:
                            source = "Walmart"
                        elif 'ulta.com' in link:
                            source = "Ulta"
                        elif 'sephora.com' in link:
                            source = "Sephora"
                        elif 'cvs.com' in link:
                            source = "CVS"
                        elif 'walgreens.com' in link:
                            source = "Walgreens"
                        elif 'dermstore.com' in link:
                            source = "Dermstore"
                        elif 'skinstore.com' in link:
                            source = "SkinStore"
                        
                        # Try to get an image for this product
                        image = ''
                        try:
                            # Search for product images
                            image_query = f"{title} product image"
                            params_image = {
                                "q": image_query,
                                "api_key": SERPAPI_KEY,
                                "engine": "google_images",
                                "num": 1,
                                "gl": "us",
                                "hl": "en"
                            }
                            image_response = requests.get(url, params=params_image, timeout=5)
                            if image_response.status_code == 200:
                                image_data = image_response.json()
                                image_results = image_data.get('images_results', [])
                                if image_results:
                                    image = image_results[0].get('original', '')
                        except:
                            pass  # If image search fails, continue without image
                        
                        recommendations.append({
                            'title': title,
                            'price': price,
                            'image': image,
                            'link': link,
                            'rating': rating,
                            'reviews': 'Check reviews',
                            'source': source
                        })
        
        print(f"Returning {len(recommendations)} product recommendations (with images if available)")
        return recommendations[:4]
    except Exception as e:
        print(f"Error getting product recommendations: {e}")
        return []

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
            print(f"🛠 Trimmed barcode to 12 digits: {barcode}")

        if barcode:
            print(f" Scanning barcode: {barcode}")
            
            product_info = get_product_info_from_incibeauty(barcode)
            print(f"PRODUCT INFO {product_info}")

            if not product_info or not product_info.get('ingredients'):
                print(" UPC failed or missing ingredients. Trying INCI...")
                product_info = get_product_info_from_incibeauty(barcode)

            if not product_info:
                return jsonify({
                    'error': 'Sorry! We could not find your reuqested item, please try again later',
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
            # Get product recommendations if we have product info
            if product_info:
                product_recommendations = get_product_recommendations(product_info, user_profile, analysis.get('harmful_ingredients', {}))
                analysis['product_recommendations'] = product_recommendations
        else:
            analysis = analyze_ingredients(ingredients_list)

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
    print("🧴 DermaScan Backend Starting...")
    print(f"Loaded {len(BAD_INGREDIENTS)} harmful ingredient categories")
    app.run(debug=True, host='0.0.0.0', port=5000)
