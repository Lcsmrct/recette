import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Star,
  ChefHat,
  Eye,
  Trash2,
  Calendar,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Admin = () => {
  const [recettesEnAttente, setRecettesEnAttente] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_recettes: 0,
    recettes_approuvees: 0,
    recettes_en_attente: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedRecette, setExpandedRecette] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [recettesResponse, statsResponse] = await Promise.all([
        axios.get('/admin/recettes'),
        axios.get('/admin/stats')
      ]);
      
      setRecettesEnAttente(recettesResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const approuverRecette = async (recetteId) => {
    try {
      await axios.post(`/admin/recettes/${recetteId}/approuver`);
      
      // Update local state
      setRecettesEnAttente(prev => prev.filter(r => r.id !== recetteId));
      setStats(prev => ({
        ...prev,
        recettes_approuvees: prev.recettes_approuvees + 1,
        recettes_en_attente: prev.recettes_en_attente - 1
      }));
      
      toast.success('Recette approuvée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation de la recette');
    }
  };

  const rejeterRecette = async (recetteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter et supprimer cette recette ?')) {
      return;
    }

    try {
      await axios.delete(`/admin/recettes/${recetteId}`);
      
      // Update local state
      setRecettesEnAttente(prev => prev.filter(r => r.id !== recetteId));
      setStats(prev => ({
        ...prev,
        total_recettes: prev.total_recettes - 1,
        recettes_en_attente: prev.recettes_en_attente - 1
      }));
      
      toast.success('Recette rejetée et supprimée');
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet de la recette');
    }
  };

  const getCategoryColor = (categorie) => {
    const categories = {
      'Entrée': 'bg-green-100 text-green-800 border-green-200',
      'Plat principal': 'bg-orange-100 text-orange-800 border-orange-200', 
      'Dessert': 'bg-pink-100 text-pink-800 border-pink-200',
      'Boisson': 'bg-blue-100 text-blue-800 border-blue-200',
      'Apéritif': 'bg-purple-100 text-purple-800 border-purple-200',
      'Petit-déjeuner': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Goûter': 'bg-red-100 text-red-800 border-red-200',
      'Sauce': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Autre': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return categories[categorie] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-orange-800 font-medium">Chargement du panneau d'administration...</p>
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
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="playfair text-3xl md:text-4xl font-bold text-gray-900">
                Administration
              </h1>
              <p className="text-gray-600">
                Gérez les recettes et surveillez l'activité de la plateforme
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total_users}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recettes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_recettes}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-warm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approuvées</p>
                  <p className="text-3xl font-bold text-green-600">{stats.recettes_approuvees}</p>
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
                  <p className="text-3xl font-bold text-yellow-600">{stats.recettes_en_attente}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recettes en attente */}
        <Card className="glass border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span>Recettes en attente de validation</span>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                {recettesEnAttente.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {recettesEnAttente.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Aucune recette en attente
                </h3>
                <p className="text-gray-600">
                  Toutes les recettes soumises ont été traitées. Excellent travail !
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {recettesEnAttente.map((recette) => (
                  <Card key={recette.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
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
                                <Badge className={getCategoryColor(recette.categorie)}>
                                  {recette.categorie}
                                </Badge>
                                <div className="flex items-center text-sm text-gray-600">
                                  <ChefHat className="h-4 w-4 mr-1" />
                                  <span>Par {recette.auteur_nom}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>
                                    {new Date(recette.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Preview content */}
                          <div className={`space-y-3 ${expandedRecette === recette.id ? '' : 'max-h-32 overflow-hidden'}`}>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Ingrédients :</p>
                              <p className="text-sm text-gray-600">{recette.ingredients}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Instructions :</p>
                              <p className="text-sm text-gray-600">{recette.instructions}</p>
                            </div>
                          </div>

                          {/* Expand/Collapse button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedRecette(
                              expandedRecette === recette.id ? null : recette.id
                            )}
                            className="mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {expandedRecette === recette.id ? 'Voir moins' : 'Voir plus'}
                          </Button>

                          {/* Action buttons */}
                          <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
                            <Button
                              onClick={() => approuverRecette(recette.id)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approuver
                            </Button>
                            
                            <Button
                              onClick={() => rejeterRecette(recette.id)}
                              variant="destructive"
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Admin Tools */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass border-white/20 shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span>Statistiques Rapides</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux d'approbation</span>
                  <span className="font-semibold">
                    {stats.total_recettes > 0 
                      ? Math.round((stats.recettes_approuvees / stats.total_recettes) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recettes par utilisateur</span>
                  <span className="font-semibold">
                    {stats.total_users > 0 
                      ? (stats.total_recettes / stats.total_users).toFixed(1)
                      : 0
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En attente de validation</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.recettes_en_attente}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <span>Actions Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300"
                  onClick={() => window.location.reload()}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Actualiser les données
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    const stats = `
Statistiques de la plateforme:
- Utilisateurs: ${stats.total_users}
- Recettes totales: ${stats.total_recettes}
- Recettes approuvées: ${stats.recettes_approuvees}
- En attente: ${stats.recettes_en_attente}
                    `;
                    navigator.clipboard.writeText(stats);
                    toast.success('Statistiques copiées dans le presse-papiers');
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Exporter les statistiques
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;