import { supabase } from '../lib/supabase'
import type { AdminList, AppSetting } from '../lib/supabase'

export class AdminService {
  static async getAdminLists(): Promise<{ data: AdminList[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('admin_lists')
        .select('*')
        .order('list_type')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async updateAdminList(listType: string, items: string[]): Promise<{ data: AdminList | null; error: any }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { data: null, error: 'Uživatel není přihlášen' }
      }

      const { data, error } = await supabase
        .from('admin_lists')
        .update({
          items,
          updated_by: user.id
        })
        .eq('list_type', listType)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async getAppSettings(): Promise<{ data: AppSetting[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async updateAppSetting(key: string, value: any): Promise<{ data: AppSetting | null; error: any }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { data: null, error: 'Uživatel není přihlášen' }
      }

      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_by: user.id
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}