import fs from 'fs';

// Načti .env
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const url = lines.find(line => line.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.trim();
const key = lines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.trim();

console.log('URL:', url);
console.log('Key:', key ? key.substring(0, 20) + '...' : 'not found');

// Test admin_lists
import https from 'https';

const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json'
};

// Test get admin_lists
const options = {
  hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
  port: 443,
  path: '/rest/v1/admin_lists?select=*',
  method: 'GET',
  headers: headers
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(data);
        console.log('\nParsed admin_lists:');
        parsed.forEach(item => {
          console.log(`- ${item.list_type}: ${JSON.stringify(item.items)}`);
        });
      } catch (e) {
        console.error('Chyba při parsování:', e);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Chyba:', error);
});

req.end();
