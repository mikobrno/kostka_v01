import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const NotesField: React.FC<NotesFieldProps> = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState(value);

  const handleEditorChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  return (
    <div>
      <ReactQuill
        value={editorValue}
        onChange={handleEditorChange}
        theme="snow"
        modules={{
          toolbar: [
            ['bold', 'underline'], // Formátování: tučné písmo, podtržení
            [{ list: 'bullet' }], // Odrážky
            ['clean'], // Vymazání formátování
          ],
        }}
      />
    </div>
  );
};

interface NotesDisplayProps {
  value: string;
}

const NotesDisplay: React.FC<NotesDisplayProps> = ({ value }) => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: value }}
      className="prose dark:prose-dark"
    />
  );
};

export default NotesField;
export { NotesDisplay };