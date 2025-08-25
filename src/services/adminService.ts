import { supabase } from '../lib/supabase'
import type { AdminList, AppSetting } from '../lib/supabase'

type ServiceResult<T> = { data: T | null; error: unknown | null };

export class AdminService {
  static async getAdminLists(): Promise<ServiceResult<AdminList[]>> {
    try {
      const { data, error } = await supabase
        .from('admin_lists')
        .select('*')
        .order('list_type');

      return { data: data ?? null, error: error ?? null };
    } catch (err) {
      return { data: null, error: err ?? null };
    }
  }

  static async updateAdminList(listType: string, items: string[]): Promise<ServiceResult<AdminList>> {
    try {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      const user = (authData && (authData as any).user) || null;
      if (userError || !user) {
        return { data: null, error: 'Uživatel není přihlášen' };
      }

      // Použijeme upsert s onConflict na list_type, aby se záznam vložil pokud neexistuje
      const { data, error } = await supabase
        .from('admin_lists')
        .upsert(
          {
            list_type: listType,
            items,
            updated_by: user.id
          },
          { onConflict: 'list_type' }
        )
        .select()
        .single();

      return { data: data ?? null, error: error ?? null };
    } catch (err) {
      return { data: null, error: err ?? null };
    }
  }

  static async getAppSettings(): Promise<ServiceResult<AppSetting[]>> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      return { data: data ?? null, error: error ?? null };
    } catch (err) {
      return { data: null, error: err ?? null };
    }
  }

  static async updateAppSetting(key: string, value: unknown): Promise<ServiceResult<AppSetting>> {
    try {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      const user = (authData && (authData as any).user) || null;
      if (userError || !user) {
        return { data: null, error: 'Uživatel není přihlášen' };
      }

      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_by: user.id
        })
        .select()
        .single();

      return { data: data ?? null, error: error ?? null };
    } catch (err) {
      return { data: null, error: err ?? null };
    }
  }
}