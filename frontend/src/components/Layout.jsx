import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

const Layout = () => {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('dermascan-user');
    if (user) {
      setUsername(user);
    }
  }, []);

  const handleProfileClick = () => {
    navigate('/view-profile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-pink-300 shadow-md">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/scanner">
            <h1 className="font-quicksand font-bold text-4xl text-white drop-shadow-sm uppercase">
              🧴 DermaScan
            </h1>
          </Link>

          {username && (
            <button
              onClick={handleProfileClick}
              className="font-quicksand font-bold text-lg text-white bg-white/20 rounded-full px-4 py-2 transition-colors hover:bg-white/40"
            >
              {username}
            </button>
          )}
        </div>
      </header>

      <main className="py-10">
        <Outlet /> {/* Child routes will render here */}
      </main>
    </div>
  );
};

export default Layout; 