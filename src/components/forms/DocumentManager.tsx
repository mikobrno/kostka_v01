import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, MapPin, User, Shield } from 'lucide-react';
import { CopyButton } from '../CopyButton';

interface Document {
  id: string;
  document_type: string;
  document_number: string;
  issue_date: string;
  valid_until: string;
  issuing_authority: string;
  place_of_birth: string;
  control_number: string;
  is_primary: boolean;
}

interface DocumentManagerProps {
  clientId: string;
  documents: Document[];
  onChange: (documents: Document[]) => void;
  documentTypes: string[];
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  clientId,
  documents = [],
  onChange,
  documentTypes = ['občanský průkaz', 'pas', 'řidičský průkaz']
}) => {
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [newDocument, setNewDocument] = useState<Partial<Document> | null>(null);

  // Auto-calculate validity date (+10 years from issue date)
  const calculateValidityDate = (issueDate: string): string => {
    if (!issueDate) return '';
    const issue = new Date(issueDate);
    const validity = new Date(issue);
    validity.setFullYear(validity.getFullYear() + 10);
    return validity.toISOString().split('T')[0];
  };

  // Format date to dd-mm-yyyy for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Parse dd-mm-yyyy to ISO date
  const parseDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return '';
    const [day, month, year] = displayDate.split('-');
    return `${year}-${month}-${day}`;
  };

  const addNewDocument = () => {
    const newDoc: Partial<Document> = {
      id: `temp-${Date.now()}`,
      document_type: documentTypes[0],
      document_number: '',
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: calculateValidityDate(new Date().toISOString().split('T')[0]),
      issuing_authority: '',
      place_of_birth: '',
      control_number: '',
      is_primary: documents.length === 0
    };
    setNewDocument(newDoc);
  };

  const saveDocument = (document: Partial<Document>) => {
    if (document.id?.startsWith('temp-')) {
      // New document
      const finalDoc = {
        ...document,
        id: `doc-${Date.now()}`
      } as Document;
      onChange([...documents, finalDoc]);
    } else {
      // Update existing document
      const updated = documents.map(doc => 
        doc.id === document.id ? { ...doc, ...document } : doc
      );
      onChange(updated);
    }
    setNewDocument(null);
    setEditingDocument(null);
  };

  const deleteDocument = (documentId: string) => {
    if (confirm('Opravdu chcete smazat tento doklad?')) {
      const filtered = documents.filter(doc => doc.id !== documentId);
      onChange(filtered);
    }
  };

  const setPrimaryDocument = (documentId: string) => {
    const updated = documents.map(doc => ({
      ...doc,
      is_primary: doc.id === documentId
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Doklady totožnosti</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {documents.length} dokladů
          </span>
        </div>
        <button
          onClick={addNewDocument}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Přidat doklad
        </button>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            documentTypes={documentTypes}
            isEditing={editingDocument === document.id}
            onEdit={() => setEditingDocument(document.id)}
            onSave={(updatedDoc) => saveDocument(updatedDoc)}
            onCancel={() => setEditingDocument(null)}
            onDelete={() => deleteDocument(document.id)}
            onSetPrimary={() => setPrimaryDocument(document.id)}
            formatDateForDisplay={formatDateForDisplay}
            parseDateFromDisplay={parseDateFromDisplay}
            calculateValidityDate={calculateValidityDate}
          />
        ))}

        {/* New Document Form */}
        {newDocument && (
          <DocumentCard
            document={newDocument}
            documentTypes={documentTypes}
            isEditing={true}
            onSave={(updatedDoc) => saveDocument(updatedDoc)}
            onCancel={() => setNewDocument(null)}
            formatDateForDisplay={formatDateForDisplay}
            parseDateFromDisplay={parseDateFromDisplay}
            calculateValidityDate={calculateValidityDate}
            isNew={true}
          />
        )}
      </div>

      {documents.length === 0 && !newDocument && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné doklady</h3>
          <p className="text-gray-500 mb-6">Přidejte první doklad totožnosti klienta</p>
          <button
            onClick={addNewDocument}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Přidat první doklad
          </button>
        </div>
      )}
    </div>
  );
};

