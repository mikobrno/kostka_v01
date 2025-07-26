import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Typy pro TypeScript
export interface Client {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  
  // Žadatel
  applicant_title?: string
  applicant_first_name?: string
  applicant_last_name?: string
  applicant_birth_number?: string
  applicant_age?: number
  applicant_marital_status?: string
  applicant_permanent_address?: string
  applicant_contact_address?: string
  applicant_document_type?: string
  applicant_document_number?: string
  applicant_document_issue_date?: string
  applicant_document_valid_until?: string
  applicant_phone?: string
  applicant_email?: string
  applicant_bank?: string
  
  // Spolužadatel
  co_applicant_title?: string
  co_applicant_first_name?: string
  co_applicant_last_name?: string
  co_applicant_birth_number?: string
  co_applicant_age?: number
  co_applicant_marital_status?: string
  co_applicant_permanent_address?: string
  co_applicant_contact_address?: string
  co_applicant_document_type?: string
  co_applicant_document_number?: string
  co_applicant_document_issue_date?: string
  co_applicant_document_valid_until?: string
  co_applicant_phone?: string
  co_applicant_email?: string
  co_applicant_bank?: string
}

export interface Employer {
  id: string
  client_id: string
  ico?: string
  company_name?: string
  company_address?: string
  net_income?: number
  created_at: string
}

export interface Property {
  id: string
  client_id: string
  address?: string
  price?: number
  created_at: string
}

export interface Child {
  id: string
  client_id: string
  parent_type: 'applicant' | 'co_applicant'
  name: string
  birth_date?: string
  age?: number
  created_at: string
}

export interface Liability {
  id: string
  client_id: string
  institution?: string
  type?: string
  amount?: number
  payment?: number
  balance?: number
  created_at: string
}

export interface AdminList {
  id: string
  list_type: 'titles' | 'marital_statuses' | 'document_types' | 'banks' | 'institutions' | 'liability_types'
  items: string[]
  updated_at: string
  updated_by?: string
}

export interface AppSetting {
  id: string
  setting_key: string
  setting_value: any
  updated_at: string
  updated_by?: string
}