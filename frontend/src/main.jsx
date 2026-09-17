import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import './i18n' // Import i18n for translations

import { PomodoroProvider } from './context/PomodoroContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PomodoroProvider>
          <App />
        </PomodoroProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
