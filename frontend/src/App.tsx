import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { TaskForm } from './pages/TaskForm';
import { TeamList } from './pages/TeamList';
import { Profile } from './pages/Profile';

import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import api from './api/axios';

const queryClient = new QueryClient();

function App() {
  const { token, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.data))
        .catch(() => logout());
    }
  }, [token, setUser, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/teams" element={<TeamList />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/projects/:projectId/tasks/new" element={<TaskForm />} />
              <Route path="/tasks/:taskId" element={<TaskForm />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
