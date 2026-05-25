import { useState } from 'react'
import './App.css'
import LoginPage from './LoginPage.jsx'
import Dashboard from './Invvv.jsx'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />
  }

  return <Dashboard onLogout={() => setLoggedIn(false)} />
}

export default App