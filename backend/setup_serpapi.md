# SerpAPI Setup Guide

## Getting Your SerpAPI Key

1. Go to [SerpAPI](https://serpapi.com/) and create an account
2. Choose a plan (they have a free tier with 100 searches/month)
3. Get your API key from the dashboard

## Setting Up the API Key

1. Open `backend/app.py`
2. Find this line:
   ```python
   SERPAPI_KEY = "YOUR_SERPAPI_KEY_HERE"  # Replace with your actual SerpAPI key
   ```
3. Replace `YOUR_SERPAPI_KEY_HERE` with your actual SerpAPI key

## How It Works

The product recommendations feature:

1. **Analyzes the current product** - Determines if it's a cleanser, moisturizer, serum, etc.
2. **Considers user profile** - Uses age, gender, and skin type to customize search
3. **Includes beneficial ingredients** - Adds ingredients the user should look for
4. **Searches for alternatives** - Uses Google Shopping via SerpAPI
5. **Returns structured data** - Product name, price, image, link, rating, reviews

## Example Search Queries

- For a Neutrogena body wash with dry skin: "gentle cleanser hydrating for dry skin hyaluronic acid best alternatives"
- For a moisturizer with oily skin: "moisturizer oil-free for oily skin niacinamide best alternatives"

## Features

- **Product images** - Shows product thumbnails
- **Pricing information** - Displays current prices
- **Ratings & reviews** - Shows user feedback
- **Direct purchase links** - Links to where users can buy
- **Source information** - Shows which retailer is selling

## Cost Considerations

- SerpAPI free tier: 100 searches/month
- Each product scan uses 1 search
- Consider upgrading if you expect high usage 