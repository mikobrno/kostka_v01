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


      {/* Vertical Stack Content */}
      <div className="space-y-6">
        {/* 1. Poznámky (Notes) Section */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Poznámky a Odkazy</h3>
          </div>
          
          <div className="space-y-6">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poznámky
              </label>
              <textarea
                value={content.notes || ''}
                onChange={(e) => updateNotes(e.target.value)}
                rows={4}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Zadejte poznámky k této sekci..."
              />
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Odkazy
                </label>
                <button
                  onClick={addLink}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
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
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            {link.title || 'Odkaz bez názvu'}
                          </a>
                        )}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingLinkId(link.id)}
                            className="text-blue-600 hover:text-blue-800"
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
        </div>

        {/* 2. Základní Parametry (Basic Parameters) Section */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Základní Parametry</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="md:col-span-2">
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
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nahrát soubory
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Klikněte pro nahrání</span> nebo přetáhněte soubory
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
                <div className="mt-2 text-sm text-blue-600">
                  Nahrávám soubory...
                </div>
              )}
            </div>

            {/* File List */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Nahrané soubory ({(content.files || []).length})
              </h4>
              <div className="space-y-2">
                {(content.files || []).map((file) => (
                  <div key={file.id} className="bg-white rounded-lg p-3 border flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {FileStorageService.getFileIcon(file.type)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {FileStorageService.formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="Otevřít soubor"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          const newName = prompt('Nový název souboru:', file.originalName);
                          if (newName && newName.trim()) {
                            renameFile(file.id, newName.trim());
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Přejmenovat"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Smazat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!content.files || content.files.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Žádné soubory nejsou nahrány</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Obecná pole (General Fields) Section */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-medium text-gray-900">Obecná pole</h3>
            </div>
            <button
              onClick={addGeneralField}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              Přidat pole
            </button>
          </div>

          <div className="space-y-4">
            {(content.generalFields || []).map((field) => (
              <div key={field.id} className="bg-white rounded-lg p-4 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Název pole
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateGeneralField(field.id, 'label', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      placeholder="Např. Poznámka, Speciální požadavek..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Hodnota
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateGeneralField(field.id, 'value', e.target.value)}
                        className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="Zadejte hodnotu..."
                      />
                      <CopyButton text={field.value} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => removeGeneralField(field.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {(!content.generalFields || content.generalFields.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Žádná obecná pole nejsou přidána</p>
                <p className="text-sm">Klikněte na "Přidat pole" pro vytvoření vlastního pole</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};