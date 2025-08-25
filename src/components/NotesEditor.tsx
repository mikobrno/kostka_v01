

import React from 'react';

interface NotesEditorProps {
  value?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Začněte psát poznámky...',
  className = '',
}) => {
  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <span className="w-5 h-5 text-blue-600">📝</span>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Poznámky</h3>
      </div>
      <textarea
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full min-h-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-3 resize-vertical"
      />
    </div>
  );
};
