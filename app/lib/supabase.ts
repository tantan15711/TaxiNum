import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DriverProfile = {
  id?: string;
  user_id?: string;
  public_slug: string;
  display_name: string;
  avatar_url: string | null;
  transfer_number: string;
  phone_number: string;
  show_phone: boolean;
  is_public: boolean;
  terms_accepted_at?: string | null;
  updated_at?: string | null;
};

const defaultSupabaseUrl = "https://zruhqmpfpihdyebrjqef.supabase.co";
const defaultSupabasePublishableKey =
  "sb_publishable_4ZEWx37JbaENJ3JlZmGi_Q_4torUIOo";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? defaultSupabaseUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? defaultSupabasePublishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
