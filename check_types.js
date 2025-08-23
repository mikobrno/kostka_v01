console.log('Testing document_types update...');

const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const url = lines.find(line => line.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = lines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

// Zkontroluj aktuální document_types
const getCurrentTypes = () => {
  const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key };
  
  const req = https.request({
    hostname: 'tnvttbxzvlywhgvmafra.supabase.co',
    port: 443,
    path: '/rest/v1/admin_lists?list_type=eq.document_types&select=*',
    headers: headers
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Current document_types:', JSON.parse(data)[0].items);
    });
  });
  
  req.on('error', console.error);
  req.end();
};

getCurrentTypes();
