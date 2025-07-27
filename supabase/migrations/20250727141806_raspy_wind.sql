/*
  # Dynamic Client Sections

  This migration creates the infrastructure for dynamic client sections that allow users
  to add custom, named sections to client profiles with flexible content storage.

  ## New Tables
  - `client_dynamic_sections` - Stores dynamic sections with JSONB content
  
  ## Security
  - Enable RLS on `client_dynamic_sections` table
  - Add policy for users to manage sections of their own clients
  
  ## Indexes
  - Add index for efficient lookup by client and order
*/

-- Create the dynamic sections table
CREATE TABLE IF NOT EXISTS client_dynamic_sections (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  section_name text NOT NULL, -- User-defined name for the section
  order_index integer NOT NULL, -- To maintain display order
  content jsonb NOT NULL DEFAULT '{}'::jsonb, -- Stores all sub-section data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE client_dynamic_sections ENABLE ROW LEVEL SECURITY;

-- Create policy for user access control
CREATE POLICY "Users can manage dynamic sections of their clients" ON client_dynamic_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_dynamic_sections.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_dynamic_sections_updated_at
  BEFORE UPDATE ON client_dynamic_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index for efficient lookup by client and order
CREATE INDEX IF NOT EXISTS idx_client_dynamic_sections_client_id_order 
  ON client_dynamic_sections(client_id, order_index);

-- Add index for client lookup
CREATE INDEX IF NOT EXISTS idx_client_dynamic_sections_client_id 
  ON client_dynamic_sections(client_id);