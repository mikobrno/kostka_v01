# Instrukce pro přidání status sloupce do Supabase

Prosím přidejte následující sloupec do tabulky `clients` v Supabase Dashboard:

## SQL příkaz pro Table Editor nebo SQL Editor:

```sql
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'inquiry' 
CHECK (status IN ('waiting', 'inquiry', 'offer', 'completion', 'signing', 'drawdown', 'completed', 'archived'));

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

UPDATE clients SET status = 'inquiry' WHERE status IS NULL;
```

## Nebo přes Table Editor:

1. Jděte do Supabase Dashboard → Table Editor → clients
2. Klikněte na "Add Column"
3. Nastavte:
   - Name: `status`
   - Type: `varchar`
   - Default Value: `inquiry`
   - Is Nullable: false

4. Přidejte CHECK constraint:
   ```sql
   status IN ('waiting', 'inquiry', 'offer', 'completion', 'signing', 'drawdown', 'completed', 'archived')
   ```

Po přidání tohoto sloupce bude status systém plně funkční!

## Status hodnoty:
- `waiting` - Čeká ⏳
- `inquiry` - Poptávka 📋  
- `offer` - Nabídka 💰
- `completion` - Kompletace 📄
- `signing` - Podpis ✍️
- `drawdown` - Čerpání 💳
- `completed` - Vyřízeno ✅
- `archived` - Archiv 📦
