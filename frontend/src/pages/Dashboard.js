import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import RecetteCard from '../components/RecetteCard';
import { 
  ChefHat, 
  Plus, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle,
  BookOpen,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Dashboard = ({ user }) => {
  const [mesRecettes, setMesRecettes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approuvees: 0,
    enAttente: 0,
    notesMoyennes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/recettes/mes');
      const recettes = response.data;
      setMesRecettes(recettes);
      
      // Calculate stats
      const approuvees = recettes.filter(r => r.approuve).length;
      const enAttente = recettes.filter(r => !r.approuve).length;
      const notesTotal = recettes.reduce((sum, r) => sum + (r.note_moyenne || 0), 0);
      const notesMoyennes = recettes.length > 0 ? notesTotal / recettes.length : 0;
      
      setStats({
        total: recettes.length,
        approuvees,
        enAttente,
        notesMoyennes
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement de vos recettes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (approuve) => {
    if (approuve) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approuvée
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-orange-800 font-medium">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="playfair text-3xl md:text-4xl font-bold text-gray-900">
                Bonjour, {user.nom} !
              </h1>
              <p className="text-gray-600">
                Bienvenue dans votre espace culinaire personnel
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/ajouter-recette">
              <Button className="btn-primary bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-warm">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter une Recette
              </Button>
            </Link>
            <Link to="/recettes">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <BookOpen className="h-5 w-5 mr-2" />
                Parcourir les Recettes
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recettes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approuvées</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approuvees}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Attente</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.enAttente}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.notesMoyennes.toFixed(1)}/5
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass border-white/20 shadow-warm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <span>Actions Rapides</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/ajouter-recette">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-full w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Nouvelle Recette</h3>
                    <p className="text-sm text-gray-600">Partagez votre dernière création culinaire</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/recettes">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Explorer</h3>
                    <p className="text-sm text-gray-600">Découvrez de nouvelles recettes inspirantes</p>
                  </CardContent>
                </Card>
              </Link>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-teal-500 rounded-full w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Communauté</h3>
                  <p className="text-sm text-gray-600">Connectez-vous avec d'autres chefs</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Mes Recettes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="playfair text-2xl md:text-3xl font-semibold text-gray-900">
              Mes Recettes
            </h2>
            {mesRecettes.length === 0 && (
              <Link to="/ajouter-recette">
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Première Recette
                </Button>
              </Link>
            )}
          </div>

          {mesRecettes.length === 0 ? (
            <Card className="glass border-white/20 shadow-warm">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6">
                  <ChefHat className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Aucune recette pour le moment
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Commencez votre aventure culinaire en partageant votre première recette avec notre communauté !
                </p>
                <Link to="/ajouter-recette">
                  <Button className="btn-primary bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-warm">
                    <Plus className="h-5 w-5 mr-2" />
                    Ajouter ma première recette
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {mesRecettes.map((recette) => (
                <Card key={recette.id} className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Image */}
                      <div className="lg:w-48 lg:h-36 w-full h-48 bg-gradient-to-br from-orange-200 to-red-200 rounded-lg overflow-hidden flex-shrink-0">
                        {recette.image ? (
                          <img
                            src={`data:image/jpeg;base64,${recette.image}`}
                            alt={recette.titre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="h-12 w-12 text-orange-400 opacity-50" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="playfair text-xl font-semibold text-gray-900 mb-2">
                              {recette.titre}
                            </h3>
                            <div className="flex items-center space-x-3 mb-3">
                              {getStatusBadge(recette.approuve)}
                              <Badge variant="outline" className="text-xs">
                                {recette.categorie}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {recette.note_moyenne > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span>{recette.note_moyenne.toFixed(1)}</span>
                                <span>({recette.nb_votes})</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          <span className="font-medium">Ingrédients :</span> {recette.ingredients}
                        </p>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          <span className="font-medium">Préparation :</span> {recette.instructions}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Créée le {new Date(recette.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {!recette.approuve && (
                            <div className="flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>En attente de validation</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;