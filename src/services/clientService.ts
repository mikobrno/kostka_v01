import { supabase } from '../lib/supabase'
import type { Client, Employer, Property, Child, Liability } from '../lib/supabase'

export interface ClientFormData {
  applicant: any
  coApplicant: any
  employer: {
    applicant?: any
    coApplicant?: any
  }
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
        applicant_maiden_name: formData.applicant.maidenName || null,
        applicant_birth_number: formData.applicant.birthNumber || null,
        applicant_housing_type: formData.applicant.housingType || null,
        applicant_age: formData.applicant.age || null,
        applicant_birth_year: formData.applicant.birthYear || null,
        applicant_birth_date: formData.applicant.birthDate || null,
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
        applicant_education: formData.applicant.education || null,
        // Spolužadatel
        co_applicant_title: formData.coApplicant.title || null,
        co_applicant_first_name: formData.coApplicant.firstName || null,
        co_applicant_last_name: formData.coApplicant.lastName || null,
        co_applicant_maiden_name: formData.coApplicant.maidenName || null,
        co_applicant_birth_number: formData.coApplicant.birthNumber || null,
        co_applicant_age: formData.coApplicant.age || null,
        co_applicant_birth_year: formData.coApplicant.birthYear || null,
        co_applicant_birth_date: formData.coApplicant.birthDate || null,
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
        co_applicant_education: formData.coApplicant.education || null,
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
      if (formData.employer?.applicant && Object.keys(formData.employer.applicant).length > 0) {
        const employerData = {
          client_id: client.id,
          ico: formData.employer.applicant.ico || null,
          company_name: formData.employer.applicant.companyName || null,
          company_address: formData.employer.applicant.companyAddress || null,
          net_income: formData.employer.applicant.netIncome ? parseFloat(formData.employer.applicant.netIncome) : null,
          job_position: formData.employer.applicant.jobPosition || null,
          employed_since: formData.employer.applicant.employedSince || null,
          contract_type: formData.employer.applicant.contractType || null,
          contract_from_date: formData.employer.applicant.contractFromDate || null,
          contract_to_date: formData.employer.applicant.contractToDate || null,
          contract_extended: formData.employer.applicant.contractExtended || null,
          employer_type: 'applicant'
        }
        await supabase.from('employers').insert(employerData)
      }

