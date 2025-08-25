import React, { useState } from 'react';
import { DynamicSection as DynamicSectionType, DynamicSectionContent } from '../../services/dynamicSectionService';
import { FileStorageService } from '../../services/fileStorageService';
import InlineEditableCopy from '../InlineEditableCopy';
import CopyIconButton from '../CopyIconButton';
import { 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  Link as LinkIcon, 
  FileText, 
  Upload, 
  ExternalLink,
  Calculator,
  CheckSquare,
  Square

} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { FormattedNumberInput } from '../FormattedNumberInput';
import { formatNumber } from '../../utils/formatHelpers';
import { NotesEditor } from '../NotesEditor';

interface DynamicSectionProps {
  section: DynamicSectionType;
  onUpdate: (sectionId: string, updates: { section_name?: string; content?: DynamicSectionContent }) => Promise<void>;
  onDelete: (sectionId: string) => Promise<void>;
  toast?: ReturnType<typeof useToast>;
  hideHeader?: boolean; // New prop to hide the section header
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({
  section,
  onUpdate,
  onDelete,
  toast,
  hideHeader = false
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [sectionName, setSectionName] = useState(section.section_name);
  const [content, setContent] = useState<DynamicSectionContent>(section.content);
  const [isUploading, setIsUploading] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showLinkDeleteConfirm, setShowLinkDeleteConfirm] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const tasks = content.tasks || [];

  const updateTasks = async (newTasks: typeof tasks) => {
    await updateContent({ ...content, tasks: newTasks });
  };

  const addTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const newTasks = [...tasks, { id: `task-${Date.now()}`, title, done: false, createdAt: new Date().toISOString() }];
    setNewTaskTitle('');
    await updateTasks(newTasks);
  };

