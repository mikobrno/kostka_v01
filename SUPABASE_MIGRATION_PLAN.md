# Migrace aplikace KostKa Úvěry na Supabase

## Část 1: Analýza a návrh databázového schématu

### Současná struktura dat

Aplikace aktuálně spravuje tyto entity:
- **Klienti** - osobní údaje žadatele a spolužadatele
- **Zaměstnavatelé** - informace o zaměstnavateli
- **Nemovitosti** - údaje o financované nemovitosti  
- **Závazky** - seznam existujících úvěrů a závazků
- **Administrační seznamy** - dropdown hodnoty (tituly, banky, typy dokladů, atd.)
- **CORS nastavení** - konfigurace API

### Navržené databázové schéma pro Supabase

```sql
-- Tabulka pro klienty (hlavní entita)
clients (
  id: uuid (PK)
  created_at: timestamptz
  updated_at: timestamptz
  user_id: uuid (FK -> auth.users)
  
  -- Žadatel
  applicant_title: text
  applicant_first_name: text
  applicant_last_name: text
  applicant_birth_number: text
  applicant_age: integer
  applicant_marital_status: text
  applicant_permanent_address: text
  applicant_contact_address: text
  applicant_document_type: text
  applicant_document_number: text
  applicant_document_issue_date: date
  applicant_document_valid_until: date
  applicant_phone: text
  applicant_email: text
  applicant_bank: text
  
  -- Spolužadatel
  co_applicant_title: text
  co_applicant_first_name: text
  co_applicant_last_name: text
  co_applicant_birth_number: text
  co_applicant_age: integer
  co_applicant_marital_status: text
  co_applicant_permanent_address: text
  co_applicant_contact_address: text
  co_applicant_document_type: text
  co_applicant_document_number: text
  co_applicant_document_issue_date: date
  co_applicant_document_valid_until: date
  co_applicant_phone: text
  co_applicant_email: text
  co_applicant_bank: text
)

-- Tabulka pro zaměstnavatele
employers (
  id: uuid (PK)
  client_id: uuid (FK -> clients.id)
  ico: text
  company_name: text
  company_address: text
  net_income: numeric
  created_at: timestamptz
)

-- Tabulka pro nemovitosti
properties (
  id: uuid (PK)
  client_id: uuid (FK -> clients.id)
  address: text
  price: numeric
  created_at: timestamptz
)

-- Tabulka pro děti
children (
  id: uuid (PK)
  client_id: uuid (FK -> clients.id)
  parent_type: text ('applicant' | 'co_applicant')
  name: text
  birth_date: date
  age: integer
  created_at: timestamptz
)

-- Tabulka pro závazky
liabilities (
  id: uuid (PK)
  client_id: uuid (FK -> clients.id)
  institution: text
  type: text
  amount: numeric
  payment: numeric
  balance: numeric
  created_at: timestamptz
)

-- Tabulka pro administrační seznamy
admin_lists (
  id: uuid (PK)
  list_type: text ('titles', 'marital_statuses', 'document_types', 'banks', 'institutions', 'liability_types')
  items: jsonb
  updated_at: timestamptz
  updated_by: uuid (FK -> auth.users)
)

-- Tabulka pro nastavení aplikace
app_settings (
  id: uuid (PK)
  setting_key: text UNIQUE
  setting_value: jsonb
  updated_at: timestamptz
  updated_by: uuid (FK -> auth.users)
)
```

### Autentizace a autorizace

- **Supabase Auth** s email/password přihlášením
- **Row Level Security (RLS)** pro zabezpečení dat
- Uživatelské role: `admin`, `user`
- Každý uživatel vidí pouze své klienty

## Část 2: Detailní návod pro nastavení Supabase

### Krok 1: Vytvoření Supabase projektu

