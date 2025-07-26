import { supabase } from '../lib/supabase'
import type { Client, Employer, Property, Child, Liability } from '../lib/supabase'

export interface ClientFormData {
  applicant: any
  coApplicant: any
  employer: any
  property: any
  liabilities: any[]
}

export class ClientService {
  static async createClient(formData: ClientFormData): Promise<{ data: Client | null; error: any }> {
    try {
      // Získání aktuálního uživatele
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { data: null, error: 'Uživatel není přihlášen' }
      }

      // Vytvoření klienta
      const clientData = {
        user_id: user.id,
        // Žadatel
        applicant_title: formData.applicant.title || null,
        applicant_first_name: formData.applicant.firstName || null,
        applicant_last_name: formData.applicant.lastName || null,
        applicant_birth_number: formData.applicant.birthNumber || null,
        applicant_age: formData.applicant.age || null,
        applicant_marital_status: formData.applicant.maritalStatus || null,
        applicant_permanent_address: formData.applicant.permanentAddress || null,
        applicant_contact_address: formData.applicant.contactAddress || null,
        applicant_document_type: formData.applicant.documentType || null,
        applicant_document_number: formData.applicant.documentNumber || null,
        applicant_document_issue_date: formData.applicant.documentIssueDate || null,
        applicant_document_valid_until: formData.applicant.documentValidUntil || null,
        applicant_phone: formData.applicant.phone || null,
        applicant_email: formData.applicant.email || null,
        applicant_bank: formData.applicant.bank || null,
        // Spolužadatel
        co_applicant_title: formData.coApplicant.title || null,
        co_applicant_first_name: formData.coApplicant.firstName || null,
        co_applicant_last_name: formData.coApplicant.lastName || null,
        co_applicant_birth_number: formData.coApplicant.birthNumber || null,
        co_applicant_age: formData.coApplicant.age || null,
        co_applicant_marital_status: formData.coApplicant.maritalStatus || null,
        co_applicant_permanent_address: formData.coApplicant.permanentAddress || null,
        co_applicant_contact_address: formData.coApplicant.contactAddress || null,
        co_applicant_document_type: formData.coApplicant.documentType || null,
        co_applicant_document_number: formData.coApplicant.documentNumber || null,
        co_applicant_document_issue_date: formData.coApplicant.documentIssueDate || null,
        co_applicant_document_valid_until: formData.coApplicant.documentValidUntil || null,
        co_applicant_phone: formData.coApplicant.phone || null,
        co_applicant_email: formData.coApplicant.email || null,
        co_applicant_bank: formData.coApplicant.bank || null,
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (clientError) {
        return { data: null, error: clientError }
      }

      // Vytvoření zaměstnavatele
      if (formData.applicantEmployer && Object.keys(formData.applicantEmployer).length > 0) {
        const employerData = {
          client_id: client.id,
          ico: formData.applicantEmployer.ico || null,
          company_name: formData.applicantEmployer.companyName || null,
          company_address: formData.applicantEmployer.companyAddress || null,
          net_income: formData.applicantEmployer.netIncome ? parseFloat(formData.applicantEmployer.netIncome) : null,
          employer_type: 'applicant'
        }

        await supabase.from('employers').insert(employerData)
      }

      // Vytvoření zaměstnavatele spolužadatele
      if (formData.coApplicantEmployer && Object.keys(formData.coApplicantEmployer).length > 0) {
        const coEmployerData = {
          client_id: client.id,
          ico: formData.coApplicantEmployer.ico || null,
          company_name: formData.coApplicantEmployer.companyName || null,
          company_address: formData.coApplicantEmployer.companyAddress || null,
          net_income: formData.coApplicantEmployer.netIncome ? parseFloat(formData.coApplicantEmployer.netIncome) : null,
          employer_type: 'co_applicant'
        }

        await supabase.from('employers').insert(coEmployerData)
      }

      // Vytvoření nemovitosti
      if (formData.property && Object.keys(formData.property).length > 0) {
        const propertyData = {
          client_id: client.id,
          address: formData.property.address || null,
          price: formData.property.price ? parseFloat(formData.property.price) : null,
        }

        await supabase.from('properties').insert(propertyData)
      }

      // Vytvoření dětí
      const allChildren = [
        ...(formData.applicant.children || []).map((child: any) => ({
          ...child,
          parent_type: 'applicant'
        })),
        ...(formData.coApplicant.children || []).map((child: any) => ({
          ...child,
          parent_type: 'co_applicant'
        }))
      ]

      if (allChildren.length > 0) {
        const childrenData = allChildren.map((child: any) => ({
          client_id: client.id,
          parent_type: child.parent_type,
          name: child.name,
          birth_date: child.birthDate || null,
          age: child.age || null,
        }))

        await supabase.from('children').insert(childrenData)
      }

      // Vytvoření závazků
      if (formData.liabilities && formData.liabilities.length > 0) {
        const liabilitiesData = formData.liabilities.map((liability: any) => ({
          client_id: client.id,
          institution: liability.institution || null,
          type: liability.type || null,
          amount: liability.amount ? parseFloat(liability.amount) : null,
          payment: liability.payment ? parseFloat(liability.payment) : null,
          balance: liability.balance ? parseFloat(liability.balance) : null,
        }))

        await supabase.from('liabilities').insert(liabilitiesData)
      }

      return { data: client, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async updateClient(clientId: string, formData: ClientFormData): Promise<{ data: Client | null; error: any }> {
    try {
      // Aktualizace klienta
      const clientData = {
        // Žadatel
        applicant_title: formData.applicant.title || null,
        applicant_first_name: formData.applicant.firstName || null,
        applicant_last_name: formData.applicant.lastName || null,
        applicant_birth_number: formData.applicant.birthNumber || null,
        applicant_age: formData.applicant.age || null,
        applicant_marital_status: formData.applicant.maritalStatus || null,
        applicant_permanent_address: formData.applicant.permanentAddress || null,
        applicant_contact_address: formData.applicant.contactAddress || null,
        applicant_document_type: formData.applicant.documentType || null,
        applicant_document_number: formData.applicant.documentNumber || null,
        applicant_document_issue_date: formData.applicant.documentIssueDate || null,
        applicant_document_valid_until: formData.applicant.documentValidUntil || null,
        applicant_phone: formData.applicant.phone || null,
        applicant_email: formData.applicant.email || null,
        applicant_bank: formData.applicant.bank || null,
        // Spolužadatel
        co_applicant_title: formData.coApplicant.title || null,
        co_applicant_first_name: formData.coApplicant.firstName || null,
        co_applicant_last_name: formData.coApplicant.lastName || null,
        co_applicant_birth_number: formData.coApplicant.birthNumber || null,
        co_applicant_age: formData.coApplicant.age || null,
        co_applicant_marital_status: formData.coApplicant.maritalStatus || null,
        co_applicant_permanent_address: formData.coApplicant.permanentAddress || null,
        co_applicant_contact_address: formData.coApplicant.contactAddress || null,
        co_applicant_document_type: formData.coApplicant.documentType || null,
        co_applicant_document_number: formData.coApplicant.documentNumber || null,
        co_applicant_document_issue_date: formData.coApplicant.documentIssueDate || null,
        co_applicant_document_valid_until: formData.coApplicant.documentValidUntil || null,
        co_applicant_phone: formData.coApplicant.phone || null,
        co_applicant_email: formData.coApplicant.email || null,
        co_applicant_bank: formData.coApplicant.bank || null,
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .select()
        .single()

      if (clientError) {
        return { data: null, error: clientError }
      }

      // Smazání a znovu vytvoření souvisejících dat
      await supabase.from('employers').delete().eq('client_id', clientId)
      await supabase.from('properties').delete().eq('client_id', clientId)
      await supabase.from('children').delete().eq('client_id', clientId)
      await supabase.from('liabilities').delete().eq('client_id', clientId)

      // Znovu vytvoření dat (stejný kód jako v createClient)
      if (formData.applicantEmployer && Object.keys(formData.applicantEmployer).length > 0) {
        const employerData = {
          client_id: clientId,
          ico: formData.applicantEmployer.ico || null,
          company_name: formData.applicantEmployer.companyName || null,
          company_address: formData.applicantEmployer.companyAddress || null,
          net_income: formData.applicantEmployer.netIncome ? parseFloat(formData.applicantEmployer.netIncome) : null,
          employer_type: 'applicant'
        }
        await supabase.from('employers').insert(employerData)
      }

      if (formData.coApplicantEmployer && Object.keys(formData.coApplicantEmployer).length > 0) {
        const coEmployerData = {
          client_id: clientId,
          ico: formData.coApplicantEmployer.ico || null,
          company_name: formData.coApplicantEmployer.companyName || null,
          company_address: formData.coApplicantEmployer.companyAddress || null,
          net_income: formData.coApplicantEmployer.netIncome ? parseFloat(formData.coApplicantEmployer.netIncome) : null,
          employer_type: 'co_applicant'
        }
        await supabase.from('employers').insert(coEmployerData)
      }

      if (formData.property && Object.keys(formData.property).length > 0) {
        const propertyData = {
          client_id: clientId,
          address: formData.property.address || null,
          price: formData.property.price ? parseFloat(formData.property.price) : null,
        }
        await supabase.from('properties').insert(propertyData)
      }

      const allChildren = [
        ...(formData.applicant.children || []).map((child: any) => ({
          ...child,
          parent_type: 'applicant'
        })),
        ...(formData.coApplicant.children || []).map((child: any) => ({
          ...child,
          parent_type: 'co_applicant'
        }))
      ]

      if (allChildren.length > 0) {
        const childrenData = allChildren.map((child: any) => ({
          client_id: clientId,
          parent_type: child.parent_type,
          name: child.name,
          birth_date: child.birthDate || null,
          age: child.age || null,
        }))
        await supabase.from('children').insert(childrenData)
      }

      if (formData.liabilities && formData.liabilities.length > 0) {
        const liabilitiesData = formData.liabilities.map((liability: any) => ({
          client_id: clientId,
          institution: liability.institution || null,
          type: liability.type || null,
          amount: liability.amount ? parseFloat(liability.amount) : null,
          payment: liability.payment ? parseFloat(liability.payment) : null,
          balance: liability.balance ? parseFloat(liability.balance) : null,
        }))
        await supabase.from('liabilities').insert(liabilitiesData)
      }

      return { data: client, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async getClients(): Promise<{ data: any[] | null; error: any }> {
    try {
      // Kontrola připojení k Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('User auth error:', userError);
        return { data: null, error: userError }
      }
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          employers (*),
          properties (*),
          children (*),
          liabilities (*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', error);
        return { data: null, error };
      }

      return { data, error }
    } catch (error) {
      console.error('Client service error:', error);
      return { data: null, error }
    }
  }

  static async getClient(id: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          employers (*),
          properties (*),
          children (*),
          liabilities (*)
        `)
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async deleteClient(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}