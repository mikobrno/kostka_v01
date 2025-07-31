import React, { useState, useEffect } from 'react';
import { NotebookPen, Bold, Italic, Underline } from 'lucide-react';
// @ts-expect-error - draft-js je CommonJS modul
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw, DraftHandleValue } from 'draft-js';
import 'draft-js/dist/Draft.css';

interface NotesEditorProps {
  value?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({ value, onChange, placeholder, className }) => {
  const [editorState, setEditorState] = useState(
    () => {
      if (value) {
        try {
          const contentState = convertFromRaw(JSON.parse(value));
          return EditorState.createWithContent(contentState);
        } catch {
          return EditorState.createEmpty();
        }
      }
      return EditorState.createEmpty();
    }
  );

  useEffect(() => {
    const contentState = editorState.getCurrentContent();
    const raw = convertToRaw(contentState);
    onChange(JSON.stringify(raw));
  }, [editorState, onChange]);

  const handleKeyCommand = (command: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled' as const;
    }
    return 'not-handled' as const;
  };

  const toggleInlineStyle = (style: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 ${className || ''}`}>
      <div className="flex items-center space-x-2 mb-4">
        <NotebookPen className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Poznámky</h3>
      </div>
      
      <div className="mb-2 flex gap-2">
        <button
          onClick={() => toggleInlineStyle('BOLD')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Tučně"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleInlineStyle('ITALIC')} 
          className="p-2 hover:bg-gray-100 rounded"
          title="Kurzíva"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleInlineStyle('UNDERLINE')}
          className="p-2 hover:bg-gray-100 rounded" 
          title="Podtržení"
        >
          <Underline className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-4 min-h-[200px]">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          placeholder={placeholder || "Začněte psát poznámky..."}
        />
      </div>
    </div>
  );
};
