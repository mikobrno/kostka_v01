import React, { useState } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { 
  Bold, 
  Italic, 
  Underline,
  List,
  ListOrdered,
  Quote,
  Save
} from 'lucide-react';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSave?: () => void;
}

export const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  onSave
}) => {
  const [editorState, setEditorState] = useState(() => {
    try {
      const contentState = value 
        ? convertFromRaw(JSON.parse(value))
        : EditorState.createEmpty().getCurrentContent();
      return EditorState.createWithContent(contentState);
    } catch {
      return EditorState.createEmpty();
    }
  });

  const handleEditorChange = (newState: EditorState) => {
    setEditorState(newState);
    const contentState = newState.getCurrentContent();
    const raw = convertToRaw(contentState);
    onChange(JSON.stringify(raw));
  };

  const handleKeyCommand = (command: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleEditorChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleStyle = (style: string, type: 'inline' | 'block' = 'inline') => {
    const newState = type === 'inline'
      ? RichUtils.toggleInlineStyle(editorState, style)
      : RichUtils.toggleBlockType(editorState, style);
    handleEditorChange(newState);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => toggleStyle('BOLD')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Tučné (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button 
          onClick={() => toggleStyle('ITALIC')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Kurzíva (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button 
          onClick={() => toggleStyle('UNDERLINE')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Podtržené (Ctrl+U)"
        >
          <Underline size={16} />
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <button 
          onClick={() => toggleStyle('unordered-list-item', 'block')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Odrážky"
        >
          <List size={16} />
        </button>
        <button 
          onClick={() => toggleStyle('ordered-list-item', 'block')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Číslování"
        >
          <ListOrdered size={16} />
        </button>
        <button 
          onClick={() => toggleStyle('blockquote', 'block')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Citace"
        >
          <Quote size={16} />
        </button>
        {onSave && (
          <>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            <button 
              onClick={onSave}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600"
              title="Uložit (Ctrl+S)"
            >
              <Save size={16} />
            </button>
          </>
        )}
      </div>
      <div className="p-4">
        <Editor
          editorState={editorState}
          onChange={handleEditorChange}
          handleKeyCommand={handleKeyCommand}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
