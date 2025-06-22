import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      // Save the new user and navigate to the scanner page
      localStorage.setItem('dermascan-user', username.trim());
      navigate('/scanner');
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-login-bg bg-cover bg-center">
      
      {/* Left Panel - "DERMACARE" & Illustration */}
      <div className="w-3/5 h-screen flex items-center justify-center p-8 relative overflow-hidden">
        
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="font-quicksand text-7xl font-bold text-custom-blue tracking-[0.55em] uppercase whitespace-nowrap absolute" style={{ top: '-5%', left: '63%', transform: 'translateX(-50%)' }}>
            <span style={{ transform: 'rotate(-45deg) translateY(165px)', display: 'inline-block' }}>D</span>
            <span style={{ transform: 'rotate(-40deg) translateY(110px)', display: 'inline-block' }}>E</span>
            <span style={{ transform: 'rotate(-35deg) translateY(60px)', display: 'inline-block' }}>R</span>
            <span style={{ transform: 'rotate(-23deg) translateY(27px)', display: 'inline-block' }}>M</span>
            <span style={{ transform: 'rotate(0deg) translateY(20px)', display: 'inline-block' }}>A</span>
            <span style={{ transform: 'rotate(20deg) translateY(35px)', display: 'inline-block' }}>C</span>
            <span style={{ transform: 'rotate(35deg) translateY(70px)', display: 'inline-block' }}>A</span>
            <span style={{ transform: 'rotate(40deg) translateY(122px)', display: 'inline-block' }}>R</span>
            <span style={{ transform: 'rotate(43deg) translateY(182px)', display: 'inline-block' }}>E</span>
          </div>

        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-2/5 h-screen flex flex-col items-center justify-center p-12">
        
        <div className="relative mb-12">
          <h2 className="font-gloria text-8xl text-amber-200 ml-24">Login</h2>
          <h2 className="font-gloria text-8xl text-custom-blue absolute top-1 left-1 ml-24" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>Login</h2>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-sm ml-28">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ENTER YOUR USERNAME"
            className="w-full font-quicksand font-bold text-lg bg-white border-4 border-white rounded-xl p-4 text-center text-custom-pink tracking-wider uppercase placeholder-gray-400 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none"
            required
          />
          <button
            type="submit"
            className="w-full mt-6 font-quicksand font-bold text-2xl text-gray-700 bg-custom-yellow rounded-xl p-3 border-b-4 border-amber-400 transition-all duration-150 uppercase
            hover:bg-amber-300 active:scale-95 active:border-b-0"
          >
            Enter
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login; 