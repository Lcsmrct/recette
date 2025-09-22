import React, { useState, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Wand2, List, Hash } from 'lucide-react';

const SmartTextArea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = '',
  rows = 4,
  type = 'general', // 'ingredients', 'instructions', or 'general'
  ...props 
}) => {
  const [showFormatting, setShowFormatting] = useState(false);

  // Auto-format content based on type
  const autoFormat = (text) => {
    if (!text) return text;

    let formatted = text;

    if (type === 'ingredients') {
      // Auto-format ingredients list
      const lines = text.split('\n');
      formatted = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('•') && !trimmed.startsWith('*')) {
          return `- ${trimmed}`;
        }
        return line;
      }).join('\n');
    } else if (type === 'instructions') {
      // Auto-format instructions with numbers
      const lines = text.split('\n');
      let stepNumber = 1;
      formatted = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.match(/^\d+\./) && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
          return `${stepNumber++}. ${trimmed}`;
        } else if (trimmed.match(/^\d+\./)) {
          stepNumber = parseInt(trimmed.split('.')[0]) + 1;
        }
        return line;
      }).join('\n');
    }

    return formatted;
  };

  const handleFormat = (formatType) => {
    let newValue = value;
    
    switch (formatType) {
      case 'bullets':
        const bulletLines = value.split('\n').map(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('•') && !trimmed.startsWith('*')) {
            return `- ${trimmed}`;
          }
          return line;
        }).join('\n');
        newValue = bulletLines;
        break;
        
      case 'numbers':
        const numberedLines = value.split('\n');
        let stepNum = 1;
        newValue = numberedLines.map(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.match(/^\d+\./)) {
            return `${stepNum++}. ${trimmed}`;
          } else if (trimmed.match(/^\d+\./)) {
            stepNum = parseInt(trimmed.split('.')[0]) + 1;
          }
          return line;
        }).join('\n');
        break;
        
      case 'clean':
        newValue = value.split('\n').map(line => 
          line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
        ).filter(line => line).join('\n');
        break;
    }
    
    onChange({ target: { value: newValue } });
  };

  const handleKeyDown = (e) => {
    // Auto-formatting on Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = e.target;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastLine = textBeforeCursor.split('\n').pop();
      
      // Auto-continue lists
      if (type === 'ingredients' && lastLine.match(/^-\s/)) {
        e.preventDefault();
        const newValue = value.substring(0, cursorPosition) + '\n- ' + value.substring(cursorPosition);
        onChange({ target: { value: newValue } });
        
        // Set cursor position after the new bullet
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = cursorPosition + 3;
        }, 0);
      } else if (type === 'instructions') {
        const numberMatch = lastLine.match(/^(\d+)\.\s/);
        if (numberMatch) {
          e.preventDefault();
          const nextNumber = parseInt(numberMatch[1]) + 1;
          const newValue = value.substring(0, cursorPosition) + `\n${nextNumber}. ` + value.substring(cursorPosition);
          onChange({ target: { value: newValue } });
          
          // Set cursor position after the new number
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPosition + `\n${nextNumber}. `.length;
          }, 0);
        }
      }
    }
  };

  const getSuggestions = () => {
    if (type === 'ingredients') {
      return [
        "- 200g de farine",
        "- 3 œufs",
        "- 250ml de lait",
        "- 50g de beurre",
        "- 1 pincée de sel"
      ];
    } else if (type === 'instructions') {
      return [
        "1. Préchauffez le four à 180°C",
        "2. Dans un saladier, mélangez...",
        "3. Ajoutez progressivement...",
        "4. Versez la préparation dans...",
        "5. Enfournez pour 25 minutes"
      ];
    }
    return [];
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${className} transition-all duration-200 ${showFormatting ? 'border-purple-300 ring-2 ring-purple-200' : ''}`}
          rows={rows}
          {...props}
        />
        
        {/* Format Tools */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFormatting(!showFormatting)}
            className="h-6 w-6 p-0 hover:bg-purple-100"
          >
            <Wand2 className="h-3 w-3 text-purple-600" />
          </Button>
        </div>

        {showFormatting && (
          <div className="absolute top-10 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            <div className="flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('bullets')}
                className="text-xs px-2 py-1 hover:bg-orange-50"
                title="Formatter en liste à puces"
              >
                <List className="h-3 w-3 mr-1" />
                Puces
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('numbers')}
                className="text-xs px-2 py-1 hover:bg-blue-50"
                title="Formatter en liste numérotée"
              >
                <Hash className="h-3 w-3 mr-1" />
                Numéros
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('clean')}
                className="text-xs px-2 py-1 hover:bg-gray-50"
                title="Nettoyer le formatage"
              >
                Nettoyer
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      {type !== 'general' && !value && (
        <div className="text-xs text-gray-500">
          <p className="mb-1">💡 Suggestions:</p>
          <div className="grid grid-cols-1 gap-1">
            {getSuggestions().slice(0, 2).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange({ target: { value: value + (value ? '\n' : '') + suggestion } })}
                className="text-left p-1 hover:bg-gray-50 rounded text-gray-600 truncate"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-500">
        {type === 'ingredients' && (
          <p>💡 Appuyez sur Entrée pour ajouter automatiquement une puce</p>
        )}
        {type === 'instructions' && (
          <p>💡 Appuyez sur Entrée pour numéroter automatiquement les étapes</p>
        )}
      </div>
    </div>
  );
};

export default SmartTextArea;