from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import re
import base64

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




# UPCItemDB: general fallback
def get_product_info_from_upcitemdb(barcode):
    try:
        url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
        response = requests.get(url, timeout=20)

        if response.status_code == 200:
            data = response.json()
            if data.get('items'):
                item = data['items'][0]
                return {
                    'title': item.get('title', 'Unknown Product'),
                    'brand': item.get('brand', 'Unknown Brand'),
                    'ingredients': item.get('ingredients', ''),  # May be empty
                    'image': item.get('images', [None])[0] if item.get('images') else None
                }
    except Exception as e:
        print(f"[UPCItemDB] Error: {e}")
    return None

# INCI Beauty API (auth + parsed ingredients list)
def get_product_info_from_incibeauty(barcode):
    try:
        url = f"https://incibeauty.com/api/1/product/{barcode}.json"
        headers = {
            "Authorization": "Basic " + base64.b64encode(b"nidhiiii:Inci").decode("utf-8"),
            "Accept": "application/json"
        }
        response = requests.get(url, headers=headers, timeout=10)
        print(f"[INCI] Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            ingredients_raw = data.get('ingredients', [])
            ingredients_str = ", ".join([ing['name'] for ing in ingredients_raw])

            return {
                'title': data.get('name', 'Unknown Product'),
                'brand': data.get('brand', {}).get('name', 'Unknown Brand'),
                'ingredients': ingredients_str,
                'image': data.get('images', {}).get('front')
            }
    except Exception as e:
        print(f"[INCI Beauty] Error: {e}")
    return None

# Parse ingredients text into list
def parse_ingredients(ingredients_text):
    if not ingredients_text:
        return []
    return [i.strip().lower() for i in re.split(r'[,;.\n•]', ingredients_text) if i.strip()]

# Analyze ingredients against harmful list
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

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'harmful_ingredients_loaded': len(BAD_INGREDIENTS) > 0
    })

# API root
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

        # ✅ Fix for 13-digit barcode that starts with 0
        if barcode and len(barcode) == 13 and barcode.startswith("0"):
            barcode = barcode[1:]
            print(f"🛠 Trimmed barcode to 12 digits: {barcode}")

        # Barcode first
        if barcode:
            print(f"🔍 Scanning barcode: {barcode}")
            product_info = get_product_info_from_upcitemdb(barcode)

            # Try INCI if no ingredients found
            if not product_info or not product_info.get('ingredients'):
                print("📡 UPC failed or missing ingredients. Trying INCI...")
                product_info = get_product_info_from_incibeauty(barcode)

            if not product_info:
                return jsonify({
                    'error': 'Product not found in either UPCItemDB or INCI Beauty',
                    'barcode': barcode
                }), 404

            ingredients_text = product_info.get('ingredients', '')

        # If raw ingredients provided or found
        if ingredients_text:
            ingredients_list = parse_ingredients(ingredients_text)
        else:
            return jsonify({
                'error': 'No ingredients found to analyze',
                'product_info': product_info
            }), 400

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


# If we have product but no ingredients, prompt front-end to allow manual input
        if not product_info or not product_info.get('ingredients'):
            return jsonify({
               'error': 'Product found but ingredients are not available. Please enter manually.',
              'product_info': product_info,
              'barcode': barcode
         }), 400

        ingredients_text = product_info.get('ingredients', '')
        ingredients_list = parse_ingredients(ingredients_text)
        analysis = analyze_ingredients(ingredients_list)

        return jsonify({
            'success': True,
            'analysis': analysis,
            'product_info': product_info,
            'ingredients_analyzed': ingredients_list
        })

    

# Run the app
if __name__ == '__main__':
    print("🧴 DermaScan Backend Starting...")
    print(f"📊 Loaded {len(BAD_INGREDIENTS)} harmful ingredient categories")
    app.run(debug=True, host='0.0.0.0', port=5000)
