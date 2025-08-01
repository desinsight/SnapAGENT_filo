import React from 'react';
import { 
  LightBulbIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AISuggestionChips = ({ suggestions, onExecute }) => {
  const getIcon = (action) => {
    switch (action) {
      case 'organize':
        return FolderIcon;
      case 'rename':
        return ArrowPathIcon;
      case 'move':
        return FolderIcon;
      case 'delete':
        return TrashIcon;
      case 'backup':
        return DocumentDuplicateIcon;
      default:
        return LightBulbIcon;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'organize':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'rename':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'move':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'delete':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'backup':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center text-xs text-gray-500 mb-2">
        <LightBulbIcon className="w-4 h-4 mr-1" />
        AI 제안
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const Icon = getIcon(suggestion.action);
          const colorClass = getActionColor(suggestion.action);
          
          return (
            <button
              key={suggestion.id}
              onClick={() => onExecute(suggestion)}
              className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${colorClass}`}
              title={suggestion.description}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {suggestion.type}
              {suggestion.confidence && (
                <span className="ml-2 opacity-60">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AISuggestionChips;