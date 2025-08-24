import fs from 'fs';
import https from 'https';

// Načti .env
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const url = lines.find(line => line.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.trim();
const key = lines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.trim();

console.log('Test UPSERT "povolení k pobytu" do document_types...\n');

// Test upsert metody podobně jako v AdminService
const upsertDocTypes = () => {
  return new Promise((resolve, reject) => {
    const newItems = ['občanský průkaz', 'pas', 'řidičský průkaz', 'povolení k pobytu'];
    
    const upsertData = {
      list_type: 'document_types',
      items: newItems
    };

    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    };

    const options = {
      hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
      port: 443,
      path: '/rest/v1/admin_lists',
      method: 'POST',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('UPSERT Status:', res.statusCode);
        console.log('UPSERT Response:', data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(data);
        } else {
          reject(`UPSERT failed: ${res.statusCode} ${data}`);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(upsertData));
    req.end();
  });
};

// Ověř aktuální stav
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

// Spusť test
(async () => {
  try {
    console.log('1. Získávání aktuálních document_types...');
    const current = await getCurrentDocTypes();
    console.log('Aktuální document_types:', current.items);

    console.log('\n2. UPSERT document_types s novým záznamem...');
    await upsertDocTypes();

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
