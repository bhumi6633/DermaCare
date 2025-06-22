import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    const user = localStorage.getItem('dermascan-user');
    if (!user) {
      navigate('/login');
    } else {
      // Load the profile for the logged-in user
      const savedProfile = localStorage.getItem(`dermascan-profile-${user}`);
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    }

    // Check if profile was passed from Profile page after an update
    if (location.state?.userProfile) {
      setUserProfile(location.state.userProfile);
    }
  }, [location.state, navigate]);

  const analyzeProduct = async (data) => {
    setLoading(true);
    setError(null);
    setShowScanner(false); // Hide scanner while analyzing
    
    if (userProfile) {
      data.user_profile = userProfile;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, data);
      if (response.data.success) {
        navigate('/results', {
          state: {
            analysis: response.data.analysis,
            productInfo: response.data.product_info,
            ingredientsAnalyzed: response.data.ingredients_analyzed,
            userProfile: userProfile,
          },
        });
      } else {
        setError(response.data.error || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      console.error('API Error:', err);
      const errorMsg = err.response?.data?.error || 'An unexpected error occurred.';
      if (err.response?.status === 404) {
        setError(`Product not found for barcode: ${data.barcode}. Please check the code or try another product.`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeDetected = (barcode) => {
    if (loading) return;
    analyzeProduct({ barcode });
  };
  
  const handleScannerError = (errorMessage) => {
    setError(errorMessage);
    setShowScanner(false);
  };

  const toggleScanner = () => {
    setError(null);
    setShowScanner(prev => !prev);
  }

  return (
    <div className="min-h-screen bg-sky-100 flex items-center justify-center p-4 bg-cover bg-center bg-scanner-bg">
      {/* This is where you can insert your background image class */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        
        <h1 className="font-quicksand text-4xl font-bold text-center text-custom-pink uppercase tracking-wider">
          Scan Product
        </h1>
        
        <div className="relative h-80 flex items-center justify-center rounded-2xl overflow-hidden bg-gray-900">
          {showScanner ? (
            <BarcodeScanner 
              onBarcodeDetected={handleBarcodeDetected}
              onError={handleScannerError}
            />
          ) : (
            <div className="text-center">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-pink mx-auto"></div>
                  <p className="mt-4 text-white uppercase font-quicksand font-bold">Analyzing Your Product...</p>
                </>
              ) : (
                <p className="text-gray-500">Camera view will appear here</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative text-center" role="alert">
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}

        <button
          onClick={toggleScanner}
          disabled={loading}
          className="w-full font-quicksand font-bold text-2xl text-white bg-custom-pink rounded-xl p-4 border-b-4 border-pink-400 transition-all duration-150 uppercase
          disabled:bg-gray-400 disabled:border-gray-500 disabled:cursor-not-allowed
          hover:bg-pink-400 active:scale-95 active:border-b-0"
        >
          {showScanner ? 'Stop Scanner' : 'Start Scanner'}
        </button>
        
        <div className="text-center mt-4">
            <button
              onClick={() => navigate('/profile')}
              className="font-quicksand font-bold text-md text-custom-pink hover:text-pink-500 transition-colors uppercase"
            >
              {userProfile ? 'Edit Profile' : 'Create Profile for Better Analysis'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default Home;