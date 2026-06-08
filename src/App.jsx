import { useState, useEffect } from 'react'
import './App.css'
import LoginPage from './LoginPage.jsx'
import Dashboard from './Invvv.jsx'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [navigateTarget, setNavigateTarget] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    const savedToken = localStorage.getItem('authToken')
    
    if (savedUser && savedToken) {
      try {
        // Try to parse as JSON object, fallback to string for backward compatibility
        const userObject = savedUser.startsWith('{') ? JSON.parse(savedUser) : { name: savedUser };
        console.log('Found existing session:', userObject);
        setCurrentUser(userObject);
        setLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        // Clear corrupted data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
      }
    }
    
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = (userResponse) => {
    console.log('Login success response:', userResponse); // Debug log
    
    // Store the complete user object
    const userObject = {
      id: userResponse.id,
      name: userResponse.name,
      email: userResponse.email,
      role: userResponse.role,
      department: userResponse.department,
      location: userResponse.location,
      phone: userResponse.phone
    };
    
    const token = userResponse?.token || 'temp-token';
    
    // Save to localStorage for session persistence
    localStorage.setItem('currentUser', JSON.stringify(userObject));
    localStorage.setItem('authToken', token);
    
    setCurrentUser(userObject);
    setLoggedIn(true);
  }

  const handleLogout = () => {
    // Clear session from localStorage
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    
    setLoggedIn(false)
    setCurrentUser(null)
  }

  // Show loading screen while checking for existing session
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8fafc',
        fontSize: '16px',
        color: '#64748b'
      }}>
        Loading...
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Dashboard 
      onLogout={handleLogout} 
      currentUser={currentUser} 
      navigateTarget={navigateTarget} 
      onNavigated={() => setNavigateTarget(null)} 
    />
  )
}

export default App