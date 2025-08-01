// Test funkcionality RŽP tlačítka
console.log('=== TEST RŽP BUTTON FUNCTIONALITY ===');

// Simulace dat klienta
const testData = {
  firstName: 'Jan',
  lastName: 'Novák'
};

// Test sestavení URL
const fullName = `${testData.firstName || ''} ${testData.lastName || ''}`.trim();
const expectedUrl = `https://rzp.gov.cz/verejne-udaje/cs/udaje/vyber-subjektu?jmeno=${encodeURIComponent(fullName)}`;

console.log('Jméno a příjmení:', fullName);
console.log('Sestavené URL:', expectedUrl);
console.log('Dekódované URL:', decodeURIComponent(expectedUrl));

// Test s prázdnými daty
const emptyData = { firstName: '', lastName: '' };
const emptyName = `${emptyData.firstName || ''} ${emptyData.lastName || ''}`.trim();
const fallbackUrl = 'https://rzp.gov.cz/verejne-udaje/cs/udaje/vyber-subjektu';

console.log('');
console.log('Test s prázdnými daty:');
console.log('Prázdné jméno:', `"${emptyName}"`);
console.log('Fallback URL:', fallbackUrl);

// Test s diakritikou
const diacriticsData = {
  firstName: 'Václav',
  lastName: 'Dvořák'
};

const diacriticsName = `${diacriticsData.firstName || ''} ${diacriticsData.lastName || ''}`.trim();
const diacriticsUrl = `https://rzp.gov.cz/verejne-udaje/cs/udaje/vyber-subjektu?jmeno=${encodeURIComponent(diacriticsName)}`;

console.log('');
console.log('Test s diakritikou:');
console.log('Jméno s diakritikou:', diacriticsName);
console.log('URL s diakritikou:', diacriticsUrl);
console.log('Dekódovaná diakritika:', decodeURIComponent(diacriticsUrl));

console.log('=== TEST COMPLETE ===');
