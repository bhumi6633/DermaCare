import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BarcodeScanner from '../components/BarcodeScanner'
import axios from 'axios'

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [manualIngredients, setManualIngredients] = useState('')
  const [activeTab, setActiveTab] = useState('scanner') // 'scanner' or 'manual'
  const [hasScanned, setHasScanned] = useState(false) // Prevent multiple scans
  const [userProfile, setUserProfile] = useState(null)

  const API_BASE_URL = 'http://localhost:5000'

  // Load user profile from localStorage or location state
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile))
    }
    
    // Check if profile was passed from Profile page
    if (location.state?.userProfile) {
      setUserProfile(location.state.userProfile)
      localStorage.setItem('userProfile', JSON.stringify(location.state.userProfile))
    }
  }, [location.state])

  const analyzeProduct = async (data) => {
    setLoading(true)
    setError(null)
    
    // Add user profile to request if available
    if (userProfile) {
      data.user_profile = userProfile
    }
    
    try {
      // console.log("Scanned barcode:", barcode)
      const response = await axios.post(`${API_BASE_URL}/analyze`, data)
      
      if (response.data.success) {
        // Navigate to results page with analysis data
        navigate('/results', {
          state: {
            analysis: response.data.analysis,
            productInfo: response.data.product_info,
            ingredientsAnalyzed: response.data.ingredients_analyzed,
            userProfile: userProfile
          }
        })
      } else {
        setError('Analysis failed. Please try again.')
      }
    } catch (err) {
      console.error('API Error:', err)
      
      if (err.response?.status === 404) {
        setError('Product not found. Please check the barcode or try manual input.')
      } else if (err.response?.status === 400) {
        setError('Invalid data provided. Please check your input.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeDetected = async (scanData) => {
    if (hasScanned) return
    setHasScanned(true)
    
    // scanData now contains: { barcode, analysis, product_info, ingredients_analyzed }
    console.log("Scan data received:", scanData)
    
    if (scanData.analysis) {
      // Analysis was successful, navigate to results
      navigate('/results', {
        state: {
          analysis: scanData.analysis,
          productInfo: scanData.product_info,
          ingredientsAnalyzed: scanData.ingredients_analyzed,
          userProfile: userProfile
        }
      })
    } else {
      // Handle case where analysis failed but barcode was detected
      setError('Barcode detected but analysis failed. Please try again.')
    }
    
    // Allow scanning again after 3 seconds
    setTimeout(() => setHasScanned(false), 3000);
  };
  

  const handleManualSubmit = (e  ) =>   {
    e.preventDefault()
    
    if (!manualIngredients.trim()) {
      setError('Please enter ingredients to analyze.')
      return
    }
    
    console.log('Analyzing manual ingredients')
    analyzeProduct({ ingredients: manualIngredients })
  }

  const handleScannerError = (error) => {
    setError(error)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to DermaScan
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Scan barcodes or input ingredients to check skincare safety
        </p>
        <p className="text-gray-500">
          Get instant analysis of harmful ingredients in your skincare products
        </p>
      </div>

      {/* Profile Status */}
      {userProfile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-medium">Personalized Analysis Enabled</p>
              <p className="text-green-600 text-sm">
                Age: {userProfile.age.replace('_', '-')} | Gender: {userProfile.gender} | Skin: {userProfile.skinType}
              </p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-green-600 hover:text-green-800 text-sm underline"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}

      {/* Profile Setup Prompt */}
      {!userProfile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-medium">Get Personalized Recommendations</p>
              <p className="text-blue-600 text-sm">
                Set up your profile to receive tailored ingredient analysis and product recommendations
              </p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Set Up Profile
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'scanner'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📷 Barcode Scanner
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ✏️ Manual Input
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Analyzing product...
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 text-sm mt-2 hover:text-red-700"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      <div className="card">
        {activeTab === 'scanner' ? (
          <BarcodeScanner 
            onBarcodeDetected={handleBarcodeDetected}
            onError={handleScannerError}
            userProfile={userProfile}
          />
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Manual Ingredients Input
            </h2>
            <p className="text-gray-600 mb-6">
              Paste or type the ingredients list from your skincare product
            </p>
            
            <form onSubmit={handleManualSubmit} className="max-w-2xl mx-auto">
              <textarea
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                placeholder="Enter ingredients here (e.g., Water, Glycerin, Sodium Lauryl Sulfate, Methylparaben...)"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
              
              <button
                type="submit"
                disabled={loading || !manualIngredients.trim()}
                className="btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Analyze Ingredients
              </button>
            </form>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>💡 Tip: Copy ingredients from the product label or packaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="font-semibold text-gray-800 mb-2">Instant Scanning</h3>
          <p className="text-gray-600 text-sm">
            Scan barcodes with your camera for quick product lookup
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-3xl mb-2">🧪</div>
          <h3 className="font-semibold text-gray-800 mb-2">Ingredient Analysis</h3>
          <p className="text-gray-600 text-sm">
            Check against 50+ harmful ingredients in our database
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-800 mb-2">Detailed Results</h3>
          <p className="text-gray-600 text-sm">
            Get comprehensive safety reports with ingredient breakdowns
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home 