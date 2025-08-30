import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side Supabase client with no auth initialization
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export interface SharedGridState {
  id?: string;
  share_id: string;
  rows: number;
  cols: number;
  cell_data: Record<string, { url: string; isEditing: boolean }>;
  state_hash: string;
  type: string;
  created_at?: string;
}
