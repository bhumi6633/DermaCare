import React, { useState } from 'react'

const UserProfileForm = ({ onProfileSubmit, initialProfile = null }) => {
  const [profile, setProfile] = useState(initialProfile || {
    age: '',
    gender: '',
    skinType: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (profile.age && profile.gender && profile.skinType) {
      onProfileSubmit(profile)
    }
  }

  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Personalize Your Experience
      </h2>
      <p className="text-gray-600 mb-6">
        Help us provide personalized skincare recommendations based on your profile
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Age Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Group
          </label>
          <select
            value={profile.age}
            onChange={(e) => handleChange('age', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Select age group</option>
            <option value="under_18">Under 18</option>
            <option value="18_32">18-32</option>
            <option value="32_56">32-56</option>
            <option value="56_plus">56+</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={profile.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Select gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Skin Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skin Type
          </label>
          <select
            value={profile.skinType}
            onChange={(e) => handleChange('skinType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Select skin type</option>
            <option value="oily">Oily</option>
            <option value="dry">Dry</option>
            <option value="combination">Combination</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full btn-primary"
        >
          Save Profile & Continue
        </button>
      </form>
    </div>
  )
}

export default UserProfileForm 