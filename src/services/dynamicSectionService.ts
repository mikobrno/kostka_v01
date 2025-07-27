import { supabase } from '../lib/supabase';

export interface DynamicSectionContent {
  notes?: string;
  links?: Array<{
    id: string;
    url: string;
    title?: string;
  }>;
  basicParameters?: {
    financingPurpose?: string;
    requestedLoanAmount?: number;
    propertyValue?: number;
    maturityYears?: number;
    preferredFixationYears?: number;
  };
  files?: Array<{
    id: string;
    name: string;
    originalName: string;
    size: number;
    type: string;
    url: string;
    path: string;
    uploadedAt: string;
  }>;
  generalFields?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

export interface DynamicSection {
  id: string;
  client_id: string;
  section_name: string;
  order_index: number;
  content: DynamicSectionContent;
  created_at: string;
  updated_at: string;
}

export class DynamicSectionService {
  /**
   * Fetches all dynamic sections for a client
   */
  static async getDynamicSections(clientId: string): Promise<{ data: DynamicSection[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('client_dynamic_sections')
        .select('*')
        .eq('client_id', clientId)
        .order('order_index', { ascending: true });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Creates a new dynamic section
   */
  static async createDynamicSection(
    clientId: string, 
    sectionName: string, 
    orderIndex: number
  ): Promise<{ data: DynamicSection | null; error: any }> {
    try {
      const defaultContent: DynamicSectionContent = {
        notes: '',
        links: [],
        basicParameters: {},
        files: [],
        generalFields: []
      };

      const { data, error } = await supabase
        .from('client_dynamic_sections')
        .insert({
          client_id: clientId,
          section_name: sectionName,
          order_index: orderIndex,
          content: defaultContent
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Updates an existing dynamic section
   */
  static async updateDynamicSection(
    sectionId: string,
    updates: {
      section_name?: string;
      content?: DynamicSectionContent;
      order_index?: number;
    }
  ): Promise<{ data: DynamicSection | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('client_dynamic_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Deletes a dynamic section
   */
  static async deleteDynamicSection(sectionId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('client_dynamic_sections')
        .delete()
        .eq('id', sectionId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Reorders dynamic sections
   */
  static async reorderSections(
    sections: Array<{ id: string; order_index: number }>
  ): Promise<{ error: any }> {
    try {
      const updates = sections.map(section => 
        supabase
          .from('client_dynamic_sections')
          .update({ order_index: section.order_index })
          .eq('id', section.id)
      );

      await Promise.all(updates);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Gets the next order index for a new section
   */
  static async getNextOrderIndex(clientId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('client_dynamic_sections')
        .select('order_index')
        .eq('client_id', clientId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return 0;
      }

      return data[0].order_index + 1;
    } catch (error) {
      return 0;
    }
  }
}