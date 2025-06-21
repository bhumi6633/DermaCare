# DermaScan 🧴

A web app that scans skincare product barcodes, analyzes ingredients, and determines product safety.

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend runs on: http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

## 🏗️ Project Structure
```
dermascan/
├── backend/
│   ├── app.py              # Flask server
│   ├── requirements.txt    # Python dependencies
│   └── data/
│       └── bad_ingredients.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BarcodeScanner.jsx
│   │   │   └── Results.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Results.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
└── README.md
```

## 🔧 Features
- 📱 Barcode scanning with QuaggaJS
- 🧪 Ingredient analysis against harmful substances
- ⚡ Real-time safety verdict
- 📊 Detailed ingredient breakdown

## 🛠️ Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, QuaggaJS, Axios
- **Backend**: Python Flask, UPCItemDB API
- **Data**: JSON-based harmful ingredients database