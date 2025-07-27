import React, { useState } from 'react';
import { DynamicSection as DynamicSectionType, DynamicSectionContent } from '../../services/dynamicSectionService';
import { FileStorageService, UploadedFile } from '../../services/fileStorageService';
import { CopyButton } from '../CopyButton';
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
  Settings
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

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

  // Notes & Links handlers
  const updateNotes = async (notes: string) => {
    const newContent = { ...content, notes };
    await updateContent(newContent);
  };

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
    const newContent = {
      ...content,
      links: (content.links || []).filter(link => link.id !== linkId)
    };
    await updateContent(newContent);
  };

  // Basic Parameters handlers
  const updateBasicParameter = async (field: string, value: any) => {
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
    const files = event.target.files;
    await uploadFiles(files);
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
      toast?.showError('Chyba při nahrávání', error.message);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
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

  // General Fields handlers
  const addGeneralField = async () => {
    const newField = {
      id: `field-${Date.now()}`,
      label: '',
      value: ''
    };
    const newContent = {
      ...content,
      generalFields: [...(content.generalFields || []), newField]
    };
    await updateContent(newContent);
  };

  const updateGeneralField = async (fieldId: string, field: 'label' | 'value', value: string) => {
    const newContent = {
      ...content,
      generalFields: (content.generalFields || []).map(item =>
        item.id === fieldId ? { ...item, [field]: value } : item
      )
    };
    await updateContent(newContent);
  };

  const removeGeneralField = async (fieldId: string) => {
    const newContent = {
      ...content,
      generalFields: (content.generalFields || []).filter(item => item.id !== fieldId)
    };
    await updateContent(newContent);
  };

  return (
    <div className="bg-white rounded-lg shadow border p-6">
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
                  className="text-xl font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none"
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
                  className="text-green-600 hover:text-green-800"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSectionName(section.section_name);
                    setIsEditingName(false);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900">{section.section_name}</h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Upravit název"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleDeleteSection}
            className="text-red-600 hover:text-red-800"
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


      {/* Vertical Stack Content */}
      <div className="space-y-6">
        {/* 1. Poznámky (Notes) Section */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Poznámky</h3>
          </div>
          
          {/* Enhanced Notes with Dynamic Height */}
          <div>
            <textarea
              value={content.notes || ''}
              onChange={(e) => updateNotes(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
              placeholder="Zadejte poznámky k této sekci..."
              style={{
                minHeight: '80px',
                height: 'auto',
                maxHeight: '400px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 400) + 'px';
              }}
            />
          </div>
        </div>

        {/* 1.5. Odkazy (Links) Section */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-900">Odkazy</h3>
          </div>
          
          <div>
            {/* Links */}
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Webové odkazy
              </label>
              <button
                onClick={addLink}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-3 h-3 mr-1" />
                Přidat odkaz
              </button>
            </div>

            <div className="space-y-3">
              {(content.links || []).map((link) => (
                <div key={link.id} className="bg-white rounded-lg p-4 border">
                  {editingLinkId === link.id ? (
                    // Editing mode
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <div className="flex">
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                              className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              placeholder="https://example.com"
                            />
                            <CopyButton text={link.url} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Název (volitelný)
                          </label>
                          <input
                            type="text"
                            value={link.title || ''}
                            onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            placeholder="Popis odkazu"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={() => setEditingLinkId(null)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Uložit
                        </button>
                        <button
                          onClick={() => setEditingLinkId(null)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
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
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          {link.title || 'Odkaz bez názvu'}
                        </a>
                      )}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingLinkId(link.id)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Upravit odkaz"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeLink(link.id)}
                          className="text-red-600 hover:text-red-800"
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
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Žádné odkazy nejsou přidány</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Základní Parametry (Basic Parameters) Section */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Základní Parametry</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Účel financování
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={content.basicParameters?.financingPurpose || ''}
                  onChange={(e) => updateBasicParameter('financingPurpose', e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Koupě nemovitosti, refinancování..."
                />
                <CopyButton text={content.basicParameters?.financingPurpose || ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Požadovaná výše úvěru (Kč)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={content.basicParameters?.requestedLoanAmount || ''}
                  onChange={(e) => updateBasicParameter('requestedLoanAmount', parseFloat(e.target.value) || 0)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="1500000"
                  min="0"
                />
                <CopyButton text={content.basicParameters?.requestedLoanAmount ? content.basicParameters.requestedLoanAmount.toLocaleString('cs-CZ') : ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hodnota nemovitosti (Kč)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={content.basicParameters?.propertyValue || ''}
                  onChange={(e) => updateBasicParameter('propertyValue', parseFloat(e.target.value) || 0)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="2000000"
                  min="0"
                />
                <CopyButton text={content.basicParameters?.propertyValue ? content.basicParameters.propertyValue.toLocaleString('cs-CZ') : ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vlastní prostředky (Kč)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={content.basicParameters?.vlastniProstredky || ''}
                  onChange={(e) => updateBasicParameter('vlastniProstredky', parseFloat(e.target.value) || 0)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="500000"
                  min="0"
                />
                <CopyButton text={content.basicParameters?.vlastniProstredky ? content.basicParameters.vlastniProstredky.toLocaleString('cs-CZ') : ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Splatnost v letech
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={content.basicParameters?.maturityYears || ''}
                  onChange={(e) => updateBasicParameter('maturityYears', parseInt(e.target.value) || 0)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="30"
                  min="1"
                  max="50"
                />
                <CopyButton text={content.basicParameters?.maturityYears || ''} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Délka fixace preferovaná (roky)
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={content.basicParameters?.preferredFixationYears || ''}
                  onChange={(e) => updateBasicParameter('preferredFixationYears', parseInt(e.target.value) || 0)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="5"
                  min="1"
                  max="30"
                />
                <CopyButton text={content.basicParameters?.preferredFixationYears || ''} />
              </div>
            </div>
          </div>

          {/* LTV Calculation */}
          {content.basicParameters?.requestedLoanAmount && content.basicParameters?.propertyValue && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Výpočet LTV</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Výše úvěru:</span>
                  <div className="font-medium">{content.basicParameters.requestedLoanAmount.toLocaleString('cs-CZ')} Kč</div>
                </div>
                <div>
                  <span className="text-blue-700">Hodnota nemovitosti:</span>
                  <div className="font-medium">{content.basicParameters.propertyValue.toLocaleString('cs-CZ')} Kč</div>
                </div>
                <div>
                  <span className="text-blue-700">LTV poměr:</span>
                  <div className="font-bold text-lg text-blue-800">
                    {((content.basicParameters.requestedLoanAmount / content.basicParameters.propertyValue) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Soubory (Files) Section */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <Upload className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">Soubory</h3>
          </div>
          
          <div className="space-y-6">
            {/* File List - Now displayed ABOVE upload area */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
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
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Žádné soubory nejsou nahrány</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Area - Now positioned at the BOTTOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nahrát soubory
              </label>
              <div
                className={`flex items-center justify-center w-full transition-all duration-200 ${
                  isDragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-8 h-8 mb-4 transition-colors ${
                      isDragOver ? 'text-purple-600' : 'text-gray-500'
                    }`} />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">
                        {isDragOver ? 'Pusťte soubory zde' : 'Klikněte pro nahrání'}
                      </span>
                      {!isDragOver && ' nebo přetáhněte soubory'}
                    </p>
                    <p className="text-xs text-gray-500">
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
                  />
                </label>
              </div>
              {isUploading && (
                <div className="mt-2 text-sm text-purple-600 flex items-center">
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