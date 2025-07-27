import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DynamicSectionService } from '../services/dynamicSectionService';

// Import českého fontu pro správné zobrazení diakritiky
declare module 'jspdf' {
  interface jsPDF {
    addFileToVFS(filename: string, filecontent: string): jsPDF;
    addFont(filename: string, fontname: string, fontstyle: string): string;
  }
}

export const generateClientPDF = async (client: any, formData: any) => {
  const doc = new jsPDF();
  
  // Nastavení UTF-8 encoding a fontu pro češtinu
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setCharSpace(0.1);
  
  // Hlavička dokumentu
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Klientský záznam', 20, 25, { align: 'left' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, 20, 35, { align: 'left' });
  
  let yPosition = 50;
  
  // Funkce pro formátování dat
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Neuvedeno';
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ');
    } catch {
      return 'Neplatné datum';
    }
  };
  
  const formatPrice = (price: number | string) => {
    if (!price) return 'Neuvedeno';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('cs-CZ') + ' Kč';
  };
  
  // Funkce pro bezpečné zobrazení textu s diakritikou
  const safeText = (text: string | undefined | null): string => {
    if (!text) return 'Neuvedeno';
    // Převod na UTF-8 kompatibilní formát
    return text.toString().normalize('NFC');
  };
  
  // Žadatel
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('ŽADATEL', 20, yPosition, { align: 'left' });
  yPosition += 10;
  
  const applicantData = [
    ['Jméno a příjmení', safeText(`${formData.applicant.title || ''} ${formData.applicant.firstName || ''} ${formData.applicant.lastName || ''}`.trim())],
    ['Rodné číslo', safeText(formData.applicant.birthNumber)],
    ['Věk', formData.applicant.age ? `${formData.applicant.age} let` : 'Neuvedeno'],
    ['Rodinný stav', safeText(formData.applicant.maritalStatus)],
    ['Trvalé bydliště', safeText(formData.applicant.permanentAddress)],
    ['Kontaktní adresa', safeText(formData.applicant.contactAddress)],
    ['Telefon', safeText(formData.applicant.phone)],
    ['Email', safeText(formData.applicant.email)],
    ['Banka', safeText(formData.applicant.bank)],
    ['Typ dokladu', safeText(formData.applicant.documentType)],
    ['Číslo dokladu', safeText(formData.applicant.documentNumber)],
    ['Datum vydání', formatDate(formData.applicant.documentIssueDate)],
    ['Platnost do', formatDate(formData.applicant.documentValidUntil)]
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Údaj', 'Hodnota']],
    body: applicantData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 20, right: 20 },
      textColor: [255, 255, 255],
      fontSize: 10,
    styles: { 
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });
  
  yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 100;
  
  // Spolužadatel (pokud existuje)
  if (formData.coApplicant.firstName) {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('SPOLUŽADATEL', 20, yPosition, { align: 'left' });
    yPosition += 10;
    
    const coApplicantData = [
      ['Jméno a příjmení', safeText(`${formData.coApplicant.title || ''} ${formData.coApplicant.firstName || ''} ${formData.coApplicant.lastName || ''}`.trim())],
      ['Rodné číslo', safeText(formData.coApplicant.birthNumber)],
      ['Věk', formData.coApplicant.age ? `${formData.coApplicant.age} let` : 'Neuvedeno'],
      ['Rodinný stav', safeText(formData.coApplicant.maritalStatus)],
      ['Telefon', safeText(formData.coApplicant.phone)],
      ['Email', safeText(formData.coApplicant.email)],
      ['Banka', safeText(formData.coApplicant.bank)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Údaj', 'Hodnota']],
      body: coApplicantData,
      theme: 'grid',
      headStyles: { 
        fillColor: [92, 184, 92],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 100;
  }
  
  // Nová stránka pro další sekce
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 30;
  }
  
  // Zaměstnavatel (pokud existuje)
  if (formData.applicantEmployer?.companyName) {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('ZAMĚSTNAVATEL', 20, yPosition, { align: 'left' });
    yPosition += 10;
    
    const employerData = [
      ['Název firmy', safeText(formData.applicantEmployer.companyName)],
      ['IČO', safeText(formData.applicantEmployer.ico)],
      ['Adresa', safeText(formData.applicantEmployer.companyAddress)],
      ['Čistý příjem', formData.applicantEmployer.netIncome ? formatPrice(formData.applicantEmployer.netIncome) : 'Neuvedeno']
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Údaj', 'Hodnota']],
      body: employerData,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 173, 78],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 100;
  }
  
  // Nemovitost (pokud existuje)
  if (formData.applicantProperty?.address) {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('NEMOVITOST', 20, yPosition, { align: 'left' });
    yPosition += 10;
    
    const propertyData = [
      ['Adresa', safeText(formData.applicantProperty.address)],
      ['Kupní cena', formData.applicantProperty.price ? formatPrice(formData.applicantProperty.price) : 'Neuvedeno']
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Údaj', 'Hodnota']],
      body: propertyData,
      theme: 'grid',
      headStyles: { 
        fillColor: [217, 83, 79],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 100;
  }
  
  // Závazky (pokud existují)
  if (formData.liabilities && formData.liabilities.length > 0) {
    // Nová stránka pro závazky pokud je potřeba
    if (yPosition > 150) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('ZÁVAZKY', 20, yPosition, { align: 'left' });
    yPosition += 10;
    
    const liabilitiesData = formData.liabilities.map((liability: any) => [
      safeText(liability.institution),
      safeText(liability.type),
      liability.amount ? formatPrice(liability.amount) : 'Neuvedeno',
      liability.payment ? formatPrice(liability.payment) : 'Neuvedeno',
      liability.balance ? formatPrice(liability.balance) : 'Neuvedeno'
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Instituce', 'Typ', 'Výše úvěru', 'Splátka', 'Zůstatek']],
      body: liabilitiesData,
      theme: 'grid',
      headStyles: { 
        fillColor: [91, 192, 222],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      }
    });
    
    yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 100;
  }
  
  // Děti (pokud existují)
  const allChildren = [
    ...(formData.applicant.children || []).map((child: any) => ({ ...child, parent: 'Žadatel' })),
    ...(formData.coApplicant.children || []).map((child: any) => ({ ...child, parent: 'Spolužadatel' }))
  ];
  
  if (allChildren.length > 0) {
    // Nová stránka pro děti pokud je potřeba
    if (yPosition > 150) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('DĚTI', 20, yPosition, { align: 'left' });
    yPosition += 10;
    
    const childrenData = allChildren.map((child: any) => [
      child.parent,
      safeText(child.name),
      formatDate(child.birthDate),
      child.age ? `${child.age} let` : 'Neuvedeno'
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Rodič', 'Jméno', 'Datum narození', 'Věk']],
      body: childrenData,
      theme: 'grid',
      headStyles: { 
        fillColor: [153, 102, 255],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      }
    });
  }
  
  // Přidání metadat do PDF
  doc.setProperties({
    title: `Klientský záznam - ${safeText(formData.applicant.firstName)} ${safeText(formData.applicant.lastName)}`,
    subject: 'Klientský záznam z aplikace KostKa Úvěry',
    author: 'KostKa Úvěry',
    creator: 'KostKa Úvěry - Systém pro evidenci klientů',
    producer: 'jsPDF'
  });
  
  // Add dynamic sections to PDF
  try {
    const { data: dynamicSections } = await DynamicSectionService.getDynamicSections(client.id);
    if (dynamicSections && dynamicSections.length > 0) {
      // Add new page for dynamic sections
      doc.addPage();
      yPosition = 30;
      
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('VLASTNÍ SEKCE', 20, yPosition, { align: 'left' });
      yPosition += 20;
      
      dynamicSections.forEach((section, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Section title
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text(safeText(section.section_name), 20, yPosition, { align: 'left' });
        yPosition += 15;
        
        const content = section.content;
        
        // Notes
        if (content.notes) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text('Poznámky:', 25, yPosition);
          yPosition += 8;
          
          const noteLines = doc.splitTextToSize(safeText(content.notes), 160);
          doc.text(noteLines, 25, yPosition);
          yPosition += noteLines.length * 5 + 10;
        }
        
        // Links
        if (content.links && content.links.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text('Odkazy:', 25, yPosition);
          yPosition += 8;
          
          content.links.forEach(link => {
            doc.setTextColor(0, 0, 255);
            doc.text(`• ${link.title || link.url}`, 30, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        }
        
        // Basic Parameters
        if (content.basicParameters && Object.keys(content.basicParameters).length > 0) {
          const params = content.basicParameters;
          const paramData = [];
          
          if (params.financingPurpose) paramData.push(['Účel financování', safeText(params.financingPurpose)]);
          if (params.requestedLoanAmount) paramData.push(['Požadovaná výše úvěru', formatPrice(params.requestedLoanAmount)]);
          if (params.propertyValue) paramData.push(['Hodnota nemovitosti', formatPrice(params.propertyValue)]);
          if (params.maturityYears) paramData.push(['Splatnost', `${params.maturityYears} let`]);
          if (params.preferredFixationYears) paramData.push(['Fixace', `${params.preferredFixationYears} let`]);
          
          if (paramData.length > 0) {
            autoTable(doc, {
              startY: yPosition,
              head: [['Parametr', 'Hodnota']],
              body: paramData,
              theme: 'grid',
              headStyles: { 
                fillColor: [147, 51, 234],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
              },
              margin: { left: 25, right: 20 },
              styles: { 
                fontSize: 8,
                cellPadding: 2,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
              },
              columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 'auto' }
              }
            });
            
            yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 50;
          }
        }
        
        // Files
        if (content.files && content.files.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(`Soubory (${content.files.length}):`, 25, yPosition);
          yPosition += 8;
          
          content.files.forEach(file => {
            doc.text(`• ${safeText(file.originalName)} (${formatFileSize(file.size)})`, 30, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        }
        
        // General Fields
        if (content.generalFields && content.generalFields.length > 0) {
          const fieldData = content.generalFields.map(field => [
            safeText(field.label),
            safeText(field.value)
          ]);
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Pole', 'Hodnota']],
            body: fieldData,
            theme: 'grid',
            headStyles: { 
              fillColor: [75, 85, 99],
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: 'bold'
            },
            margin: { left: 25, right: 20 },
            styles: { 
              fontSize: 8,
              cellPadding: 2,
              lineColor: [200, 200, 200],
              lineWidth: 0.1
            },
            columnStyles: {
              0: { cellWidth: 60, fontStyle: 'bold' },
              1: { cellWidth: 'auto' }
            }
          });
          
          yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 50;
        }
      });
    }
  } catch (error) {
    console.error('Error adding dynamic sections to PDF:', error);
  }
  
  // Helper function for file size formatting in PDF
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Uložení PDF
  const lastName = safeText(formData.applicant.lastName).replace(/[^a-zA-Z0-9]/g, '_') || 'neznamy';
  const firstName = safeText(formData.applicant.firstName).replace(/[^a-zA-Z0-9]/g, '_') || 'neznamy';
  const fileName = `klient_${lastName}_${firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};