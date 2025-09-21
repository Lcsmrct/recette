import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import RecetteCard from '../components/RecetteCard';
import { 
  Search, 
  Filter, 
  ChefHat, 
  Sparkles,
  Star,
  Clock,
  Users
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Recettes = () => {
  const [recettes, setRecettes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, rating, popular
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchData();
    checkUser();
  }, []);

  useEffect(() => {
    fetchRecettes();
  }, [searchTerm, selectedCategory, sortBy]);

  const checkUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Get user info from token or make a call to verify
      axios.get('/auth/me')
        .then(response => setUser(response.data))
        .catch(() => setUser(null));
    }
  };

  const fetchData = async () => {
    try {
      const [recettesResponse, categoriesResponse] = await Promise.all([
        axios.get('/recettes'),
        axios.get('/recettes/categories')
      ]);
      
      setRecettes(recettesResponse.data);
      setCategories(categoriesResponse.data.categories);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des recettes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecettes = async () => {
    try {
      let url = '/recettes';
      const params = new URLSearchParams();
      
      if (selectedCategory) {
        params.append('categorie', selectedCategory);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await axios.get(url);
      let recettes = response.data;
      
      // Sort results
      switch (sortBy) {
        case 'rating':
          recettes = recettes.sort((a, b) => b.note_moyenne - a.note_moyenne);
          break;
        case 'popular':
          recettes = recettes.sort((a, b) => b.nb_votes - a.nb_votes);
          break;
        case 'recent':
        default:
          recettes = recettes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
      }
      
      setRecettes(recettes);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast.error('Erreur lors de la recherche');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  const handleSort = (sortType) => {
    setSortBy(sortType);
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
          <p className="text-orange-800 font-medium">Chargement des délicieuses recettes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="playfair text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Découvrez nos Recettes
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explorez notre collection de recettes authentiques, 
            toutes vérifiées et approuvées par notre communauté.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="glass border-white/20 shadow-warm mb-8">
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                placeholder="Rechercher une recette, un ingrédient..."
              />
            </div>

            {/* Category Filters */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Catégories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCategory === category 
                        ? 'bg-red-500 text-white border-red-500' 
                        : getCategoryColor(category)
                    }`}
                    onClick={() => handleCategoryFilter(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-gray-900 text-sm">Trier par :</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('recent')}
                  className={sortBy === 'recent' ? 'bg-red-500 text-white' : 'border-gray-300 text-gray-700'}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Plus récentes
                </Button>
                <Button
                  variant={sortBy === 'rating' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('rating')}
                  className={sortBy === 'rating' ? 'bg-red-500 text-white' : 'border-gray-300 text-gray-700'}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Mieux notées
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('popular')}
                  className={sortBy === 'popular' ? 'bg-red-500 text-white' : 'border-gray-300 text-gray-700'}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Plus populaires
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {recettes.length} recette{recettes.length !== 1 ? 's' : ''} trouvée{recettes.length !== 1 ? 's' : ''}
            {selectedCategory && ` dans la catégorie "${selectedCategory}"`}
            {searchTerm && ` pour "${searchTerm}"`}
          </p>
        </div>

        {/* Recettes Grid */}
        {recettes.length === 0 ? (
          <Card className="glass border-white/20 shadow-warm">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Aucune recette trouvée
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || selectedCategory 
                  ? 'Essayez de modifier vos critères de recherche ou de supprimer les filtres.'
                  : 'Il n\'y a pas encore de recettes publiées. Soyez le premier à partager la vôtre !'
                }
              </p>
              {searchTerm || selectedCategory ? (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recettes.map((recette) => (
              <RecetteCard 
                key={recette.id} 
                recette={recette} 
                showActions={true}
                currentUser={user}
                onRate={(recetteId, note) => {
                  // Update local state optimistically
                  setRecettes(prev => prev.map(r => 
                    r.id === recetteId 
                      ? { ...r, note_moyenne: note, nb_votes: (r.nb_votes || 0) + 1 }
                      : r
                  ));
                }}
                onComment={(recetteId) => {
                  // You could refresh comments here if needed
                  console.log('Comment added to recipe:', recetteId);
                }}
              />
            ))}
          </div>
        )}

        {/* Load More Button (if needed for pagination) */}
        {recettes.length > 0 && recettes.length % 12 === 0 && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Charger plus de recettes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recettes;