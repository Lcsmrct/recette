import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import SmartTextArea from '../components/SmartTextArea';
import AIResponseFormatter from '../components/AIResponseFormatter';
import { 
  ChefHat, 
  Upload, 
  X, 
  Camera, 
  Sparkles,
  Send,
  Clock,
  Users,
  Star,
  Wand2,
  Bot
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'sonner';

const AjouterRecette = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    titre: '',
    ingredients: '',
    instructions: '',
    categorie: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiIngredients, setAiIngredients] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/recettes/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleAISuggestion = async () => {
    if (!aiIngredients.trim()) {
      toast.error('Veuillez saisir des ingrédients pour obtenir une suggestion');
      return;
    }

    setLoadingAI(true);
    try {
      const response = await axios.post('/ia/suggestions', {
        ingredients: aiIngredients
      });
      
      setAiSuggestion(response.data.suggestion);
      toast.success('Suggestion générée avec succès !');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de la génération de la suggestion';
      toast.error(message);
    } finally {
      setLoadingAI(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      // Enhanced parsing similar to AIResponseFormatter
      const parseResponse = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        let structure = {
          title: '',
          ingredients: [],
          instructions: [],
          category: ''
        };

        let currentSection = '';
        
        lines.forEach((line, index) => {
          const lower = line.toLowerCase().trim();
          const clean = line.trim();
          
          // Detect title (usually first meaningful line or contains "recette")
          if (!structure.title && (index < 3 || lower.includes('recette') || lower.includes('titre'))) {
            if (clean.includes(':')) {
              structure.title = clean.split(':')[1]?.trim() || clean.split(':')[0].trim();
            } else if (!lower.includes('ingrédient') && !lower.includes('préparation') && !lower.includes('instruction')) {
              structure.title = clean.replace(/^#+\s*/, '').replace(/^\*+\s*/, '').replace(/^recette\s*:?\s*/i, '');
            }
          }
          
          // Detect sections
          if (lower.includes('ingrédient') || lower.includes('ingredients')) {
            currentSection = 'ingredients';
            return;
          } else if (lower.includes('instruction') || lower.includes('préparation') || lower.includes('preparation') || lower.includes('étapes')) {
            currentSection = 'instructions';
            return;
          }
          
          // Extract metadata
          if (lower.includes('catégorie') || lower.includes('category')) {
            structure.category = clean.split(':')[1]?.trim() || '';
          }
          
          // Add content to current section
          if (currentSection === 'ingredients' && clean && !lower.includes('ingrédient') && !lower.includes('instruction')) {
            const ingredient = clean.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
            if (ingredient) {
              structure.ingredients.push(ingredient);
            }
          } else if (currentSection === 'instructions' && clean && !lower.includes('instruction') && !lower.includes('préparation')) {
            const instruction = clean.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
            if (instruction) {
              structure.instructions.push(instruction);
            }
          }
        });

        return structure;
      };

      const parsed = parseResponse(aiSuggestion);
      
      // Format ingredients as bullet points
      const formattedIngredients = parsed.ingredients.length > 0 
        ? parsed.ingredients.map(ing => `- ${ing}`).join('\n')
        : '';
      
      // Format instructions as numbered steps
      const formattedInstructions = parsed.instructions.length > 0
        ? parsed.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n')
        : aiSuggestion; // Fallback to original suggestion
      
      // Update form data
      const newFormData = {
        ...formData,
        titre: parsed.title || formData.titre || 'Recette suggérée par IA',
        ingredients: formattedIngredients || formData.ingredients,
        instructions: formattedInstructions || formData.instructions
      };
      
      // Set category if detected and not already set
      if (parsed.category && !formData.categorie) {
        newFormData.categorie = parsed.category;
      }
      
      setFormData(newFormData);
      setShowAISuggestion(false);
      
      toast.success('Recette appliquée avec succès ! 🎉', {
        description: `${parsed.ingredients.length} ingrédients et ${parsed.instructions.length} étapes ajoutés`
      });
    }
  };

  const validateForm = () => {
    if (!formData.titre.trim()) {
      toast.error('Veuillez saisir un titre pour votre recette');
      return false;
    }

    if (!formData.ingredients.trim()) {
      toast.error('Veuillez saisir la liste des ingrédients');
      return false;
    }

    if (!formData.instructions.trim()) {
      toast.error('Veuillez saisir les instructions de préparation');
      return false;
    }

    if (!formData.categorie) {
      toast.error('Veuillez sélectionner une catégorie');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('titre', formData.titre);
      submitData.append('ingredients', formData.ingredients);
      submitData.append('instructions', formData.instructions);
      submitData.append('categorie', formData.categorie);
      
      if (image) {
        submitData.append('image', image);
      }

      await axios.post('/recettes', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Recette ajoutée avec succès ! Elle sera visible après validation par un administrateur.');
      navigate('/dashboard');
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'ajout de la recette';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="playfair text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Partager une Nouvelle Recette
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Partagez votre création culinaire avec notre communauté passionnée. 
            Votre recette sera examinée avant publication.
          </p>
        </div>

        {/* AI Suggestion Card */}
        <Card className="glass border-white/20 shadow-warm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>Assistant IA pour Recettes</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAISuggestion(!showAISuggestion)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                {showAISuggestion ? 'Masquer' : 'Utiliser l\'IA'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showAISuggestion && (
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 mb-3">
                    💡 <strong>Astuce :</strong> Listez les ingrédients que vous avez, et notre IA vous suggérera une délicieuse recette !
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="ai-ingredients" className="text-sm font-medium text-gray-700">
                    Quels ingrédients avez-vous ?
                  </Label>
                  <Textarea
                    id="ai-ingredients"
                    value={aiIngredients}
                    onChange={(e) => setAiIngredients(e.target.value)}
                    placeholder="Ex: tomates, basilic frais, mozzarella, huile d'olive, vinaigre balsamique..."
                    className="mt-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
                
                <Button
                  type="button"
                  onClick={handleAISuggestion}
                  disabled={loadingAI || !aiIngredients.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                >
                  {loadingAI ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>L'IA réfléchit à votre recette...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Créer une recette avec l'IA</span>
                    </div>
                  )}
                </Button>

                {aiSuggestion && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-xl border border-purple-200 shadow-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-purple-900">Recette suggérée par l'IA :</h4>
                    </div>
                    
                    <div className="mb-6">
                      <AIResponseFormatter response={aiSuggestion} />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={applyAISuggestion}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Utiliser cette recette
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setAiSuggestion('')}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        Nouvelle suggestion
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Main Form */}
        <Card className="glass border-white/20 shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="titre" className="text-sm font-medium text-gray-700">
                  Titre de la recette *
                </Label>
                <Input
                  id="titre"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  className="input-field h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                  placeholder="Ex: Tarte aux pommes de grand-mère"
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="categorie" className="text-sm font-medium text-gray-700">
                  Catégorie *
                </Label>
                <select
                  id="categorie"
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  className="w-full h-12 px-3 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-red-500 focus:ring-1 transition-all"
                  disabled={loading}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Photo de la recette (optionnel)
                </Label>
                
                {!imagePreview ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all hover:border-red-400 hover:bg-red-50 ${
                      isDragActive ? 'border-red-400 bg-red-50' : ''
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      {isDragActive 
                        ? 'Déposez votre image ici...'
                        : 'Glissez-déposez une image, ou cliquez pour sélectionner'
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      PNG, JPG, WEBP jusqu'à 5MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full h-48 sm:h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors touch-target"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                <Label htmlFor="ingredients" className="text-sm font-medium text-gray-700">
                  Ingrédients *
                </Label>
                <SmartTextArea
                  id="ingredients"
                  name="ingredients"
                  type="ingredients"
                  value={formData.ingredients}
                  onChange={handleChange}
                  className="min-h-32 border-gray-200 focus:border-red-500 focus:ring-red-500"
                  placeholder="Listez tous les ingrédients nécessaires avec les quantités&#10;Ex:&#10;- 3 pommes golden&#10;- 200g de farine&#10;- 100g de beurre&#10;- 2 œufs"
                  disabled={loading}
                  rows={6}
                />
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-sm font-medium text-gray-700">
                  Instructions de préparation *
                </Label>
                <SmartTextArea
                  id="instructions"
                  name="instructions"
                  type="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  className="min-h-40 border-gray-200 focus:border-red-500 focus:ring-red-500"
                  placeholder="Décrivez étape par étape la préparation de votre recette&#10;Ex:&#10;1. Préchauffez le four à 180°C&#10;2. Épluchez et coupez les pommes...&#10;3. Dans un saladier, mélangez la farine..."
                  disabled={loading}
                  rows={8}
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 form-buttons">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
                >
                  Annuler
                </Button>
                
                <Button
                  type="submit"
                  className="btn-primary bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 shadow-warm order-1 sm:order-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Publication...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>Publier la recette</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Info Notice */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Processus de validation</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Votre recette sera examinée par notre équipe avant d'être publiée. 
                    Cela permet de maintenir la qualité de notre plateforme. 
                    Vous serez notifié une fois votre recette approuvée !
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AjouterRecette;