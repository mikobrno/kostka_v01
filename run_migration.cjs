const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnvttbxzvlywhgvmafra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudnR0Ynh6dmx5d2hndm1hZnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQxNDMsImV4cCI6MjA2OTExMDE0M30.0C3-lFr86pLcjpx3tEkBZ_aIKKXnqJMDTSwNxI5H11Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addStatusColumn() {
  try {
    console.log('Přidávám status sloupec do clients tabulky...');
    
    // Zkusíme přímo přidat sloupec pomocí rpc nebo raw SQL
    const { data, error } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'inquiry' 
        CHECK (status IN ('waiting', 'inquiry', 'offer', 'completion', 'signing', 'drawdown', 'completed'));
        
        CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
        
        UPDATE clients SET status = 'inquiry' WHERE status IS NULL;
      `
    });

    if (error) {
      console.error('Chyba při přidávání status sloupce:', error);
      return;
    }

    console.log('Status sloupec byl úspěšně přidán!', data);
  } catch (err) {
    console.error('Neočekávaná chyba:', err);
  }
}

addStatusColumn();
