// Test rychlé funkcionality pro documents
// Tento soubor lze spustit v konzoli prohlížeče pro test

console.log('=== TEST DOCUMENTS FUNCTIONALITY ===');

// Simulace dat stejně jako v aplikaci
const testFormData = {
  applicant: {
    firstName: 'Jan',
    lastName: 'Novák',
    documents: [
      {
        id: Date.now(),
        documentType: 'Občanský průkaz',
        documentNumber: '123456789',
        documentIssueDate: '2023-01-01',
        documentValidUntil: '2033-01-01',
        issuingAuthority: 'Magistrát města Brna',
        placeOfBirth: 'Praha',
        controlNumber: 'ABC123'
      }
    ]
  },
  coApplicant: {
    documents: []
  }
};

// Test transformace dat pro databázi (jak se dělá v clientService)
const allDocuments = [
  ...(testFormData.applicant.documents || []).map(document => ({
    ...document,
    parent_type: 'applicant'
  })),
  ...(testFormData.coApplicant.documents || []).map(document => ({
    ...document,
    parent_type: 'co_applicant'
  }))
];

console.log('Test data pro documents:', allDocuments);

const documentsData = allDocuments.map(document => ({
  client_id: 'test-client-id',
  parent_type: document.parent_type,
  document_type: document.documentType || null,
  document_number: document.documentNumber || null,
  document_issue_date: document.documentIssueDate || null,
  document_valid_until: document.documentValidUntil || null,
  issuing_authority: document.issuingAuthority || null,
  place_of_birth: document.placeOfBirth || null,
  control_number: document.controlNumber || null,
}));

console.log('Data pro databázi:', documentsData);

// Test zpětné transformace (jak se dělá při načítání)
const dbDocuments = [
  {
    id: '123',
    client_id: 'test-client-id',
    parent_type: 'applicant',
    document_type: 'Občanský průkaz',
    document_number: '123456789',
    document_issue_date: '2023-01-01',
    document_valid_until: '2033-01-01',
    issuing_authority: 'Magistrát města Brna',
    place_of_birth: 'Praha',
    control_number: 'ABC123'
  }
];

const transformedDocuments = dbDocuments.map(document => ({
  ...document,
  documentType: document.document_type,
  documentNumber: document.document_number,
  documentIssueDate: document.document_issue_date,
  documentValidUntil: document.document_valid_until,
  issuingAuthority: document.issuing_authority,
  placeOfBirth: document.place_of_birth,
  controlNumber: document.control_number,
  parentType: document.parent_type
}));

console.log('Transformovaná data z databáze:', transformedDocuments);

// Test filtrace podle parent_type (jak se dělá v ClientForm)
const applicantDocuments = transformedDocuments.filter(d => d.parent_type === 'applicant');
const coApplicantDocuments = transformedDocuments.filter(d => d.parent_type === 'co_applicant');

console.log('Documents pro applicant:', applicantDocuments);
console.log('Documents pro co_applicant:', coApplicantDocuments);

console.log('=== TEST COMPLETE ===');
