import https from 'https';
import fs from 'fs';

console.log('Testing document_types update...');

const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const url = lines.find(line => line.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = lines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const getCurrentTypes = () => {
  const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key };
  const req = https.request({
    hostname: url.replace('https://','').replace('/',''),
    port: 443,
    path: '/rest/v1/admin_lists?list_type=eq.document_types&select=*',
    headers: headers
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Current document_types:', parsed[0]?.items);
      } catch (e) {
        console.error('Failed to parse response', data);
      }
    });
  });
  req.on('error', console.error);
  req.end();
};

getCurrentTypes();