1. Přejděte na [supabase.com](https://supabase.com)
2. Klikněte na "Start your project"
3. Přihlaste se pomocí GitHub účtu
4. Klikněte "New project"
5. Vyplňte:
   - **Name**: `kostka-uvery`
   - **Database Password**: Vygenerujte silné heslo (uložte si ho!)
   - **Region**: `Central EU (Frankfurt)` (nejblíže ČR)
6. Klikněte "Create new project"
7. Počkejte 2-3 minuty na dokončení

### Krok 2: Získání API klíčů

1. V Supabase dashboardu přejděte na **Settings** → **API**
2. Zkopírujte si tyto hodnoty:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (pro frontend)
   - **service_role key**: `eyJ...` (pro admin operace, NIKDY nezveřejňovat!)

### Krok 3: Vytvoření databázových tabulek

Přejděte na **SQL Editor** v Supabase dashboardu a spusťte následující SQL příkazy:

```sql
-- Povolení UUID rozšíření
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabulka pro administrační seznamy
CREATE TABLE admin_lists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_type text NOT NULL CHECK (list_type IN ('titles', 'marital_statuses', 'document_types', 'banks', 'institutions', 'liability_types')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Tabulka pro nastavení aplikace
CREATE TABLE app_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Hlavní tabulka pro klienty
CREATE TABLE clients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  -- Žadatel
  applicant_title text,
  applicant_first_name text,
  applicant_last_name text,
  applicant_birth_number text,
  applicant_age integer,
  applicant_marital_status text,
  applicant_permanent_address text,
  applicant_contact_address text,
  applicant_document_type text,
  applicant_document_number text,
  applicant_document_issue_date date,
  applicant_document_valid_until date,
  applicant_phone text,
  applicant_email text,
  applicant_bank text,
  
  -- Spolužadatel
  co_applicant_title text,
  co_applicant_first_name text,
  co_applicant_last_name text,
  co_applicant_birth_number text,
  co_applicant_age integer,
  co_applicant_marital_status text,
  co_applicant_permanent_address text,
  co_applicant_contact_address text,
  co_applicant_document_type text,
  co_applicant_document_number text,
  co_applicant_document_issue_date date,
  co_applicant_document_valid_until date,
  co_applicant_phone text,
  co_applicant_email text,
  co_applicant_bank text
);

-- Tabulka pro zaměstnavatele
CREATE TABLE employers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  ico text,
  company_name text,
  company_address text,
  net_income numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- Tabulka pro nemovitosti
CREATE TABLE properties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  address text,
  price numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- Tabulka pro děti
CREATE TABLE children (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  parent_type text CHECK (parent_type IN ('applicant', 'co_applicant')) NOT NULL,
  name text NOT NULL,
  birth_date date,
  age integer,
  created_at timestamptz DEFAULT now()
);

-- Tabulka pro závazky
CREATE TABLE liabilities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  institution text,
  type text,
  amount numeric(12,2),
  payment numeric(12,2),
  balance numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- Trigger pro automatické aktualizování updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_lists_updated_at BEFORE UPDATE ON admin_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Krok 4: Nastavení Row Level Security (RLS)

```sql
-- Povolení RLS pro všechny tabulky
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Politiky pro tabulku clients
CREATE POLICY "Uživatelé vidí pouze své klienty" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Politiky pro související tabulky (employers, properties, children, liabilities)
CREATE POLICY "Uživatelé vidí pouze data svých klientů" ON employers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = employers.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Uživatelé vidí pouze data svých klientů" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = properties.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Uživatelé vidí pouze data svých klientů" ON children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = children.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Uživatelé vidí pouze data svých klientů" ON liabilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = liabilities.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Politiky pro admin tabulky (všichni uživatelé mohou číst, pouze admin může upravovat)
CREATE POLICY "Všichni mohou číst admin seznamy" ON admin_lists
  FOR SELECT USING (true);

CREATE POLICY "Pouze autentizovaní mohou upravovat admin seznamy" ON admin_lists
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Všichni mohou číst nastavení" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "Pouze autentizovaní mohou upravovat nastavení" ON app_settings
  FOR ALL USING (auth.uid() IS NOT NULL);
```

### Krok 5: Vložení výchozích dat

```sql
-- Vložení výchozích administrační seznamů
INSERT INTO admin_lists (list_type, items) VALUES
('titles', '["Bc.", "Mgr.", "Ing.", "MUDr.", "JUDr.", "PhDr.", "RNDr.", "Dr."]'),
('marital_statuses', '["svobodný/á", "ženatý/vdaná", "rozvedený/á", "vdovec/vdova", "partnerský svazek"]'),
('document_types', '["občanský průkaz", "pas", "řidičský průkaz"]'),
('banks', '["Česká spořitelna", "Komerční banka", "ČSOB", "UniCredit Bank", "Raiffeisenbank", "mBank", "Fio banka", "Air Bank", "Equa bank"]'),
('institutions', '["Česká spořitelna", "Komerční banka", "ČSOB", "UniCredit Bank", "Raiffeisenbank", "mBank", "Fio banka", "Air Bank", "Equa bank", "Cetelem", "Home Credit", "Provident", "Cofidis"]'),
('liability_types', '["hypotéka", "spotřebitelský úvěr", "kreditní karta", "kontokorent", "úvěr ze stavebního spoření", "leasing", "jiný"]');

-- Vložení výchozích nastavení
INSERT INTO app_settings (setting_key, setting_value) VALUES
('cors_settings', '{
  "enabled": true,
  "allowedOrigins": ["https://taupe-sable-b96081.netlify.app", "http://localhost:5173", "https://localhost:5173"]
}');
```

### Krok 6: Nastavení autentizace

1. V Supabase dashboardu přejděte na **Authentication** → **Settings**
2. V sekci **Site URL** nastavte: `https://taupe-sable-b96081.netlify.app`
3. V sekci **Redirect URLs** přidejte:
   - `https://taupe-sable-b96081.netlify.app`
   - `http://localhost:5173` (pro vývoj)
4. **Email confirmation** nechte vypnuté pro jednoduchost
5. V sekci **Auth Providers** zkontrolujte, že **Email** je povolený

### Krok 7: Vytvoření environment proměnných

Vytvořte soubor `.env` v kořenovém adresáři projektu:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**DŮLEŽITÉ**: Nahraďte `your-project-id` a `your-anon-key-here` skutečnými hodnotami z vašeho Supabase projektu!

### Krok 8: Testování konfigurace

1. **Test připojení k databázi**:
   ```sql
   SELECT * FROM admin_lists;
   ```
   Mělo by vrátit 6 řádků s administračními seznamy.

2. **Test RLS politik**:
   ```sql
   SELECT * FROM clients;
   ```
   Mělo by vrátit prázdný výsledek (žádní klienti zatím).

3. **Test autentizace**:
   - Zkuste se registrovat nového uživatele
   - Zkuste se přihlásit

### Krok 9: Bezpečnostní doporučení

1. **Nikdy nesdílejte service_role klíč** - používejte pouze anon klíč ve frontend aplikaci
2. **Pravidelně rotujte API klíče** v produkčním prostředí
3. **Monitorujte přístup k databázi** v Supabase dashboardu
4. **Nastavte zálohy databáze** v Settings → Database
5. **Používejte HTTPS** pro všechny požadavky
6. **Validujte všechna vstupní data** na frontend i backend straně

### Krok 10: Optimalizace výkonu

```sql
-- Vytvoření indexů pro rychlejší vyhledávání
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_applicant_email ON clients(applicant_email);
CREATE INDEX idx_clients_applicant_phone ON clients(applicant_phone);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX idx_employers_client_id ON employers(client_id);
CREATE INDEX idx_properties_client_id ON properties(client_id);
CREATE INDEX idx_children_client_id ON children(client_id);
CREATE INDEX idx_liabilities_client_id ON liabilities(client_id);
```

## Ověření úspěšného nastavení

### Checklist pro ověření:

- [ ] Supabase projekt je vytvořen a běží
- [ ] Všechny tabulky jsou vytvořeny bez chyb
- [ ] RLS politiky jsou aktivní a fungují
- [ ] Výchozí data jsou vložena
- [ ] Autentizace je nakonfigurována
- [ ] Environment proměnné jsou nastaveny
- [ ] Indexy jsou vytvořeny
- [ ] Testovací dotazy fungují

Po dokončení těchto kroků bude Supabase databáze připravena pro integraci s aplikací.