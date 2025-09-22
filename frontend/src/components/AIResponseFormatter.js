import React from 'react';
import { ChefHat, Utensils, BookOpen, Star } from 'lucide-react';

const AIResponseFormatter = ({ response }) => {
  if (!response) return null;

  // Parse the AI response to extract structured data
  const parseResponse = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    let structure = {
      title: '',
      ingredients: [],
      instructions: [],
      tips: [],
      category: '',
      difficulty: '',
      time: ''
    };

    let currentSection = '';
    
    lines.forEach((line, index) => {
      const lower = line.toLowerCase().trim();
      const clean = line.trim();
      
      // Detect title (usually first meaningful line or contains "recette")
      if (!structure.title && (index < 3 || lower.includes('recette') || lower.includes('titre'))) {
        if (clean.includes(':')) {
          structure.title = clean.split(':')[1].trim() || clean.split(':')[0].trim();
        } else if (!lower.includes('ingrédient') && !lower.includes('préparation') && !lower.includes('instruction')) {
          structure.title = clean.replace(/^#+\s*/, '').replace(/^\*+\s*/, '');
        }
      }
      
      // Detect sections
      if (lower.includes('ingrédient') || lower.includes('ingredients')) {
        currentSection = 'ingredients';
        return;
      } else if (lower.includes('instruction') || lower.includes('préparation') || lower.includes('preparation') || lower.includes('étapes')) {
        currentSection = 'instructions';
        return;
      } else if (lower.includes('conseil') || lower.includes('astuce') || lower.includes('tip')) {
        currentSection = 'tips';
        return;
      }
      
      // Extract metadata
      if (lower.includes('catégorie') || lower.includes('category')) {
        structure.category = clean.split(':')[1]?.trim() || '';
      } else if (lower.includes('difficulté') || lower.includes('difficulty')) {
        structure.difficulty = clean.split(':')[1]?.trim() || '';
      } else if (lower.includes('temps') || lower.includes('time') || lower.includes('durée')) {
        structure.time = clean.split(':')[1]?.trim() || '';
      }
      
      // Add content to current section
      if (currentSection === 'ingredients' && clean && !lower.includes('ingrédient') && !lower.includes('instruction')) {
        structure.ingredients.push(clean.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'instructions' && clean && !lower.includes('instruction') && !lower.includes('préparation')) {
        structure.instructions.push(clean.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'tips' && clean && !lower.includes('conseil') && !lower.includes('astuce')) {
        structure.tips.push(clean.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''));
      }
    });

    // If parsing failed, fallback to simple display
    if (!structure.ingredients.length && !structure.instructions.length) {
      structure.instructions = lines.filter(line => line.trim());
    }

    return structure;
  };

  const parsedResponse = parseResponse(response);

  return (
    <div className="space-y-6">
      {/* Title */}
      {parsedResponse.title && (
        <div className="text-center">
          <h3 className="playfair text-2xl font-bold text-gray-900 mb-2">
            {parsedResponse.title}
          </h3>
          {parsedResponse.category && (
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {parsedResponse.category}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      {(parsedResponse.difficulty || parsedResponse.time) && (
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          {parsedResponse.difficulty && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Star className="h-4 w-4" />
              <span>Difficulté: {parsedResponse.difficulty}</span>
            </div>
          )}
          {parsedResponse.time && (
            <div className="flex items-center space-x-1 text-gray-600">
              <ChefHat className="h-4 w-4" />
              <span>Temps: {parsedResponse.time}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients */}
        {parsedResponse.ingredients.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center space-x-2 mb-3">
              <Utensils className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-orange-900">Ingrédients</h4>
            </div>
            <ul className="space-y-2">
              {parsedResponse.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-orange-500 font-bold mt-1">•</span>
                  <span className="text-orange-800 leading-relaxed">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {parsedResponse.instructions.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Préparation</h4>
            </div>
            <ol className="space-y-3">
              {parsedResponse.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span className="text-blue-800 leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Tips */}
      {parsedResponse.tips.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center space-x-2 mb-3">
            <Star className="h-5 w-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-900">Conseils du chef</h4>
          </div>
          <ul className="space-y-2">
            {parsedResponse.tips.map((tip, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-yellow-500 font-bold mt-1">💡</span>
                <span className="text-yellow-800 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback for unparsed content */}
      {!parsedResponse.ingredients.length && !parsedResponse.instructions.length && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="whitespace-pre-wrap text-purple-800 leading-relaxed">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResponseFormatter;