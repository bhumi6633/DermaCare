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
ACCESS_KEY = "bdcec7e387ab2359"
SECRET_KEY = "8VDpSzOdEc+JqcUnrYtGHh5B3+XOI0dW"

app = Flask(__name__)
CORS(app)

# Load harmful ingredients database
def load_bad_ingredients():
    try:
        with open('data/bad_ingredients.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠️ bad_ingredients.json not found.")
        return {}

# Load skincare recommendations
def load_skincare_recommendations():
    try:
        with open('data/skincare_recommendations.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠️ skincare_recommendations.json not found.")
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
    for ingredient in ingredients_list:
        for category, data in BAD_INGREDIENTS.items():
            for bad in data['ingredients']:
                if bad.lower() in ingredient:
                    if category not in harmful_found:
                        harmful_found[category] = {
                            'description': data['description'],
                            'ingredients': []
                        }
                    harmful_found[category]['ingredients'].append(ingredient)
                    total_harmful += 1
    return {
        'safe': total_harmful == 0,
        'harmful_count': total_harmful,
        'harmful_ingredients': harmful_found,
        'total_ingredients_checked': len(ingredients_list)
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
    personalized_score = 100  # Start with perfect score

    # Base analysis
    for ingredient in ingredients_list:
        for category, data in BAD_INGREDIENTS.items():
            for bad in data['ingredients']:
                if bad.lower() in ingredient:
                    if category not in harmful_found:
                        harmful_found[category] = {
                            'description': data['description'],
                            'ingredients': []
                        }
                    harmful_found[category]['ingredients'].append(ingredient)
                    total_harmful += 1

    # Personalized scoring based on user profile
    if user_profile:
        age = user_profile.get('age', '')
        gender = user_profile.get('gender', '')
        skin_type = user_profile.get('skinType', '')

        # Age-based adjustments
        if age == 'under_18':
            # Young skin is more sensitive to harsh ingredients
            personalized_score -= total_harmful * 15
        elif age == '18_32':
            # Young adult skin can handle some ingredients better
            personalized_score -= total_harmful * 12
        elif age == '32_56':
            # Mature skin needs gentler ingredients
            personalized_score -= total_harmful * 10
        elif age == '56_plus':
            # Senior skin is most sensitive
            personalized_score -= total_harmful * 18

        # Skin type adjustments
        if skin_type == 'dry':
            # Dry skin is more sensitive to drying ingredients
            for category in harmful_found:
                if 'alcohols' in category or 'sulfates' in category:
                    personalized_score -= 5
        elif skin_type == 'oily':
            # Oily skin can handle some ingredients better but sensitive to comedogenic ones
            for category in harmful_found:
                if 'mineral_oil' in category:
                    personalized_score -= 8
        elif skin_type == 'combination':
            # Combination skin needs balanced approach
            personalized_score -= total_harmful * 2

    # Ensure score doesn't go below 0
    personalized_score = max(0, personalized_score)

    # Get personalized recommendations
    recommendations = get_personalized_recommendations(user_profile)

    return {
        'safe': total_harmful == 0,
        'harmful_count': total_harmful,
        'harmful_ingredients': harmful_found,
        'total_ingredients_checked': len(ingredients_list),
        'personalized_score': round(personalized_score, 1),
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
    """Get personalized skincare recommendations based on user profile"""
    if not user_profile or not SKINCARE_RECOMMENDATIONS:
        return None

    age = user_profile.get('age', '')
    gender = user_profile.get('gender', '')
    skin_type = user_profile.get('skinType', '')

    try:
        recommendations = SKINCARE_RECOMMENDATIONS['recommendations'].get(age, {}).get(gender, {}).get(skin_type, {})
        return recommendations
    except:
        return None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'harmful_ingredients_loaded': len(BAD_INGREDIENTS) > 0
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': '🧴 DermaScan API Running',
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
            if has_scanned_recently(barcode):
                return jsonify({
                    'error': 'This barcode was already scanned recently. Please wait a few seconds.',
                    'barcode': barcode
                }), 429

            print(f"🔍 Scanning barcode: {barcode}")
            
            product_info = get_product_info_from_incibeauty(barcode)
            print(f"PRODUCT INFO {product_info}")

            if not product_info or not product_info.get('ingredients'):
                print("📡 UPC failed or missing ingredients. Trying INCI...")
                product_info = get_product_info_from_incibeauty(barcode)

            if not product_info:
                return jsonify({
                    'error': 'Product not found in either UPCItemDB or INCI Beauty',
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

        return jsonify({
            'success': True,
            'analysis': analysis,
            'product_info': product_info,
            'ingredients_analyzed': ingredients_list
        })

    except Exception as e:
        print(f"💥 Error in /analyze: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🧴 DermaScan Backend Starting...")
    print(f"📊 Loaded {len(BAD_INGREDIENTS)} harmful ingredient categories")
    app.run(debug=True, host='0.0.0.0', port=5000)
