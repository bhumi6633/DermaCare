# DermaCare

**DermaCare** is a web-based skincare assistant that lets users scan cosmetic product barcodes to instantly identify potentially harmful ingredients. It leverages external APIs, a curated ingredient safety database, and AI to deliver clear health insights and personalized recommendations.

---

## Features

- 🔍 **Barcode Scanning** – Scan cosmetic/skincare product barcodes in real time using your device camera  
- 🧪 **Ingredient Analysis** – Automatically flag ingredients like parabens, phthalates, and formaldehyde releasers based on safety categories  
- 🧠 **AI-Powered Recommendations** – Suggest safer alternatives and skincare tips using Gemini AI and Serp API  
- 👤 **User Personalization** – Generate safety ratings based on user-defined skin type and sensitivities  
- 📋 **Product Reports** – Provide clear reports including ingredient descriptions, severity scores, and explanations

---

## Tech Stack

| Layer         | Technologies                                 |
|---------------|----------------------------------------------|
| **Frontend**  | React.js, Tailwind CSS                       |
| **Backend**   | Flask (Python)                               |
| **Barcode**   | QuaggaJS                                     |
| **APIs**      | INCI Beauty API, Gemini AI, Serp API         |
| **Database**  | JSON (for ingredient safety classification)  |
| **Tools**     | Git, GitHub, VS Code, Postman                |

---

## How It Works

1. User scans a product's barcode through the camera
2. The barcode is sent to the backend, which retrieves product and ingredient data via the INCI Beauty API
3. The backend compares ingredients against a categorized JSON database of harmful substances
4. Gemini AI and Serp API are used to suggest cleaner alternatives and skincare advice
5. A personalized report is generated based on the user's skin type and sensitivities

---
## Watch live demo on: https://youtu.be/j2ykAA4lfdY
