import { TestPDFService } from './test_pdf_service';
import * as fs from 'fs';

async function testPDFGeneration() {
  const client = {
    applicant_first_name: 'Marcela',
    applicant_last_name: 'Satrapová',
    applicant_birth_number: '6757061751',
    applicant_permanent_address: 'Zákřejsova 544, 572 01 Polička',
    applicant_phone: '603 477 572',
    applicant_email: 'marci.satrapova@gmail.com'
  };

  const loan = {
    product: 'Např. Hypoteční úvěr',
    amount: 2000000,
    ltv: 80,
    purpose: 'Nákup nemovitosti',
    monthly_payment: 15000,
    contract_date: ''
  };

  try {
    console.log('Testing PDF generation...');
    const pdfBase64 = await TestPDFService.testFillPDF(client, loan);
    
    // Uložíme PDF pro kontrolu
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    fs.writeFileSync('test_generated.pdf', pdfBuffer);
    
    console.log('✅ PDF successfully generated and saved as test_generated.pdf');
    console.log('PDF size:', pdfBuffer.length, 'bytes');
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
  }
}

testPDFGeneration();
