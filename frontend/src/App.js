import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import "./App.css";

import Navigation from "./components/Navigation";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AjouterRecette from "./pages/AjouterRecette";
import Admin from "./pages/Admin";
import Recettes from "./pages/Recettes";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    toast.success("Connexion réussie !");
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success("Déconnexion réussie !");
  };

  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" />;
    }

    if (adminOnly && user.role !== 'admin') {
      return <Navigate to="/dashboard" />;
    }

    return children;
  };

  const PublicRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (user) {
      return <Navigate to="/dashboard" />;
    }

    return children;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-orange-800 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <Navigation user={user} onLogout={logout} />
        
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/recettes" element={<Recettes />} />
          
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login onLogin={login} />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register onLogin={login} />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ajouter-recette" 
            element={
              <ProtectedRoute>
                <AjouterRecette />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Routes>
        
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;