// Document Card Component
interface DocumentCardProps {
  document: Partial<Document>;
  documentTypes: string[];
  isEditing: boolean;
  onEdit?: () => void;
  onSave: (document: Partial<Document>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onSetPrimary?: () => void;
  formatDateForDisplay: (date: string) => string;
  parseDateFromDisplay: (date: string) => string;
  calculateValidityDate: (date: string) => string;
  isNew?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  documentTypes,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onSetPrimary,
  formatDateForDisplay,
  parseDateFromDisplay,
  calculateValidityDate,
  isNew = false
}) => {
  const [editData, setEditData] = useState(document);

  useEffect(() => {
    setEditData(document);
  }, [document]);

  const handleFieldChange = (field: string, value: string) => {
    const updated = { ...editData, [field]: value };
    
    // Auto-calculate validity when issue date changes
    if (field === 'issue_date') {
      updated.valid_until = calculateValidityDate(value);
    }
    
    setEditData(updated);
  };

  const handleSave = () => {
    // Validate required fields
    if (!editData.document_type || !editData.document_number || !editData.issue_date || 
        !editData.issuing_authority || !editData.place_of_birth || !editData.control_number) {
      alert('Všechna pole jsou povinná');
      return;
    }
    
    onSave(editData);
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">
            {isNew ? 'Nový doklad' : 'Úprava dokladu'}
          </h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
            >
              Uložit
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              Zrušit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ dokladu *
            </label>
            <select
              value={editData.document_type || ''}
              onChange={(e) => handleFieldChange('document_type', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Číslo dokladu *
            </label>
            <div className="flex">
              <input
                type="text"
                value={editData.document_number || ''}
                onChange={(e) => handleFieldChange('document_number', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="123456789"
              />
              <CopyButton text={editData.document_number || ''} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum vydání *
            </label>
            <input
              type="date"
              value={editData.issue_date || ''}
              onChange={(e) => handleFieldChange('issue_date', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platnost do
            </label>
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {editData.valid_until ? formatDateForDisplay(editData.valid_until) : 'Automaticky +10 let'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vydávající úřad *
            </label>
            <div className="flex">
              <div className="flex-1 relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={editData.issuing_authority || ''}
                  onChange={(e) => handleFieldChange('issuing_authority', e.target.value)}
                  className="block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Magistrát města Brna"
                />
              </div>
              <CopyButton text={editData.issuing_authority || ''} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Místo narození *
            </label>
            <div className="flex">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={editData.place_of_birth || ''}
                  onChange={(e) => handleFieldChange('place_of_birth', e.target.value)}
                  className="block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Praha"
                />
              </div>
              <CopyButton text={editData.place_of_birth || ''} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontrolní číslo *
            </label>
            <div className="flex">
              <input
                type="text"
                value={editData.control_number || ''}
                onChange={(e) => handleFieldChange('control_number', e.target.value)}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="ABC123"
              />
              <CopyButton text={editData.control_number || ''} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className={`bg-white rounded-lg border p-4 ${document.is_primary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
            document.is_primary ? 'bg-blue-600' : 'bg-gray-400'
          }`}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-900">
              {document.document_type}
              {document.is_primary && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Hlavní
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-500">
              Číslo: {document.document_number}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!document.is_primary && onSetPrimary && (
            <button
              onClick={onSetPrimary}
              className="text-xs text-blue-600 hover:text-blue-800"
              title="Nastavit jako hlavní"
            >
              Nastavit hlavní
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800"
              title="Upravit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800"
              title="Smazat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Vydán:</span>
          <p className="font-medium">{formatDateForDisplay(document.issue_date || '')}</p>
        </div>
        <div>
          <span className="text-gray-500">Platnost:</span>
          <p className="font-medium">{formatDateForDisplay(document.valid_until || '')}</p>
        </div>
        <div>
          <span className="text-gray-500">Vydal:</span>
          <p className="font-medium">{document.issuing_authority}</p>
        </div>
        <div>
          <span className="text-gray-500">Místo narození:</span>
          <p className="font-medium">{document.place_of_birth}</p>
        </div>
      </div>
    </div>
  );
};