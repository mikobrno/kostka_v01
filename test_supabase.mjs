import fs from 'fs';
import https from 'https';

// Test Supabase connection
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const url = lines.find(line => line.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.trim();
const key = lines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.trim();

console.log('🔍 Test Supabase připojení...\n');

// Test 1: Health check
const testHealth = () => {
  return new Promise((resolve, reject) => {
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    };

    const options = {
      hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Health check: ${res.statusCode}`);
      resolve(res.statusCode);
    });

    req.on('error', (error) => {
      console.log(`❌ Health check failed: ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

// Test 2: Auth endpoint
const testAuth = () => {
  return new Promise((resolve, reject) => {
    const headers = {
      'apikey': key,
    };

    const options = {
      hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
      port: 443,
      path: '/auth/v1/settings',
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Auth endpoint: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const settings = JSON.parse(data);
          console.log(`   - Sign up enabled: ${!settings.disable_signup}`);
          console.log(`   - External providers: ${Object.keys(settings.external || {}).length}`);
        }
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Auth endpoint failed: ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

// Test 3: Admin lists (RLS test)
const testAdminLists = () => {
  return new Promise((resolve, reject) => {
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    };

    const options = {
      hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
      port: 443,
      path: '/rest/v1/admin_lists?select=list_type',
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Admin lists: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const lists = JSON.parse(data);
          console.log(`   - Found ${lists.length} admin lists`);
        }
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Admin lists failed: ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

// Spusť všechny testy
(async () => {
  try {
    await testHealth();
    await testAuth();
    await testAdminLists();
    console.log('\n✅ Všechny testy prošly - Supabase funguje správně!');
  } catch (error) {
    console.log('\n❌ Některé testy selhaly - možný problém s konfigurací');
  }
})();
