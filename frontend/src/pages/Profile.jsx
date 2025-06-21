import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserProfileForm from '../components/UserProfileForm'

const Profile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  const handleProfileSubmit = (userProfile) => {
    setProfile(userProfile)
    // Store profile in localStorage for persistence
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
    
    // Navigate back to home with profile
    navigate('/', { state: { userProfile } })
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Set Up Your Profile
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Help us provide personalized skincare recommendations
        </p>
        <p className="text-gray-500">
          Your profile helps us tailor ingredient analysis and recommendations to your specific needs
        </p>
      </div>

      {/* Profile Form */}
      <UserProfileForm onProfileSubmit={handleProfileSubmit} />

      {/* Skip Option */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 underline"
        >
          Skip for now - Continue without profile
        </button>
      </div>

      {/* Benefits */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-semibold text-gray-800 mb-2">Personalized Scoring</h3>
          <p className="text-gray-600 text-sm">
            Get ingredient safety scores tailored to your age and skin type
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-3xl mb-2">💡</div>
          <h3 className="font-semibold text-gray-800 mb-2">Smart Recommendations</h3>
          <p className="text-gray-600 text-sm">
            Receive product recommendations based on your profile
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-3xl mb-2">🛡️</div>
          <h3 className="font-semibold text-gray-800 mb-2">Better Protection</h3>
          <p className="text-gray-600 text-sm">
            Avoid ingredients that may be problematic for your skin type
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile 