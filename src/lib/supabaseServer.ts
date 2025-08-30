import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side Supabase client (same config but explicitly for server use)
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

export interface SharedGridState {
  id?: string;
  share_id: string;
  rows: number;
  cols: number;
  cell_data: Record<string, { url: string; isEditing: boolean }>;
  state_hash: string;
  created_at?: string;
}
