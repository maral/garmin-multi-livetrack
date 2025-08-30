import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create client-side Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence for this app
    detectSessionInUrl: false, // Disable URL session detection
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
