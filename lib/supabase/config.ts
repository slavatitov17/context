import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jhcyshlxvnfwnpwuamcv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MhSVcCApPB2sGQSItVcD1g_CGkIvYpo';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Клиент для клиентской стороны (браузер)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Типы для таблиц
export interface Project {
  id: string;
  name: string;
  description: string;
  members?: string;
  user_id: string;
  files?: any[];
  messages?: any[];
  created_at: string;
  updated_at: string;
}

