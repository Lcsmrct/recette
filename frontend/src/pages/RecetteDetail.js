import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ChefHat, 
  Clock, 
  Users, 
  Star, 
  ArrowLeft,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  User,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const RecetteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recette, setRecette] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchRecetteDetail();
    checkUser();
  }, [id]);

  const checkUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/auth/me')
        .then(response => setUser(response.data))
        .catch(() => setUser(null));
    }
  };

  const fetchRecetteDetail = async () => {
    try {
      // Fetch recette details
      const recettesResponse = await axios.get('/recettes');
      const foundRecette = recettesResponse.data.find(r => r.id === id);
      
      if (!foundRecette) {
        toast.error('Recette introuvable');
        navigate('/recettes');
        return;
      }
      
      setRecette(foundRecette);
      
      // Fetch comments
      try {
        const commentsResponse = await axios.get(`/recettes/${id}/commentaires`);
        setCommentaires(commentsResponse.data);
      } catch (error) {
        console.log('Pas de commentaires disponibles');
        setCommentaires([]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement de la recette');
      navigate('/recettes');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categorie) => {
    const categories = {
      'Entrée': 'bg-green-500 text-white',
      'Plat principal': 'bg-orange-500 text-white', 
      'Dessert': 'bg-pink-500 text-white',
      'Boisson': 'bg-blue-500 text-white',
      'Apéritif': 'bg-purple-500 text-white',
      'Petit-déjeuner': 'bg-yellow-500 text-white',
      'Goûter': 'bg-red-500 text-white',
      'Sauce': 'bg-indigo-500 text-white',
      'Autre': 'bg-gray-500 text-white'
    };
    return categories[categorie] || 'bg-gray-500 text-white';
  };

  const handleRating = async (note) => {
    if (!user) {
      toast.error('Vous devez être connecté pour noter');
      return;
    }

    setSubmittingRating(true);
    try {
      await axios.post(`/recettes/${id}/noter`, { note });
      setRating(note);
      toast.success('Note enregistrée !');
      
      // Refresh recette data to get updated rating
      fetchRecetteDetail();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement de la note');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vous devez être connecté pour commenter');
      return;
    }

    if (!comment.trim()) {
      toast.error('Veuillez saisir un commentaire');
      return;
    }

    setSubmittingComment(true);
    try {
      await axios.post(`/recettes/${id}/commentaires`, { 
        commentaire: comment.trim() 
      });
      setComment('');
      setShowCommentForm(false);
      toast.success('Commentaire ajouté !');
      fetchRecetteDetail(); // Refresh to show new comment
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderStars = (average, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-5 w-5 ${
            interactive 
              ? 'cursor-pointer hover:scale-110 transition-transform' 
              : ''
          } ${
            i <= (interactive ? rating : average) 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300'
          }`}
          onClick={interactive ? () => handleRating(i) : undefined}
        />
      );
    }
    return stars;
  };

  const formatIngredients = (ingredients) => {
    return ingredients.split('\n').filter(line => line.trim()).map((ingredient, index) => (
      <li key={index} className="flex items-start space-x-3 py-2">
        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
        <span className="text-gray-700">{ingredient.replace(/^-\s*/, '').trim()}</span>
      </li>
    ));
  };

  const formatInstructions = (instructions) => {
    return instructions.split('\n').filter(line => line.trim()).map((instruction, index) => (
      <div key={index} className="flex items-start space-x-4 py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {index + 1}
        </div>
        <p className="text-gray-700 leading-relaxed">{instruction.replace(/^\d+\.\s*/, '').trim()}</p>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-orange-800 font-medium">Chargement de la recette...</p>
        </div>
      </div>
    );
  }

  if (!recette) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Recette introuvable</h2>
          <p className="text-gray-600 mb-4">Cette recette n'existe pas ou a été supprimée.</p>
          <Button onClick={() => navigate('/recettes')} className="bg-red-500 hover:bg-red-600">
            Retour aux recettes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/recettes')}
            variant="outline"
            className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour aux recettes</span>
          </Button>
        </div>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <div className="relative">
            <div className="aspect-video lg:aspect-square w-full rounded-xl overflow-hidden shadow-2xl">
              {recette.image ? (
                <img
                  src={`data:image/jpeg;base64,${recette.image}`}
                  alt={recette.titre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
                  <ChefHat className="h-24 w-24 text-orange-400 opacity-50" />
                </div>
              )}
            </div>
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <Badge className={`${getCategoryColor(recette.categorie)} px-3 py-1 text-sm font-semibold`}>
                {recette.categorie}
              </Badge>
            </div>
          </div>

          {/* Recipe Info */}
          <div className="space-y-6">
            <div>
              <h1 className="playfair text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {recette.titre}
              </h1>
              
              {/* Author and Date */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Par {recette.auteur_nom}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(recette.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Rating Display */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-1">
                  {renderStars(recette.note_moyenne)}
                  <span className="text-lg font-semibold text-gray-900 ml-2">
                    {recette.note_moyenne > 0 ? recette.note_moyenne.toFixed(1) : 'Non noté'}
                  </span>
                </div>
                {recette.nb_votes > 0 && (
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{recette.nb_votes} avis</span>
                  </div>
                )}
              </div>

              {/* Interactive Rating */}
              {user && (
                <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <span className="font-medium text-gray-800">Notez cette recette :</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(0, true)}
                    </div>
                  </div>
                  {submittingRating && (
                    <p className="text-xs text-blue-600 mt-2">Enregistrement de la note...</p>
                  )}
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600"
                  disabled={!user}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Commenter</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Heart className="h-4 w-4" />
                  <span>Favoris</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Partager</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        {showCommentForm && user && (
          <Card className="glass border-white/20 shadow-warm mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ajouter un commentaire</h3>
              <form onSubmit={handleComment} className="space-y-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre avis sur cette recette..."
                  className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  disabled={submittingComment}
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCommentForm(false)}
                    disabled={submittingComment}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    disabled={submittingComment}
                  >
                    {submittingComment ? 'Envoi...' : 'Publier'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recipe Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <Card className="glass border-white/20 shadow-warm sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                    <ChefHat className="h-5 w-5 text-white" />
                  </div>
                  <span>Ingrédients</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {formatIngredients(recette.ingredients)}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <Card className="glass border-white/20 shadow-warm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span>Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {formatInstructions(recette.instructions)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments Section */}
        {commentaires.length > 0 && (
          <Card className="glass border-white/20 shadow-warm mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <span>Commentaires ({commentaires.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {commentaires.map((commentaire, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {commentaire.auteur_nom?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {commentaire.auteur_nom || 'Utilisateur'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(commentaire.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{commentaire.commentaire}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Recipes suggestion */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Envie de découvrir d'autres recettes ?</h3>
          <Link to="/recettes">
            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3">
              Voir toutes les recettes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecetteDetail;