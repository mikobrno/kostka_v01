

import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
      <ReactQuill
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        theme="snow"
        modules={{
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'bullet' }, { list: 'ordered' }],
            ['clean'],
          ],
        }}
        className="min-h-[200px] bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
      />
    </div>
  );
};
