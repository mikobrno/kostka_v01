

import React, { useState, useEffect } from 'react';
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
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  const modules = {
    toolbar: [
      ['bold', 'underline'], // Tučné písmo a podtržení
      [{ 'list': 'bullet' }], // Odrážky
      ['clean'] // Vymazání formátování
    ]
  };

  const formats = [
    'bold', 'underline', 'list', 'bullet'
  ];

  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <span className="w-5 h-5 text-blue-600">📝</span>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Poznámky</h3>
      </div>
      <div className="quill-editor-wrapper">
        <ReactQuill
          value={editorValue}
          onChange={handleEditorChange}
          theme="snow"
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          className="notes-quill-editor"
        />
      </div>
    </div>
  );
};
