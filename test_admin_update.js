import fs from 'fs';
import https from 'https';

// Načti .env
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const url = lines.find(line => line.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.trim();
const key = lines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.trim();

console.log('Test přidání "povolení k pobytu" do document_types...\n');

// Nejprve získej aktuální document_types
const getCurrentDocTypes = () => {
  return new Promise((resolve, reject) => {
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    };

    const options = {
      hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
      port: 443,
      path: '/rest/v1/admin_lists?list_type=eq.document_types&select=*',
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          resolve(parsed[0]);
        } else {
          reject(`GET failed: ${res.statusCode} ${data}`);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Pak aktualizuj document_types s novým záznamem
const updateDocTypes = (currentItems) => {
  return new Promise((resolve, reject) => {
    // Přidej "povolení k pobytu" pokud tam není
    const newItems = [...currentItems];
    if (!newItems.includes('povolení k pobytu')) {
      newItems.push('povolení k pobytu');
    }

    const updateData = {
      list_type: 'document_types',
      items: newItems
    };

    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const options = {
      hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
      port: 443,
      path: '/rest/v1/admin_lists?list_type=eq.document_types',
      method: 'PATCH',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('UPDATE Status:', res.statusCode);
        console.log('UPDATE Response:', data);
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve(data);
        } else {
          reject(`UPDATE failed: ${res.statusCode} ${data}`);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(updateData));
    req.end();
  });
};

// Spusť test
(async () => {
  try {
    console.log('1. Získávání aktuálních document_types...');
    const current = await getCurrentDocTypes();
    console.log('Aktuální document_types:', current.items);

    console.log('\n2. Aktualizace document_types s novým záznamem...');
    await updateDocTypes(current.items);

    console.log('\n3. Ověření změny...');
    const updated = await getCurrentDocTypes();
    console.log('Aktualizované document_types:', updated.items);

    if (updated.items.includes('povolení k pobytu')) {
      console.log('✅ SUCCESS: "povolení k pobytu" bylo úspěšně přidáno!');
    } else {
      console.log('❌ FAIL: "povolení k pobytu" nebylo přidáno');
    }

  } catch (error) {
    console.error('❌ Chyba:', error);
  }
})();
