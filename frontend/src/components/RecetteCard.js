import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Star, 
  Clock, 
  Users, 
  Heart,
  MessageSquare,
  ChefHat,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import RecipeDetailModal from './RecipeDetailModal';

const RecetteCard = ({ 
  recette, 
  showActions = false, 
  onRate, 
  onComment,
  currentUser 
}) => {
  const [rating, setRating] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getCategoryColor = (categorie) => {
    const categories = {
      'Entrée': 'category-entree',
      'Plat principal': 'category-plat', 
      'Dessert': 'category-dessert',
      'Boisson': 'category-boisson',
      'Apéritif': 'category-boisson',
      'Petit-déjeuner': 'category-plat',
      'Goûter': 'category-dessert',
      'Sauce': 'category-entree',
      'Autre': 'category-default'
    };
    return categories[categorie] || 'category-default';
  };

  const handleRating = async (note) => {
    if (!currentUser) {
      toast.error('Vous devez être connecté pour noter');
      return;
    }

    setSubmittingRating(true);
    try {
      await axios.post(`/recettes/${recette.id}/noter`, { note });
      setRating(note);
      toast.success('Note enregistrée !');
      if (onRate) onRate(recette.id, note);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement de la note');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Vous devez être connecté pour commenter');
      return;
    }

    if (!comment.trim()) {
      toast.error('Veuillez saisir un commentaire');
      return;
    }

    setSubmittingComment(true);
    try {
      await axios.post(`/recettes/${recette.id}/commentaires`, { 
        commentaire: comment.trim() 
      });
      setComment('');
      setShowCommentForm(false);
      toast.success('Commentaire ajouté !');
      if (onComment) onComment(recette.id);
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
          className={`h-4 w-4 ${
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

  return (
    <>
      <Card className="recipe-card overflow-hidden bg-white/80 backdrop-blur-sm border-white/20 shadow-warm hover:shadow-2xl transition-all duration-500 group cursor-pointer"
            onClick={() => setShowDetailModal(true)}>
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {recette.image ? (
            <img
              src={`data:image/jpeg;base64,${recette.image}`}
              alt={recette.titre}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
              <ChefHat className="h-16 w-16 text-orange-400 opacity-50" />
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`category-badge ${getCategoryColor(recette.categorie)}`}>
              {recette.categorie}
            </Badge>
          </div>

          {/* Rating Badge */}
          {recette.note_moyenne > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-gray-700">
                {recette.note_moyenne.toFixed(1)}
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Eye className="h-6 w-6 text-gray-700" />
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          {/* Title */}
          <h3 className="playfair text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
            {recette.titre}
          </h3>

          {/* Author */}
          <p className="text-sm text-gray-600 mb-3 flex items-center">
            <ChefHat className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>Par <span className="font-medium">{recette.auteur_nom}</span></span>
          </p>

          {/* Ingredients Preview */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            <span className="font-medium">Ingrédients : </span>
            <span className="break-words">
              {recette.ingredients.length > 80 
                ? `${recette.ingredients.substring(0, 80)}...` 
                : recette.ingredients
              }
            </span>
          </p>

          {/* Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {recette.nb_votes > 0 && (
                <span className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{recette.nb_votes} avis</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(recette.created_at).toLocaleDateString('fr-FR')}
                </span>
              </span>
            </div>
          </div>
        </CardContent>

        {/* Actions */}
        {showActions && (
          <CardFooter className="px-4 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-100"
                      onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                {/* Average Rating Display */}
                <div className="flex items-center space-x-1">
                  {renderStars(recette.note_moyenne)}
                  {recette.nb_votes > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({recette.nb_votes})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailModal(true);
                  }}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Voir détail</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommentForm(!showCommentForm);
                  }}
                  className="flex items-center space-x-1"
                  disabled={!currentUser}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Commenter</span>
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Detail Modal */}
      <RecipeDetailModal
        recette={recette}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        currentUser={currentUser}
        onRate={onRate}
        onComment={onComment}
      />
    </>
  );
};

export default RecetteCard;