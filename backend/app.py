from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import re
import hmac
import hashlib
import time

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

BAD_INGREDIENTS = load_bad_ingredients()

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
        print(f"Calling INCI Beauty API: {url}")
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            compositions = data.get('compositions', {})
            ingredients_raw = compositions.get('ingredients', [])
            ingredients_str = ", ".join([ing.get('inci_name', '') for ing in ingredients_raw])

            return {
                'title': data.get('name', 'Unknown Product'),
                'brand': data.get('brand', 'Unknown Brand'),
                'ingredients': ingredients_str,
                'image': data.get('image', {}).get('image')
            }
        else:
            print(f"[INCI] Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[INCI Beauty] Error: {e}")
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
        barcode = data.get('barcode')
        ingredients_text = data.get('ingredients')
        product_info = None

        if barcode:
            if has_scanned_recently(barcode):
                return jsonify({
                    'error': 'This barcode was already scanned recently. Please wait a few seconds.',
                    'barcode': barcode
                }), 429

            print(f"🔍 Scanning barcode: {barcode}")
            product_info = get_product_info_from_incibeauty(barcode)
            if not product_info:
                return jsonify({
                    'error': 'Product not found in INCI Beauty',
                    'barcode': barcode
                }), 404

            ingredients_text = product_info.get('ingredients', '')

        if not ingredients_text:
            return jsonify({
                'error': 'No ingredients found to analyze',
                'product_info': product_info
            }), 400

        ingredients_list = parse_ingredients(ingredients_text)
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
