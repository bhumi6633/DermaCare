#!/usr/bin/env python3
"""
Test script for SerpAPI integration
Run this to verify your SerpAPI key works correctly
"""

import requests
import json

# Replace with your actual SerpAPI key
SERPAPI_KEY = "eb3092c3907323a7d840ca787a4559cb334a4ed442185310cbbe226ba5edcc1e"

def test_serpapi_search():
    """Test SerpAPI with a simple skincare search"""
    
    if SERPAPI_KEY == "YOUR_SERPAPI_KEY_HERE":
        print("❌ Please set your SerpAPI key in this file first!")
        return False
    
    try:
        url = "https://serpapi.com/search"
        params = {
            "q": "gentle cleanser for dry skin buy online purchase best alternatives",
            "api_key": SERPAPI_KEY,
            "engine": "google_shopping",
            "num": 4,
            "gl": "us",
            "hl": "en"
        }
        
        print("🔍 Testing SerpAPI Google Shopping...")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            shopping_results = data.get('shopping_results', [])
            
            if shopping_results:
                print(f"✅ Success! Found {len(shopping_results)} shopping results")
                print("\n📦 Sample results with images:")
                for i, result in enumerate(shopping_results[:3], 1):
                    title = result.get('title', 'No title')
                    link = result.get('link', 'No link')
                    image = result.get('thumbnail', '') or result.get('image', '') or result.get('image_url', '')
                    price = result.get('price', 'No price')
                    
                    print(f"\n{i}. {title}")
                    print(f"   Price: {price}")
                    print(f"   Link: {link}")
                    print(f"   Image: {'✅ Has image' if image else '❌ No image'}")
                    if image:
                        print(f"   Image URL: {image[:80]}...")
                return True
            else:
                print("❌ No shopping results found")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧴 SerpAPI Integration Test")
    print("=" * 30)
    
    success = test_serpapi_search()
    
    if success:
        print("\n✅ SerpAPI integration is working correctly!")
        print("You can now use product recommendations in DermaScan.")
    else:
        print("\n❌ SerpAPI integration failed.")
        print("Please check your API key and try again.") 