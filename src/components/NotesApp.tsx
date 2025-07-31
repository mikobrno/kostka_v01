import React, { useState, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { RichTextEditor } from './RichTextEditor';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Save, 
  Star, 
  StarOff,
  Calendar,
  Tag,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List as ListIcon
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  plainTextContent: string; // For search
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isFavorite: boolean;
  category?: string;
}

interface NotesAppProps {
  clientId?: string; // Optional: associate notes with specific client
  onClose?: () => void;
}

/**
 * Comprehensive Notes Application with Rich Text Editing
 * 
 * Features:
 * - Rich text editing with formatting toolbar
 * - Note management (create, edit, delete, search)
 * - Categorization and tagging system
 * - Favorites functionality
 * - Search and filtering
 * - Grid and list view modes
 * - Auto-save functionality
 * - Responsive design
 */
export const NotesApp: React.FC<NotesAppProps> = ({ clientId, onClose }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newNoteTitle, setNewNoteTitle] = useState('');

  const categories = [
    'all',
    'personal',
    'work',
    'ideas',
    'tasks',
    'meetings',
    'research'
  ];

  const categoryLabels = {
    all: 'Všechny poznámky',
    personal: 'Osobní',
    work: 'Práce',
    ideas: 'Nápady',
    tasks: 'Úkoly',
    meetings: 'Schůzky',
    research: 'Výzkum'
  };

  /**
   * Load notes from localStorage (in production, this would be from Supabase)
   */
  useEffect(() => {
    const storageKey = clientId ? `notes-client-${clientId}` : 'notes-general';
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    }
  }, [clientId]);

  /**
   * Save notes to localStorage
   */
  const saveNotes = (updatedNotes: Note[]) => {
    const storageKey = clientId ? `notes-client-${clientId}` : 'notes-general';
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  /**
   * Create new note
   */
  const createNote = () => {
    if (!newNoteTitle.trim()) {
      alert('Zadejte název poznámky');
      return;
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: '',
      plainTextContent: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      isFavorite: false,
      category: 'personal'
    };

    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setSelectedNote(newNote);
    setIsCreating(false);
    setNewNoteTitle('');
  };

  /**
   * Update note content
   */
  const updateNote = (noteId: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { 
            ...note, 
            ...updates, 
            updatedAt: new Date().toISOString(),
            plainTextContent: updates.content ? updates.content.replace(/<[^>]*>/g, '') : note.plainTextContent
          }
        : note
    );
    saveNotes(updatedNotes);
    
    // Update selected note if it's the one being edited
    if (selectedNote?.id === noteId) {
      setSelectedNote(updatedNotes.find(n => n.id === noteId) || null);
    }
  };

  /**
   * Delete note
   */
  const deleteNote = (noteId: string) => {
    if (window.confirm('Opravdu chcete smazat tuto poznámku?')) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      saveNotes(updatedNotes);
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  /**
   * Toggle favorite status
   */
  const toggleFavorite = (noteId: string) => {
    updateNote(noteId, { 
      isFavorite: !notes.find(n => n.id === noteId)?.isFavorite 
    });
  };

  /**
   * Filter and sort notes
   */
  const filteredNotes = notes
    .filter(note => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!note.title.toLowerCase().includes(searchLower) && 
            !note.plainTextContent.toLowerCase().includes(searchLower) &&
            !note.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      
      // Category filter
      if (selectedCategory !== 'all' && note.category !== selectedCategory) {
        return false;
      }
      
      // Favorites filter
      if (showFavoritesOnly && !note.isFavorite) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('cs-CZ', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  return (
    <div className="notes-app h-screen flex bg-gray-50">
      {/* Sidebar - Notes List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Poznámky</h1>
              {clientId && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  Klient
                </span>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                title="Zavřít"
              >
                ×
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Hledat v poznámkách..."
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-2 rounded-md transition-colors ${
                showFavoritesOnly 
                  ? 'bg-yellow-100 text-yellow-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Zobrazit pouze oblíbené"
            >
              <Star className="w-4 h-4" />
            </button>
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="updated-desc">Nejnovější</option>
                <option value="updated-asc">Nejstarší</option>
                <option value="title-asc">Název A-Z</option>
                <option value="title-desc">Název Z-A</option>
                <option value="created-desc">Vytvořeno (nejnovější)</option>
                <option value="created-asc">Vytvořeno (nejstarší)</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                title="Mřížka"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                title="Seznam"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* New Note Form */}
        {isCreating && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="space-y-3">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Název nové poznámky..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNote();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewNoteTitle('');
                  }
                }}
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={createNote}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Vytvořit
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewNoteTitle('');
                  }}
                  className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategory !== 'all' || showFavoritesOnly 
                  ? 'Žádné poznámky nenalezeny' 
                  : 'Žádné poznámky'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== 'all' || showFavoritesOnly
                  ? 'Zkuste upravit filtry nebo vyhledávání'
                  : 'Vytvořte svou první poznámku'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && !showFavoritesOnly && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vytvořit poznámku
                </button>
              )}
            </div>
          ) : (
            <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-2'}`}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSelected={selectedNote?.id === note.id}
                  viewMode={viewMode}
                  onSelect={() => setSelectedNote(note)}
                  onToggleFavorite={() => toggleFavorite(note.id)}
                  onDelete={() => deleteNote(note.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Note Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nová poznámka
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Note Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                  placeholder="Název poznámky..."
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleFavorite(selectedNote.id)}
                    className={`p-2 rounded-md transition-colors ${
                      selectedNote.isFavorite 
                        ? 'text-yellow-600 bg-yellow-100' 
                        : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                    }`}
                    title={selectedNote.isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
                  >
                    {selectedNote.isFavorite ? <Star className="w-5 h-5" /> : <StarOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteNote(selectedNote.id)}
                    className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Smazat poznámku"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Note Metadata */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Upraveno: {formatDate(selectedNote.updatedAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <select
                    value={selectedNote.category || 'personal'}
                    onChange={(e) => updateNote(selectedNote.id, { category: e.target.value })}
                    className="text-sm border-none bg-transparent focus:outline-none focus:ring-0"
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="flex-1 p-6 bg-white overflow-hidden">
              <RichTextEditor
                value={selectedNote.content}
                onChange={(content) => updateNote(selectedNote.id, { content })}
                placeholder="Začněte psát svou poznámku..."
                minHeight={200}
                maxHeight={400}
                showToolbar={true}
                autoSave={true}
                onSave={(content) => updateNote(selectedNote.id, { content })}
                label="Obsah poznámky"
              />
            </div>
          </>
        ) : (
          /* No Note Selected */
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Vyberte poznámku
              </h2>
              <p className="text-gray-500 mb-6">
                Klikněte na poznámku vlevo pro úpravy nebo vytvořte novou
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Vytvořit první poznámku
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Note Card Component
interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  viewMode,
  onSelect,
  onToggleFavorite,
  onDelete,
  formatDate
}) => {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onSelect}
        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'bg-blue-100 border-2 border-blue-300' 
            : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {note.title}
              </h3>
              {note.isFavorite && (
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate mt-1">
              {truncateText(note.plainTextContent, 60)}
            </p>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <span className="text-xs text-gray-400">
              {formatDate(note.updatedAt)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1 text-gray-400 hover:text-yellow-500"
            >
              {note.isFavorite ? <Star className="w-3 h-3" /> : <StarOff className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-100 border-2 border-blue-300 shadow-md' 
          : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {note.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`p-1 rounded transition-colors ${
            note.isFavorite 
              ? 'text-yellow-500 bg-yellow-100' 
              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
          }`}
        >
          {note.isFavorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
        </button>
      </div>
      
      <p className="text-xs text-gray-600 line-clamp-3 mb-3">
        {truncateText(note.plainTextContent, 120)}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{formatDate(note.updatedAt)}</span>
        <span className="bg-gray-100 px-2 py-1 rounded-full">
          {categoryLabels[note.category] || 'Osobní'}
        </span>
      </div>
    </div>
  );
};

export default NotesApp;