from flask import Flask, request, jsonify
from flask_cors import CORS
import requests 
import json
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load harmful ingredients data
def load_bad_ingredients():
    """Load the harmful ingredients database from JSON file"""
    try:
        with open('data/bad_ingredients.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: bad_ingredients.json not found")
        return {}

# Global variable to store harmful ingredients
BAD_INGREDIENTS = load_bad_ingredients()

def get_product_info_from_barcode(barcode):
    """
    Fetch product information from UPCItemDB API
    Returns: dict with product info or None if not found
    """
    try:
        # Using UPCItemDB API 
        url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
        response = requests.get(url, timeout=10)
        print(barcode)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('items') and len(data['items']) > 0:
                item = data['items'][0]
                return {
                    'title': item.get('title', 'Unknown Product'),
                    'brand': item.get('brand', 'Unknown Brand'),
                    #'ingredients': item.get('ingredients', ''),
                    'image': item.get('images', [None])[0] if item.get('images') else None
                }
    except Exception as e:
        print(f"Error fetching product info: {e}")
    
    return None

def parse_ingredients(ingredients_text):
    """
    Parse ingredients text into a list of individual ingredients
    Handles common separators and formatting
    """
    if not ingredients_text:
        return []
    
    # Common separators in ingredient lists
    separators = [',', ';', '.', '\n', '•']
    
    # Split by separators and clean up
    ingredients = []
    for separator in separators:
        if separator in ingredients_text:
            ingredients = [ingredient.strip().lower() for ingredient in ingredients_text.split(separator)]
            break
    
    # If no separators found, try to split by common patterns
    if not ingredients:
        # Split by common ingredient patterns
        ingredients = re.split(r'[,;.\n•]', ingredients_text)
        ingredients = [ingredient.strip().lower() for ingredient in ingredients if ingredient.strip()]
    
    return ingredients

def analyze_ingredients(ingredients_list):
    """
    Analyze ingredients against harmful substances database
    Returns: dict with safety verdict and harmful ingredients found
    """
    harmful_found = {}
    total_harmful = 0
    
    for ingredient in ingredients_list:
        ingredient_lower = ingredient.lower().strip()
        
        # Check against each category of harmful ingredients
        for category, data in BAD_INGREDIENTS.items():
            for harmful_ingredient in data['ingredients']:
                if harmful_ingredient.lower() in ingredient_lower:
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

@app.route('/')
def home():
    """Root route to verify the server is running"""
    return jsonify({
        'message': '🧴 DermaScan Backend API',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'analyze': '/analyze (POST)'
        },
        'harmful_ingredients_loaded': len(BAD_INGREDIENTS)
    })

@app.route('/analyze', methods=['POST'])
def analyze_product():
    """
    Main endpoint to analyze product safety
    Accepts: barcode (string) or ingredients (string)
    Returns: safety analysis results
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        barcode = data.get('barcode')
        ingredients_text = data.get('ingredients')
        
        product_info = None
        ingredients_list = []
        
        # If barcode provided, fetch product info
        if barcode:
            product_info = get_product_info_from_barcode(barcode)
            if product_info:
                ingredients_text = product_info.get('ingredients', '')
            else:
                return jsonify({
                    'error': 'Product not found for this barcode',
                    'barcode': barcode
                }), 404
        
        # If ingredients provided (either from barcode or direct input)
        if ingredients_text:
            ingredients_list = parse_ingredients(ingredients_text)
        
        if not ingredients_list:
            return jsonify({
                'error': 'No ingredients found to analyze',
                'barcode': barcode,
                'product_info': product_info
            }), 400
        
        # Analyze ingredients
        analysis = analyze_ingredients(ingredients_list)
        
        # Prepare response
        response = {
            'success': True,
            'analysis': analysis,
            'product_info': product_info,
            'ingredients_analyzed': ingredients_list
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in analyze endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'harmful_ingredients_loaded': len(BAD_INGREDIENTS) > 0
    })

if __name__ == '__main__':
    print("🧴 DermaScan Backend Starting...")
    print(f"📊 Loaded {len(BAD_INGREDIENTS)} harmful ingredient categories")
    app.run(debug=True, host='0.0.0.0', port=5000)