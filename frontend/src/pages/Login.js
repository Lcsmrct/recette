import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ChefHat, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('/auth/login', formData);
      const { token, user } = response.data;
      
      onLogin(token, user);
      toast.success('Connexion réussie !');
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de la connexion';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const initAdmin = async () => {
    try {
      const response = await axios.post('/init-admin');
      toast.success(
        `Compte admin créé ! Email: admin@recettes.com, Mot de passe: admin123`,
        { duration: 10000 }
      );
    } catch (error) {
      if (error.response?.data?.message?.includes('déjà créé')) {
        toast.info('Le compte administrateur existe déjà');
      } else {
        toast.error('Erreur lors de la création du compte admin');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-pink-100"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg float">
              <ChefHat className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="playfair text-4xl font-bold text-gray-900 mb-2">
            Bon retour !
          </h2>
          <p className="text-gray-600">
            Connectez-vous pour accéder à vos recettes favorites
          </p>
        </div>

        {/* Login Form */}
        <Card className="form-container glass border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Connexion
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10 h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                    placeholder="votre@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-10 pr-10 h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="btn-primary w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-warm hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="h-5 w-5" />
                    <span>Se connecter</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link 
                    to="/register" 
                    className="font-medium text-red-600 hover:text-red-500 transition-colors"
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>

              {/* Admin Account Creation */}
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={initAdmin}
                  className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                  disabled={loading}
                >
                  Créer le compte administrateur
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Cliquez pour créer le compte admin par défaut
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts Info */}
        <Card className="glass border-white/20 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Comptes de démonstration :</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Admin :</strong> admin@recettes.com / admin123</p>
            <p className="text-xs text-gray-500">
              (Créez d'abord le compte admin avec le bouton ci-dessus)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;