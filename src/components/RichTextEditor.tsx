import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Type, 
  Plus, 
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  showToolbar?: boolean;
  autoSave?: boolean;
  onSave?: (content: string) => void;
  label?: string;
}

interface FormatCommand {
  command: string;
  value?: string;
  icon: React.ComponentType<any>;
  label: string;
  shortcut?: string;
}

/**
 * Rich Text Editor Component with Comprehensive Formatting Features
 * 
 * This component provides a full-featured rich text editing experience with:
 * - Bold, italic, underline, strikethrough formatting
 * - Font size adjustment
 * - Text alignment options
 * - Lists (ordered and unordered)
 * - Blockquotes
 * - Undo/Redo functionality
 * - Keyboard shortcuts
 * - Auto-save capability
 * - Preview mode
 * - Accessibility support
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Začněte psát své poznámky...",
  className = "",
  minHeight = 200,
  maxHeight = 600,
  showToolbar = true,
  autoSave = false,
  onSave,
  label
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(14);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Format commands configuration
  const formatCommands: FormatCommand[] = [
    { command: 'bold', icon: Bold, label: 'Tučné', shortcut: 'Ctrl+B' },
    { command: 'underline', icon: Underline, label: 'Podtržené', shortcut: 'Ctrl+U' },
    { command: 'strikeThrough', icon: Strikethrough, label: 'Přeškrtnuté', shortcut: 'Ctrl+Shift+X' },
  ];

  const alignmentCommands: FormatCommand[] = [
    { command: 'justifyLeft', icon: AlignLeft, label: 'Zarovnat vlevo' },
    { command: 'justifyCenter', icon: AlignCenter, label: 'Zarovnat na střed' },
    { command: 'justifyRight', icon: AlignRight, label: 'Zarovnat vpravo' },
  ];

  const listCommands: FormatCommand[] = [
    { command: 'insertUnorderedList', icon: List, label: 'Odrážky' },
    { command: 'insertOrderedList', icon: ListOrdered, label: 'Číslování' },
    { command: 'formatBlock', value: 'blockquote', icon: Quote, label: 'Citace' },
  ];

  /**
   * Executes formatting commands on selected text
   */
  const executeCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    document.execCommand(command, false, value);
    
    // Update content and mark as changed
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);
    setHasUnsavedChanges(true);
  }, [onChange]);

  /**
   * Handles font size changes
   */
  const changeFontSize = useCallback((increase: boolean) => {
    const newSize = increase 
      ? Math.min(currentFontSize + 2, 24) 
      : Math.max(currentFontSize - 2, 10);
    
    setCurrentFontSize(newSize);
    
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${newSize}px`;
    }
  }, [currentFontSize]);

  /**
   * Handles keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            executeCommand('redo');
          } else {
            e.preventDefault();
            executeCommand('undo');
          }
          break;
      }
      
      if (e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        executeCommand('strikeThrough');
      }
    }
  }, [executeCommand]);

  /**
   * Handles content changes
   */
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);
    setHasUnsavedChanges(true);
  }, [onChange]);

  /**
   * Handles save functionality
   */
  const handleSave = useCallback(() => {
    if (onSave && editorRef.current) {
      onSave(editorRef.current.innerHTML);
      setHasUnsavedChanges(false);
    }
  }, [onSave]);

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    if (autoSave && hasUnsavedChanges) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [autoSave, hasUnsavedChanges, handleSave]);

  /**
   * Initialize editor content
   */
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  /**
   * Set initial font size
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${currentFontSize}px`;
    }
  }, [currentFontSize]);

  /**
   * Toolbar Button Component
   */
  const ToolbarButton: React.FC<{
    command: FormatCommand;
    isActive?: boolean;
    onClick: () => void;
  }> = ({ command, isActive, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-md transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
      title={`${command.label}${command.shortcut ? ` (${command.shortcut})` : ''}`}
      aria-label={command.label}
    >
      <command.icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="rich-text-editor-container space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {/* Text Formatting */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              {formatCommands.map((cmd) => (
                <ToolbarButton
                  key={cmd.command}
                  command={cmd}
                  onClick={() => executeCommand(cmd.command, cmd.value)}
                />
              ))}
            </div>

            {/* Font Size */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                type="button"
                onClick={() => changeFontSize(false)}
                className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Zmenšit písmo"
                disabled={currentFontSize <= 10}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[3rem] text-center">
                {currentFontSize}px
              </span>
              <button
                type="button"
                onClick={() => changeFontSize(true)}
                className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Zvětšit písmo"
                disabled={currentFontSize >= 24}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              {alignmentCommands.map((cmd) => (
                <ToolbarButton
                  key={cmd.command}
                  command={cmd}
                  onClick={() => executeCommand(cmd.command, cmd.value)}
                />
              ))}
            </div>

            {/* Lists and Quotes */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              {listCommands.map((cmd) => (
                <ToolbarButton
                  key={cmd.command}
                  command={cmd}
                  onClick={() => executeCommand(cmd.command, cmd.value)}
                />
              ))}
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <ToolbarButton
                command={{ command: 'undo', icon: Undo, label: 'Zpět', shortcut: 'Ctrl+Z' }}
                onClick={() => executeCommand('undo')}
              />
              <ToolbarButton
                command={{ command: 'redo', icon: Redo, label: 'Znovu', shortcut: 'Ctrl+Shift+Z' }}
                onClick={() => executeCommand('redo')}
              />
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`p-2 rounded-md transition-colors ${
                  isPreviewMode 
                    ? 'bg-green-600 dark:bg-green-700 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={isPreviewMode ? 'Upravit' : 'Náhled'}
              >
                {isPreviewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Save Button */}
            {onSave && (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className={`p-2 rounded-md transition-colors ${
                    hasUnsavedChanges
                      ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title="Uložit (Ctrl+S)"
                >
                  <Save className="w-4 h-4" />
                </button>
                {autoSave && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Auto-save: {hasUnsavedChanges ? 'Pending...' : 'Saved'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <details className="text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                Klávesové zkratky
              </summary>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">Ctrl+B</kbd> Tučné</div>
                <div><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">Ctrl+U</kbd> Podtržené</div>
                <div><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">Ctrl+S</kbd> Uložit</div>
                <div><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">Ctrl+Z</kbd> Zpět</div>
                <div><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">Ctrl+Shift+Z</kbd> Znovu</div>
                <div><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1 rounded">Ctrl+Shift+X</kbd> Přeškrtnuté</div>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="relative">
        {isPreviewMode ? (
          /* Preview Mode */
          <div 
            className={`w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 ${className}`}
            style={{ 
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
              overflow: 'auto'
            }}
          >
            <div 
              dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-500 dark:text-gray-400 italic">Žádný obsah k zobrazení</p>' }}
              className="prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-gray-100"
            />
          </div>
        ) : (
          /* Edit Mode */
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={`
              w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              prose prose-sm max-w-none
              ${className}
            `}
            style={{ 
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
              overflow: 'auto',
              fontSize: `${currentFontSize}px`
            }}
            data-placeholder={placeholder}
            role="textbox"
            aria-label={label || "Rich text editor"}
            aria-multiline="true"
            suppressContentEditableWarning={true}
          />
        )}

        {/* Placeholder styling */}
        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: ${document.documentElement.classList.contains('dark') ? '#6B7280' : '#9CA3AF'};
            font-style: italic;
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-4">
          <span>Velikost písma: {currentFontSize}px</span>
          <span>Režim: {isPreviewMode ? 'Náhled' : 'Úpravy'}</span>
          {hasUnsavedChanges && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">● Neuložené změny</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Počet znaků: {value.replace(/<[^>]*>/g, '').length}</span>
          {autoSave && (
            <span className="text-green-600 dark:text-green-400">Auto-save zapnuto</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;