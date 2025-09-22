import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Star, 
  Clock, 
  Users, 
  ChefHat,
  MessageSquare,
  X,
  Heart,
  Share2,
  BookOpen,
  Utensils
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const RecipeDetailModal = ({ 
  recette, 
  isOpen, 
  onClose, 
  currentUser,
  onRate,
  onComment
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

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
      <li key={index} className="flex items-start space-x-2 py-1">
        <span className="text-orange-500 font-bold">•</span>
        <span className="text-gray-700">{ingredient.trim()}</span>
      </li>
    ));
  };

  const formatInstructions = (instructions) => {
    return instructions.split('\n').filter(line => line.trim()).map((instruction, index) => (
      <div key={index} className="flex items-start space-x-3 py-2">
        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </div>
        <p className="text-gray-700 leading-relaxed">{instruction.trim()}</p>
      </div>
    ));
  };

  if (!recette) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{recette?.titre || 'Détails de la recette'}</DialogTitle>
          <DialogDescription>
            Recette de {recette?.auteur_nom} - {recette?.categorie}. 
            Consultez les ingrédients, instructions et notez cette recette.
          </DialogDescription>
        </DialogHeader>
        
        {/* Header with Image */}
        <div className="relative">
          {recette.image ? (
            <div className="h-64 sm:h-80 overflow-hidden rounded-t-lg">
              <img
                src={`data:image/jpeg;base64,${recette.image}`}
                alt={recette.titre}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 sm:h-80 bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center rounded-t-lg">
              <ChefHat className="h-20 w-20 text-orange-400 opacity-50" />
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <Badge className={`${getCategoryColor(recette.categorie)} px-3 py-1 text-sm font-medium`}>
              {recette.categorie}
            </Badge>
          </div>

          {/* Rating Badge */}
          {recette.note_moyenne > 0 && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 shadow-lg">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-gray-800">
                {recette.note_moyenne.toFixed(1)}
              </span>
              <span className="text-xs text-gray-600">({recette.nb_votes})</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Title and Author */}
          <div className="mb-6">
            <h1 className="playfair text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {recette.titre}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <ChefHat className="h-4 w-4" />
                <span>Par <span className="font-medium">{recette.auteur_nom}</span></span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(recette.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {recette.nb_votes > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{recette.nb_votes} avis</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ingredients */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <Utensils className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-900">Ingrédients</h2>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {formatIngredients(recette.ingredients)}
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <BookOpen className="h-5 w-5 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">Préparation</h2>
              </div>
              <div className="space-y-3">
                {formatInstructions(recette.instructions)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
            {/* Rating */}
            {currentUser && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-700">Noter cette recette :</span>
                  <div className="flex items-center space-x-1">
                    {renderStars(0, true)}
                  </div>
                </div>
                
                {submittingRating && (
                  <p className="text-sm text-blue-600">Enregistrement...</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowCommentForm(!showCommentForm)}
                variant="outline"
                className="flex items-center space-x-2"
                disabled={!currentUser}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Commenter</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => toast.success('Fonctionnalité bientôt disponible')}
              >
                <Heart className="h-4 w-4" />
                <span>Ajouter aux favoris</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: recette.titre,
                      text: `Découvrez cette délicieuse recette : ${recette.titre}`,
                      url: window.location.href
                    });
                  } else {
                    toast.success('Lien copié dans le presse-papier!');
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                <span>Partager</span>
              </Button>
            </div>

            {/* Comment Form */}
            {showCommentForm && currentUser && (
              <div className="bg-gray-50 rounded-lg p-4">
                <form onSubmit={handleComment} className="space-y-4">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre avis sur cette recette..."
                    className="resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                    disabled={submittingComment}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCommentForm(false)}
                      disabled={submittingComment}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                      disabled={submittingComment}
                    >
                      {submittingComment ? 'Envoi...' : 'Commenter'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailModal;