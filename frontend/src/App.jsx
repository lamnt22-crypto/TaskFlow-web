import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PomodoroProvider } from './context/PomodoroContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import Kanban from './pages/Kanban';
import Calendar from './pages/Calendar';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import OAuthSuccess from './pages/OAuthSuccess';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatbot from './components/AIChatbot';
import { GamificationProvider } from './context/GamificationContext';

function App() {
  return (
    <ThemeProvider>
      <GamificationProvider>
        <AuthProvider>
          <PomodoroProvider>
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                className: 'dark:bg-slate-800 dark:text-white',
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
              }} 
            />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/oauth-success" element={<OAuthSuccess />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-tasks" element={<MyTasks />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
            {/* Render Chatbot globally */}
            <AIChatbot />
          </PomodoroProvider>
        </AuthProvider>
      </GamificationProvider>
    </ThemeProvider>
  );
}

export default App;
