import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserProfileForm from '../components/UserProfileForm'

const Profile = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [initialProfile, setInitialProfile] = useState(null)

  useEffect(() => {
    const user = localStorage.getItem('dermascan-user')
    if (user) {
      setCurrentUser(user)
      // Load existing profile for this user, if any
      const savedProfile = localStorage.getItem(`dermascan-profile-${user}`)
      if (savedProfile) {
        setInitialProfile(JSON.parse(savedProfile))
      }
    } else {
      // If no user is logged in, redirect to login page
      navigate('/login')
    }
  }, [navigate])

  const handleProfileSubmit = (userProfile) => {
    if (currentUser) {
      // Store profile in localStorage, keyed by username
      localStorage.setItem(`dermascan-profile-${currentUser}`, JSON.stringify(userProfile))
    }
    // Navigate back to scanner with the updated profile
    navigate('/scanner', { state: { userProfile } })
  }

  return (
    <div className="min-h-screen bg-profile-bg bg-cover bg-center flex items-center justify-center p-4">
      <UserProfileForm 
        onProfileSubmit={handleProfileSubmit}
        initialProfile={initialProfile}
      />
    </div>
  )
}

export default Profile 