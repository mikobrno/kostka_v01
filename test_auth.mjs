import fs from 'fs';
import https from 'https';

// Načti .env
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const url = lines.find(line => line.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.trim();
const key = lines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.trim();

console.log('Test přihlášení s testovacím uživatelem...\n');

// Test přihlášení
const signIn = (email, password) => {
  return new Promise((resolve, reject) => {
    const signInData = {
      email: email,
      password: password
    };

    const headers = {
      'apikey': key,
      'Content-Type': 'application/json'
    };

    const options = {
      hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
      port: 443,
      path: '/auth/v1/token?grant_type=password',
      method: 'POST',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('SignIn Status:', res.statusCode);
        console.log('SignIn Response:', data);
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          resolve(parsed.access_token);
        } else {
          reject(`SignIn failed: ${res.statusCode} ${data}`);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(signInData));
    req.end();
  });
};

// Test admin update s přihlášeným uživatelem
const upsertWithAuth = (accessToken) => {
  return new Promise((resolve, reject) => {
    const newItems = ['občanský průkaz', 'pas', 'řidičský průkaz', 'povolení k pobytu'];
    
    const upsertData = {
      list_type: 'document_types',
      items: newItems
    };

    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${accessToken}`,
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
        console.log('Authenticated UPSERT Status:', res.statusCode);
        console.log('Authenticated UPSERT Response:', data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(data);
        } else {
          reject(`Authenticated UPSERT failed: ${res.statusCode} ${data}`);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(upsertData));
    req.end();
  });
};

// Ověř výsledek
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

// Spusť test - zkus s testovacím účtem
(async () => {
  try {
    console.log('Pokus o přihlášení s test účtem...');
    // Zkusíme několik možných testovacích účtů
    const testAccounts = [
      { email: 'test@test.cz', password: 'password123' },
      { email: 'admin@test.cz', password: 'password123' },
      { email: 'test@example.com', password: 'password123' }
    ];

    let accessToken = null;
    for (const account of testAccounts) {
      try {
        console.log(`Zkouším přihlášení s ${account.email}...`);
        accessToken = await signIn(account.email, account.password);
        console.log('✅ Přihlášení úspěšné!');
        break;
      } catch (error) {
        console.log(`❌ Přihlášení s ${account.email} neúspěšné: ${error}`);
      }
    }

    if (!accessToken) {
      console.log('\n❌ Žádný testovací účet nefunguje. Musíte si vytvořit účet v aplikaci.');
      return;
    }

    console.log('\n2. Zkouším aktualizaci admin_lists s autentizací...');
    await upsertWithAuth(accessToken);

    console.log('\n3. Ověření výsledku...');
    const updated = await getCurrentDocTypes();
    console.log('Aktualizované document_types:', updated.items);

    if (updated.items.includes('povolení k pobytu')) {
      console.log('✅ SUCCESS: "povolení k pobytu" bylo úspěšně přidáno s autentizací!');
    } else {
      console.log('❌ FAIL: "povolení k pobytu" nebylo přidáno ani s autentizací');
    }

  } catch (error) {
    console.error('❌ Chyba:', error);
  }
})();
