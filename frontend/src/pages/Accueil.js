import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import RecetteCard from '../components/RecetteCard';
import { 
  ChefHat, 
  Star, 
  Users, 
  BookOpen, 
  Sparkles,
  TrendingUp,
  Award,
  Heart
} from 'lucide-react';
import axios from 'axios';

const Accueil = () => {
  const [recettesPopulaires, setRecettesPopulaires] = useState([]);
  const [stats, setStats] = useState({
    totalRecettes: 0,
    totalUtilisateurs: 0,
    moyenneNotes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccueilData();
  }, []);

  const fetchAccueilData = async () => {
    try {
      // Fetch popular recipes
      const recettesResponse = await axios.get('/recettes?limit=6');
      const recettes = recettesResponse.data;
      
      // Sort by rating and take top 6
      const recettesTriees = recettes
        .sort((a, b) => b.note_moyenne - a.note_moyenne)
        .slice(0, 6);
      
      setRecettesPopulaires(recettesTriees);
      
      // Calculate basic stats
      setStats({
        totalRecettes: recettes.length,
        totalUtilisateurs: 150, // Mock number
        moyenneNotes: recettes.length > 0 
          ? recettes.reduce((sum, r) => sum + r.note_moyenne, 0) / recettes.length 
          : 0
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ChefHat,
      title: "Recettes Authentiques",
      description: "Découvrez des recettes traditionnelles et modernes, toutes vérifiées par notre équipe.",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: Users,
      title: "Communauté Active",
      description: "Rejoignez une communauté passionnée de cuisine et partagez vos créations.",
      color: "from-orange-500 to-yellow-500"
    },
    {
      icon: Sparkles,
      title: "Suggestions IA",
      description: "Obtenez des idées de recettes personnalisées grâce à l'intelligence artificielle.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Award,
      title: "Qualité Garantie",
      description: "Toutes les recettes sont approuvées par nos chefs avant publication.",
      color: "from-green-500 to-teal-500"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-orange-800 font-medium">Chargement des délicieuses recettes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-red-100 opacity-60"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Floating chef hat */}
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white rounded-full shadow-2xl float">
                <ChefHat className="h-16 w-16 text-red-500" />
              </div>
            </div>
            
            <h1 className="playfair text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Délices</span>
              <br />
              <span className="text-gray-800">& Saveurs</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Explorez un univers de saveurs avec nos recettes authentiques, 
              partagées par une communauté passionnée de cuisine.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/recettes">
                <Button 
                  size="lg" 
                  className="btn-primary bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-warm hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Découvrir les Recettes
                </Button>
              </Link>
              
              <Link to="/register">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50 px-8 py-4 text-lg font-semibold hover:border-red-400 transition-all duration-300"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Rejoindre la Communauté
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalRecettes}+</div>
              <div className="text-gray-600">Recettes Disponibles</div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalUtilisateurs}+</div>
              <div className="text-gray-600">Membres Actifs</div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-500 rounded-full mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats.moyenneNotes.toFixed(1)}/5</div>
              <div className="text-gray-600">Note Moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Délices & Saveurs ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous offrons bien plus qu'un simple recueil de recettes. 
              Découvrez une expérience culinaire complète.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-stack glass border-white/20 hover:shadow-2xl transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Recipes Section */}
      {recettesPopulaires.length > 0 && (
        <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-red-500 mr-2" />
                <h2 className="playfair text-4xl md:text-5xl font-bold text-gray-900">
                  Recettes Populaires
                </h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Découvrez les créations culinaires les plus appréciées par notre communauté.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recettesPopulaires.map((recette) => (
                <RecetteCard 
                  key={recette.id} 
                  recette={recette} 
                  showActions={false}
                />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link to="/recettes">
                <Button 
                  size="lg"
                  className="btn-primary bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-warm"
                >
                  Voir Toutes les Recettes
                  <BookOpen className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <Heart className="h-16 w-16 text-white mx-auto mb-8 animate-pulse" />
            <h2 className="playfair text-4xl md:text-5xl font-bold text-white mb-6">
              Partagez Votre Passion Culinaire
            </h2>
            <p className="text-xl text-red-100 mb-8 leading-relaxed">
              Rejoignez notre communauté de chefs amateurs et professionnels. 
              Partagez vos recettes, découvrez de nouvelles saveurs, et créez des liens autour de la cuisine.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/register">
                <Button 
                  size="lg"
                  className="bg-white text-red-600 hover:bg-red-50 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <ChefHat className="mr-2 h-5 w-5" />
                  Commencer Maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Accueil;