  const toggleTask = async (id: string) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined } : t);
    await updateTasks(newTasks);
  };

  const deleteTask = async (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    await updateTasks(newTasks);
  };

  const updateContent = async (newContent: DynamicSectionContent) => {
    setContent(newContent);
    await onUpdate(section.id, { content: newContent });
  };

  const handleSaveName = async () => {
    if (sectionName.trim() && sectionName !== section.section_name) {
      await onUpdate(section.id, { section_name: sectionName.trim() });
      toast?.showSuccess('Název sekce uložen', 'Název byl úspěšně aktualizován');
    }
    setIsEditingName(false);
  };

  const handleDeleteSection = async () => {
    if (window.confirm(`Opravdu chcete smazat sekci "${section.section_name}"?`)) {
      await onDelete(section.id);
      toast?.showSuccess('Sekce smazána', 'Sekce byla úspěšně odstraněna');
    }
  };

  // Notes handlers
  const handleNotesSave = async () => {
    await updateContent(content);
    setIsEditingNotes(false);
    toast?.showSuccess('Poznámky uloženy', 'Poznámky byly úspěšně aktualizovány');
  };

  // updateNotes removed (unused)

  const addLink = async () => {
    const newLink = {
      id: `link-${Date.now()}`,
      url: '',
      title: ''
    };
    const newContent = {
      ...content,
      links: [...(content.links || []), newLink]
    };
    await updateContent(newContent);
  };

  const updateLink = async (linkId: string, field: 'url' | 'title', value: string) => {
    const newContent = {
      ...content,
      links: (content.links || []).map(link =>
        link.id === linkId ? { ...link, [field]: value } : link
      )
    };
    await updateContent(newContent);
  };

  const removeLink = async (linkId: string) => {
    setShowLinkDeleteConfirm(null);
    const newContent = {
      ...content,
      links: (content.links || []).filter(link => link.id !== linkId)
    };
    await updateContent(newContent);
    toast?.showSuccess('Odkaz smazán', 'Odkaz byl úspěšně odstraněn');
  };

  const handleLinkDelete = (linkId: string) => {
    setShowLinkDeleteConfirm(linkId);
  };

  const confirmLinkDelete = async (linkId: string) => {
    await removeLink(linkId);
  };

  const cancelLinkDelete = () => {
    setShowLinkDeleteConfirm(null);
  };

  // Basic Parameters handlers
  const updateBasicParameter = async (field: string, value: string | number) => {
    const newContent = {
      ...content,
      basicParameters: {
        ...content.basicParameters,
        [field]: value
      }
    };
    await updateContent(newContent);
  };

  // File handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target) return;
    const files = event.target.files;
    await uploadFiles(files);
    event.target.value = ''; // Reset the input
  };

  // Enhanced file upload function to handle both input and drag-drop
  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Validate each file before upload
    for (const file of files) {
      const validation = FileStorageService.validateFile(file);
      if (!validation.isValid) {
        toast?.showError('Neplatný soubor', `${file.name}: ${validation.error}`);
        return;
      }
    }
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file =>
        FileStorageService.uploadFile(file, section.client_id, section.id)
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      
      const newContent = {
        ...content,
        files: [...(content.files || []), ...uploadedFiles]
      };
      await updateContent(newContent);
      
      toast?.showSuccess('Soubory nahrány', `Úspěšně nahráno ${uploadedFiles.length} souborů`);
  } catch (error) {
      console.error('File upload error:', error);
      const err = error as Error;
      toast?.showError('Chyba při nahrávání', err.message || 'Neznámá chyba');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    await uploadFiles(droppedFiles);
  };

  // Enhanced file deletion with confirmation
  const handleFileDelete = (fileId: string) => {
    setShowDeleteConfirm(fileId);
  };

  const confirmFileDelete = async (fileId: string) => {
    await removeFile(fileId);
    setShowDeleteConfirm(null);
  };

  const cancelFileDelete = () => {
    setShowDeleteConfirm(null);
  };

  const renameFile = async (fileId: string, newName: string) => {
    const newContent = {
      ...content,
      files: (content.files || []).map(file =>
        file.id === fileId ? { ...file, originalName: newName } : file
      )
    };
    await updateContent(newContent);
  };

  const removeFile = async (fileId: string) => {
    const fileToRemove = (content.files || []).find(f => f.id === fileId);
    if (fileToRemove) {
      try {
        await FileStorageService.deleteFile(fileToRemove.path);
      } catch (error) {
        console.error('Error deleting file from storage:', error);
      }
    }

    const newContent = {
      ...content,
      files: (content.files || []).filter(file => file.id !== fileId)
    };
    await updateContent(newContent);
    toast?.showSuccess('Soubor smazán', 'Soubor byl úspěšně odstraněn');
  };

  /* 
   * TODO: Add general fields functionality
   * - addGeneralField
   * - updateGeneralField
   * - removeGeneralField
   */

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      {/* Section Header - only show if not hidden */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                  placeholder="Název sekce"
                  title="Název sekce"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setSectionName(section.section_name);
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                  title="Uložit změny"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSectionName(section.section_name);
                    setIsEditingName(false);
                  }}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Zrušit úpravy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{section.section_name}</h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Upravit název"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleDeleteSection}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Smazat sekci"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* File Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Smazat soubor
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Opravdu chcete smazat tento soubor? Tato akce je nevratná.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={cancelFileDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => confirmFileDelete(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Deletion Confirmation Modal */}
      {showLinkDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <LinkIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Smazat odkaz
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Opravdu chcete smazat tento odkaz? Tato akce je nevratná.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={cancelLinkDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Ne, zrušit
                </button>
                <button
                  onClick={() => confirmLinkDelete(showLinkDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Ano, smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Stack Content */}
      <div className="space-y-6">
        {/* 1. Základní Parametry (Basic Parameters) Section */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Základní Parametry</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Účel financování
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={content.basicParameters?.financingPurpose || ''}
                  onChange={(e) => updateBasicParameter('financingPurpose', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Koupě nemovitosti, refinancování..."
                  title="Účel financování"
                  aria-label="Účel financování"
                />
                <InlineEditableCopy value={content.basicParameters?.financingPurpose || ''} onSave={(v) => updateBasicParameter('financingPurpose', v)} />
              </div>
            </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Požadovaná výše úvěru (Kč)
              </label>
              <div className="flex">
                <label className="sr-only">Požadovaná výše úvěru
                  <FormattedNumberInput
                    value={content.basicParameters?.requestedLoanAmount || ''}
                    onChange={(value) => updateBasicParameter('requestedLoanAmount', parseFloat(value) || 0)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="1 500 000"
                  />
                </label>
                <div className="flex items-center">
                  <span className="mr-2">{content.basicParameters?.requestedLoanAmount ? formatNumber(content.basicParameters.requestedLoanAmount) : ''}</span>
                  <CopyIconButton value={content.basicParameters?.requestedLoanAmount ? formatNumber(content.basicParameters.requestedLoanAmount) : ''} toast={toast} />
                </div>
              </div>
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hodnota nemovitosti (Kč)
              </label>
              <div className="flex">
                <label className="sr-only">Hodnota nemovitosti
                  <FormattedNumberInput
                    value={content.basicParameters?.propertyValue || ''}
                    onChange={(value) => updateBasicParameter('propertyValue', parseFloat(value) || 0)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="2 000 000"
                  />
                </label>
                <div className="flex items-center">
                  <span className="mr-2">{content.basicParameters?.propertyValue ? formatNumber(content.basicParameters.propertyValue) : ''}</span>
                  <CopyIconButton value={content.basicParameters?.propertyValue ? formatNumber(content.basicParameters.propertyValue) : ''} toast={toast} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vlastní prostředky (Kč)
              </label>
              <div className="flex">
                <label className="sr-only">Vlastní prostředky
                  <FormattedNumberInput
                    value={content.basicParameters?.vlastniProstredky || ''}
                    onChange={(value) => updateBasicParameter('vlastniProstredky', parseFloat(value) || 0)}
                    className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="500 000"
                  />
                </label>
                <div className="flex items-center">
                  <span className="mr-2">{content.basicParameters?.vlastniProstredky ? String(formatNumber(content.basicParameters.vlastniProstredky)) : ''}</span>
                  <CopyIconButton value={content.basicParameters?.vlastniProstredky ? String(formatNumber(content.basicParameters.vlastniProstredky)) : ''} toast={toast} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Splatnost v letech
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={content.basicParameters?.maturityYears || ''}
                  onChange={(e) => updateBasicParameter('maturityYears', parseInt(e.target.value) || 0)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="30"
                  title="Splatnost v letech"
                  aria-label="Splatnost v letech"
                  min="1"
                  max="50"
                />
                <div className="flex items-center">
                  <span className="mr-2">{String(content.basicParameters?.maturityYears || '')}</span>
                  <CopyIconButton value={String(content.basicParameters?.maturityYears || '')} toast={toast} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Délka fixace preferovaná (roky)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={content.basicParameters?.preferredFixationYears || ''}
                  onChange={(e) => updateBasicParameter('preferredFixationYears', parseInt(e.target.value) || 0)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="5"
                  title="Délka fixace preferovaná"
                  aria-label="Délka fixace preferovaná"
                  min="1"
                  max="30"
                />
                <div className="flex items-center">
                  <span className="mr-2">{String(content.basicParameters?.preferredFixationYears || '')}</span>
                  <CopyIconButton value={String(content.basicParameters?.preferredFixationYears || '')} toast={toast} />
                </div>
              </div>
            </div>
          </div>

          {/* LTV Calculation */}
          {content.basicParameters?.requestedLoanAmount && content.basicParameters?.propertyValue && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Výpočet LTV</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Výše úvěru:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{content.basicParameters.requestedLoanAmount.toLocaleString('cs-CZ')} Kč</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Hodnota nemovitosti:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{content.basicParameters.propertyValue.toLocaleString('cs-CZ')} Kč</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">LTV poměr:</span>
                  <div className="font-bold text-lg text-blue-800 dark:text-blue-200">
                    {((content.basicParameters.requestedLoanAmount / content.basicParameters.propertyValue) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Poznámky (Notes) Section */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Poznámky</h3>
            </div>
            <button
              onClick={() => isEditingNotes ? handleNotesSave() : setIsEditingNotes(true)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isEditingNotes 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
              }`}
              title={isEditingNotes ? 'Uložit změny v poznámkách' : 'Upravit poznámky'}
            >
              {isEditingNotes ? (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Uložit
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-1.5" />
                  Upravit
                </>
              )}
            </button>
          </div>
          
          <div className="prose prose-sm max-w-none dark:prose-invert border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {isEditingNotes ? (
              <NotesEditor
                value={content.notes || ''}
                onChange={(value: string) => updateContent({ ...content, notes: value })}
                placeholder="Zadejte poznámky k této sekci..."
                className="min-h-[200px]"
              />
            ) : content.notes ? (
              <div 
                className="p-4 min-h-[100px]"
                dangerouslySetInnerHTML={{ __html: content.notes }}
              />
            ) : (
              <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                Klikněte na tlačítko "Upravit" pro přidání poznámek...
              </div>
            )}
          </div>
        </div>

        {/* 2b. Úkoly (Tasks) Section */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Seznam úkolů</h3>
            </div>
            {tasks.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)}% dokončeno
              </div>
            )}
          </div>
          <div className="flex mb-4 space-x-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
              placeholder="Nový úkol..."
              title="Nový úkol"
              aria-label="Nový úkol"
              className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
            >
              <Plus className="w-4 h-4 mr-1" />
              Přidat
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">Žádné úkoly. Přidejte první...</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
              {tasks.map(task => (
                <li key={task.id} className="flex items-center py-2 group">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mr-3 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    title={task.done ? 'Odznačit' : 'Dokončit'}
                  >
                    {task.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`flex-1 text-sm cursor-pointer select-none ${task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.done && task.doneAt && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden md:inline" title={new Date(task.doneAt).toLocaleString('cs-CZ')}>✓ {new Date(task.doneAt).toLocaleDateString('cs-CZ')}</span>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Smazat úkol"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {tasks.length > 0 && (
            <div className="mt-4 grid grid-flow-col auto-cols-fr gap-px rounded-full bg-gray-300 dark:bg-gray-600 p-px" aria-label="Progress">
              {tasks.map(t => (
                <span key={t.id} className={`h-1 rounded-full ${t.done ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-white dark:bg-gray-700'}`} />
              ))}
            </div>
          )}
        </div>

        {/* 3. Odkazy (Links) Section */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2 mb-4">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Odkazy</h3>
          </div>
          
          <div>
            {/* Links */}
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Webové odkazy
              </label>
              <button
                onClick={addLink}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                <Plus className="w-3 h-3 mr-1" />
                Přidat odkaz
              </button>
            </div>

            <div className="space-y-3">
              {(content.links || []).map((link) => (
                <div key={link.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  {editingLinkId === link.id ? (
                    // Editing mode
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            URL
                          </label>
                          <div className="flex">
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                              className="flex-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder="https://example.com"
                              title={`URL odkazu ${link.title || ''}`}
                              aria-label={`URL odkazu ${link.title || ''}`}
                            />
                            <div className="flex items-center">
                              <span className="truncate mr-2">{link.url}</span>
                              <CopyIconButton value={link.url} toast={toast} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Název (volitelný)
                          </label>
                          <input
                            type="text"
                            value={link.title || ''}
                            onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                            className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Popis odkazu"
                            title={`Popis odkazu ${link.url || ''}`}
                            aria-label={`Popis odkazu ${link.url || ''}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={() => setEditingLinkId(null)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Uložit
                        </button>
                        <button
                          onClick={() => setEditingLinkId(null)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Zrušit
                        </button>
                      </div>
                    </>
                  ) : (
                    // Display mode - only show link title/name, hide URL
                    <div className="flex items-center justify-between">
                      {link.url && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          {link.title || 'Odkaz bez názvu'}
                        </a>
                      )}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingLinkId(link.id)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Upravit odkaz"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleLinkDelete(link.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Smazat odkaz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {(!content.links || content.links.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p>Žádné odkazy nejsou přidány</p>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* 4. Soubory (Files) Section */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2 mb-4">
            <Upload className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Soubory</h3>
          </div>
          
          <div className="space-y-6">
            {/* File List - Now displayed ABOVE upload area */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Nahrané soubory ({(content.files || []).length})
              </h4>
              <div className="space-y-2">
                {(content.files || []).map((file) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    onRename={(newName) => renameFile(file.id, newName)}
                    onDelete={() => handleFileDelete(file.id)}
                  />
                ))}

                {(!content.files || content.files.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                    <p>Žádné soubory nejsou nahrány</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Area - Now positioned at the BOTTOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nahrát soubory
              </label>
              <div
                className={`flex items-center justify-center w-full transition-all duration-200 border-2 border-dashed rounded-lg ${
                  isDragOver 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400' 
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-8 h-8 mb-4 transition-colors ${
                      isDragOver ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">
                        {isDragOver ? 'Pusťte soubory zde' : 'Klikněte pro nahrání'}
                      </span>
                      {!isDragOver && ' nebo přetáhněte soubory'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Maximální velikost: 5MB na soubor
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    aria-label="Nahrát soubory"
                  />
                </label>
              </div>
              {isUploading && (
                <div className="mt-2 text-sm text-purple-600 dark:text-purple-400 flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
                  Nahrávám soubory...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// File List Item Component with inline editing
interface FileListItemProps {
  file: {
    id: string;
    name: string;
    originalName: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
  };
  onRename: (newName: string) => void;
  onDelete: () => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ file, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.originalName);
  const [isValidName, setIsValidName] = useState(true);

  // Validate filename
  const validateFilename = (name: string): boolean => {
    if (!name.trim()) return false;
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(name);
  };

  const handleSave = () => {
    const trimmedName = editName.trim();
    if (!validateFilename(trimmedName)) {
      setIsValidName(false);
      return;
    }
    
    onRename(trimmedName);
    setIsEditing(false);
    setIsValidName(true);
  };

  const handleCancel = () => {
    setEditName(file.originalName);
    setIsEditing(false);
    setIsValidName(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleNameChange = (value: string) => {
    setEditName(value);
    setIsValidName(validateFilename(value));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between">
      <div className="flex items-center space-x-3 flex-1">
        <span className="text-lg">
          {FileStorageService.getFileIcon(file.type)}
        </span>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                    className={`text-sm font-medium w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  isValidName 
                    ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500' 
                    : 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                }`}
                    title={`Přejmenovat soubor ${file.originalName}`}
                    aria-label={`Přejmenovat soubor ${file.originalName}`}
                autoFocus
              />
              {!isValidName && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Neplatný název souboru. Nesmí obsahovat: &lt; &gt; : " / \ | ? *
                </p>
              )}
            </div>
          ) : (
            <p 
              className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Klikněte pro úpravu názvu"
            >
              {file.originalName}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {FileStorageService.formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('cs-CZ')}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          title="Otevřít soubor"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="Přejmenovat"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          title="Smazat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};