      if (formData.employer?.coApplicant && Object.keys(formData.employer.coApplicant).length > 0) {
        const coEmployerData = {
          client_id: client.id,
          ico: formData.employer.coApplicant.ico || null,
          company_name: formData.employer.coApplicant.companyName || null,
          company_address: formData.employer.coApplicant.companyAddress || null,
          net_income: formData.employer.coApplicant.netIncome ? parseFloat(formData.employer.coApplicant.netIncome) : null,
          job_position: formData.employer.coApplicant.jobPosition || null,
          employed_since: formData.employer.coApplicant.employedSince || null,
          contract_type: formData.employer.coApplicant.contractType || null,
          contract_from_date: formData.employer.coApplicant.contractFromDate || null,
          contract_to_date: formData.employer.coApplicant.contractToDate || null,
          contract_extended: formData.employer.coApplicant.contractExtended || null,
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

      // Vytvoření podnikání
      const allBusinesses = [
        ...(formData.applicant.businesses || []).map((business: any) => ({
          ...business,
          parent_type: 'applicant'
        })),
        ...(formData.coApplicant.businesses || []).map((business: any) => ({
          ...business,
          parent_type: 'co_applicant'
        }))
      ]

      if (allBusinesses.length > 0) {
        const businessesData = allBusinesses.map((business: any) => ({
          client_id: client.id,
          parent_type: business.parent_type,
          ico: business.ico || null,
          company_name: business.companyName || null,
          company_address: business.companyAddress || null,
          business_start_date: business.businessStartDate || null,
        }))

        await supabase.from('businesses').insert(businessesData)
      }

      // Vytvoření dokladů totožnosti
      const allDocuments = [
        ...(formData.applicant.documents || []).map((document: any) => ({
          ...document,
          parent_type: 'applicant'
        })),
        ...(formData.coApplicant.documents || []).map((document: any) => ({
          ...document,
          parent_type: 'co_applicant'
        }))
      ]

      if (allDocuments.length > 0) {
        const documentsData = allDocuments.map((document: any) => ({
          client_id: client.id,
          parent_type: document.parent_type,
          document_type: document.documentType || null,
          document_number: document.documentNumber || null,
          document_issue_date: document.documentIssueDate || null,
          document_valid_until: document.documentValidUntil || null,
          issuing_authority: document.issuingAuthority || null,
          place_of_birth: document.placeOfBirth || null,
          control_number: document.controlNumber || null,
        }))

        await supabase.from('documents').insert(documentsData)
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
          poznamky: liability.poznamky || null,
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
        applicant_maiden_name: formData.applicant.maidenName || null,
        applicant_birth_number: formData.applicant.birthNumber || null,
        applicant_housing_type: formData.applicant.housingType || null,
        applicant_age: formData.applicant.age || null,
        applicant_birth_year: formData.applicant.birthYear || null,
        applicant_birth_date: formData.applicant.birthDate || null,
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
        applicant_education: formData.applicant.education || null,
        // Spolužadatel
        co_applicant_title: formData.coApplicant.title || null,
        co_applicant_first_name: formData.coApplicant.firstName || null,
        co_applicant_last_name: formData.coApplicant.lastName || null,
        co_applicant_maiden_name: formData.coApplicant.maidenName || null,
        co_applicant_birth_number: formData.coApplicant.birthNumber || null,
        co_applicant_age: formData.coApplicant.age || null,
        co_applicant_birth_year: formData.coApplicant.birthYear || null,
        co_applicant_birth_date: formData.coApplicant.birthDate || null,
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
        co_applicant_education: formData.coApplicant.education || null,
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
      await supabase.from('businesses').delete().eq('client_id', clientId)
      await supabase.from('documents').delete().eq('client_id', clientId)
      await supabase.from('liabilities').delete().eq('client_id', clientId)

      // Znovu vytvoření dat (stejný kód jako v createClient)
      if (formData.employer?.applicant && Object.keys(formData.employer.applicant).length > 0) {
        const employerData = {
          client_id: clientId,
          ico: formData.employer.applicant.ico || null,
          company_name: formData.employer.applicant.companyName || null,
          company_address: formData.employer.applicant.companyAddress || null,
          net_income: formData.employer.applicant.netIncome ? parseFloat(formData.employer.applicant.netIncome) : null,
          job_position: formData.employer.applicant.jobPosition || null,
          employed_since: formData.employer.applicant.employedSince || null,
          contract_type: formData.employer.applicant.contractType || null,
          contract_from_date: formData.employer.applicant.contractFromDate || null,
          contract_to_date: formData.employer.applicant.contractToDate || null,
          contract_extended: formData.employer.applicant.contractExtended || null,
          employer_type: 'applicant'
        }
        await supabase.from('employers').insert(employerData)
      }

      if (formData.employer?.coApplicant && Object.keys(formData.employer.coApplicant).length > 0) {
        const coEmployerData = {
          client_id: clientId,
          ico: formData.employer.coApplicant.ico || null,
          company_name: formData.employer.coApplicant.companyName || null,
          company_address: formData.employer.coApplicant.companyAddress || null,
          net_income: formData.employer.coApplicant.netIncome ? parseFloat(formData.employer.coApplicant.netIncome) : null,
          job_position: formData.employer.coApplicant.jobPosition || null,
          employed_since: formData.employer.coApplicant.employedSince || null,
          contract_type: formData.employer.coApplicant.contractType || null,
          contract_from_date: formData.employer.coApplicant.contractFromDate || null,
          contract_to_date: formData.employer.coApplicant.contractToDate || null,
          contract_extended: formData.employer.coApplicant.contractExtended || null,
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

      // Vytvoření podnikání
      const allBusinesses = [
        ...(formData.applicant.businesses || []).map((business: any) => ({
          ...business,
          parent_type: 'applicant'
        })),
        ...(formData.coApplicant.businesses || []).map((business: any) => ({
          ...business,
          parent_type: 'co_applicant'
        }))
      ]

      if (allBusinesses.length > 0) {
        const businessesData = allBusinesses.map((business: any) => ({
          client_id: clientId,
          parent_type: business.parent_type,
          ico: business.ico || null,
          company_name: business.companyName || null,
          company_address: business.companyAddress || null,
          business_start_date: business.businessStartDate || null,
        }))
        await supabase.from('businesses').insert(businessesData)
      }

      // Znovu vytvoření dokladů totožnosti
      const allDocuments = [
        ...(formData.applicant.documents || []).map((document: any) => ({
          ...document,
          parent_type: 'applicant'
        })),
        ...(formData.coApplicant.documents || []).map((document: any) => ({
          ...document,
          parent_type: 'co_applicant'
        }))
      ]

      if (allDocuments.length > 0) {
        const documentsData = allDocuments.map((document: any) => ({
          client_id: clientId,
          parent_type: document.parent_type,
          document_type: document.documentType || null,
          document_number: document.documentNumber || null,
          document_issue_date: document.documentIssueDate || null,
          document_valid_until: document.documentValidUntil || null,
          issuing_authority: document.issuingAuthority || null,
          place_of_birth: document.placeOfBirth || null,
          control_number: document.controlNumber || null,
        }))
        await supabase.from('documents').insert(documentsData)
      }

      if (formData.liabilities && formData.liabilities.length > 0) {
        const liabilitiesData = formData.liabilities.map((liability: any) => ({
          client_id: clientId,
          institution: liability.institution || null,
          type: liability.type || null,
          amount: liability.amount ? parseFloat(liability.amount) : null,
          payment: liability.payment ? parseFloat(liability.payment) : null,
          balance: liability.balance ? parseFloat(liability.balance) : null,
          poznamky: liability.poznamky || null,
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
          businesses (*),
          documents (*),
          liabilities (*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', error);
        return { data: null, error };
      }

      // Transformace dat pro frontend (převod snake_case na camelCase)
      const transformedData = data?.map((client: any) => ({
        ...client,
        // Transformace dětí
        children: client.children?.map((child: any) => ({
          ...child,
          birthDate: child.birth_date,
          parentType: child.parent_type
        })) || [],
        // Transformace podnikání
        businesses: client.businesses?.map((business: any) => ({
          ...business,
          companyName: business.company_name,
          companyAddress: business.company_address,
          businessStartDate: business.business_start_date,
          parentType: business.parent_type
        })) || [],
        // Transformace dokladů totožnosti
        documents: client.documents?.map((document: any) => ({
          ...document,
          documentType: document.document_type,
          documentNumber: document.document_number,
          documentIssueDate: document.document_issue_date,
          documentValidUntil: document.document_valid_until,
          issuingAuthority: document.issuing_authority,
          placeOfBirth: document.place_of_birth,
          controlNumber: document.control_number,
          parentType: document.parent_type
        })) || []
      })) || []

      return { data: transformedData, error: null }
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
          businesses (*),
          documents (*),
          liabilities (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error }
      }

      // Transformace dat pro frontend (převod snake_case na camelCase)
      const transformedData = {
        ...data,
        // Transformace údajů žadatele
        applicant: {
          title: data.applicant_title,
          firstName: data.applicant_first_name,
          lastName: data.applicant_last_name,
          maidenName: data.applicant_maiden_name,
          birthNumber: data.applicant_birth_number,
          housingType: data.applicant_housing_type,
          age: data.applicant_age,
          birthYear: data.applicant_birth_year,
          birthDate: data.applicant_birth_date,
          maritalStatus: data.applicant_marital_status,
          permanentAddress: data.applicant_permanent_address,
          contactAddress: data.applicant_contact_address,
          documentType: data.applicant_document_type,
          documentNumber: data.applicant_document_number,
          documentIssueDate: data.applicant_document_issue_date,
          documentValidUntil: data.applicant_document_valid_until,
          phone: data.applicant_phone,
          email: data.applicant_email,
          bank: data.applicant_bank,
          education: data.applicant_education,
          citizenship: data.applicant_citizenship,
          children: data.children?.filter((child: any) => child.parent_type === 'applicant') || [],
          businesses: data.businesses?.filter((business: any) => business.parent_type === 'applicant') || [],
          documents: data.documents?.filter((document: any) => document.parent_type === 'applicant') || []
        },
        // Transformace údajů spolužadatele
        coApplicant: {
          title: data.co_applicant_title,
          firstName: data.co_applicant_first_name,
          lastName: data.co_applicant_last_name,
          maidenName: data.co_applicant_maiden_name,
          birthNumber: data.co_applicant_birth_number,
          age: data.co_applicant_age,
          birthYear: data.co_applicant_birth_year,
          birthDate: data.co_applicant_birth_date,
          maritalStatus: data.co_applicant_marital_status,
          permanentAddress: data.co_applicant_permanent_address,
          contactAddress: data.co_applicant_contact_address,
          documentType: data.co_applicant_document_type,
          documentNumber: data.co_applicant_document_number,
          documentIssueDate: data.co_applicant_document_issue_date,
          documentValidUntil: data.co_applicant_document_valid_until,
          phone: data.co_applicant_phone,
          email: data.co_applicant_email,
          bank: data.co_applicant_bank,
          education: data.co_applicant_education,
          citizenship: data.co_applicant_citizenship,
          children: data.children?.filter((child: any) => child.parent_type === 'co_applicant') || [],
          businesses: data.businesses?.filter((business: any) => business.parent_type === 'co_applicant') || [],
          documents: data.documents?.filter((document: any) => document.parent_type === 'co_applicant') || []
        }
      }

      return { data: transformedData, error: null }
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