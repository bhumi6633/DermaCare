import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Results from './pages/Results'
import Profile from './pages/Profile'
import Layout from './components/Layout'
import Login from './pages/Login'
import ViewProfile from './pages/ViewProfile'

function App() {
  return (
    <Router>
      <Routes>
        {/* Root route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        
        {/* Routes with the main layout (pink header) */}
        <Route element={<Layout />}>
          <Route path="/scanner" element={<Home />} />
          <Route path="/results" element={<Results />} />
        </Route>

        {/* Pages with their own full-screen layout */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/view-profile" element={<ViewProfile />} />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App 