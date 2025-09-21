import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  ChefHat, 
  Home, 
  Book, 
  Plus, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="glass border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="playfair text-2xl font-bold gradient-text">
              Délices & Saveurs
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive('/') 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Accueil</span>
            </Link>

            <Link 
              to="/recettes" 
              className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive('/recettes') 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Book className="h-4 w-4" />
              <span>Recettes</span>
            </Link>

            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive('/dashboard') 
                      ? 'text-red-600 bg-red-50' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Tableau de bord</span>
                </Link>

                <Link 
                  to="/ajouter-recette" 
                  className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive('/ajouter-recette') 
                      ? 'text-red-600 bg-red-50' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter</span>
                </Link>

                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive('/admin') 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Administration</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-white/50 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.nom}</span>
                </div>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                    Connexion
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    size="sm" 
                    className="btn-primary bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-warm"
                  >
                    Inscription
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden border-t border-white/20 bg-white/30">
          <div className="px-4 py-3 space-y-2">
            <Link 
              to="/dashboard" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive('/dashboard') 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Tableau de bord</span>
            </Link>

            <Link 
              to="/ajouter-recette" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive('/ajouter-recette') 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une recette</span>
            </Link>

            {user.role === 'admin' && (
              <Link 
                to="/admin" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive('/admin') 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Administration</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;