import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const UserProfileForm = ({ onProfileSubmit, initialProfile = null }) => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(initialProfile || {
    age: '',
    gender: '',
    skinType: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (profile.age && profile.gender && profile.skinType) {
      setIsSubmitting(true)
      setTimeout(() => {
        onProfileSubmit(profile)
        setIsSubmitting(false)
      }, 300)
    }
  }

  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="bg-stone-50 rounded-3xl p-8 w-full max-w-md border-4 border-white">
      <h2 className="font-quicksand font-bold text-5xl text-center text-custom-pink mb-8 uppercase">
        Design Your Profile
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input fields */}
        {[
          {
            name: 'age',
            value: profile.age,
            options: [
              { value: '', label: 'Select Age Group' },
              { value: 'under_18', label: 'Under 18' },
              { value: '18_32', label: '18-32' },
              { value: '32_56', label: '32-56' },
              { value: '56_plus', label: '56+' },
            ],
          },
          {
            name: 'gender',
            value: profile.gender,
            options: [
              { value: '', label: 'Select Gender' },
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'other', label: 'Other' },
            ],
          },
          {
            name: 'skinType',
            value: profile.skinType,
            options: [
              { value: '', label: 'Select Skin Type' },
              { value: 'oily', label: 'Oily' },
              { value: 'dry', label: 'Dry' },
              { value: 'combination', label: 'Combination' },
            ],
          },
        ].map((field) => (
          <select
            key={field.name}
            value={field.value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full font-quicksand font-bold text-xl bg-white border-2 border-custom-yellow rounded-xl p-3 focus:ring-2 focus:ring-custom-pink focus:border-transparent outline-none text-center text-custom-pink uppercase"
            required
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value} className="text-gray-700">
                {option.label}
              </option>
            ))}
          </select>
        ))}

        <button
          type="submit"
          className={`w-full font-quicksand font-bold text-3xl text-white bg-custom-pink rounded-xl p-3 border-b-4 border-pink-400 transition-all duration-150 uppercase
            ${isSubmitting ? 'transform scale-95 border-b-0' : 'hover:bg-pink-400 active:scale-95 active:border-b-0'}
          `}
        >
          Submit
        </button>
      </form>
      
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/scanner')}
          className="font-quicksand font-bold text-lg text-custom-pink hover:text-pink-500 transition-colors uppercase"
        >
          Skip and go to scanner
        </button>
      </div>
    </div>
  )
}

export default UserProfileForm 