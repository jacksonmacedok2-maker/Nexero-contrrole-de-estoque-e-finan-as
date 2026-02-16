
import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas para integração direta
const supabaseUrl = 'https://sbozssdnqccvflfuxqnj.supabase.co';
const supabaseAnonKey = 'sb_publishable_Umku-rbOaAJBgHRSJ4Cp3g_mKU9Ykwn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
