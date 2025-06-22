import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ViewProfile = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('dermascan-user');
    if (user) {
      setUsername(user);
      const savedProfile = localStorage.getItem(`dermascan-profile-${user}`);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('dermascan-user');
    // We can also remove the profile, but let's keep it for when they log back in
    navigate('/login');
  };

  const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen bg-profile-bg bg-cover bg-center flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl p-8 border-4 border-white text-center space-y-6">
        <h1 className="font-quicksand text-5xl font-bold text-custom-pink uppercase tracking-wider">
          {username}'s Profile
        </h1>

        {profile ? (
          <div className="space-y-4 text-left bg-white p-6 rounded-2xl border-2 border-custom-yellow">
            <p className="font-quicksand text-2xl"><span className="font-bold text-custom-pink">AGE GROUP:</span> {profile.age.replace('_', '-')}</p>
            <p className="font-quicksand text-2xl"><span className="font-bold text-custom-pink">GENDER:</span> {capitalize(profile.gender)}</p>
            <p className="font-quicksand text-2xl"><span className="font-bold text-custom-pink">SKIN TYPE:</span> {capitalize(profile.skinType)}</p>
          </div>
        ) : (
          <div className="text-gray-600">
            <p>No profile data found. Go to "Edit Profile" to create one!</p>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <Link 
            to="/profile"
            className="w-full font-quicksand font-bold text-2xl text-white bg-custom-pink rounded-xl p-3 border-b-4 border-pink-400 transition-all duration-150 uppercase hover:bg-pink-400 active:scale-95 active:border-b-0"
          >
            {profile ? 'Edit Profile' : 'Create Profile'}
          </Link>
          <button
            onClick={() => navigate('/scanner')}
            className="w-full font-quicksand font-bold text-xl text-white bg-custom-yellow rounded-xl p-3 border-b-4 border-amber-400 transition-all duration-150 uppercase hover:bg-amber-300 active:scale-95 active:border-b-0"
          >
            Back to Scanner
          </button>
          <button
            onClick={handleLogout}
            className="w-full font-quicksand font-bold text-lg text-gray-700 bg-gray-300 rounded-xl p-2 border-b-4 border-gray-400 transition-all duration-150 uppercase hover:bg-gray-400 active:scale-95 active:border-b-0"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile; 