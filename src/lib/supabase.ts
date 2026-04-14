import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbProfile {
  id: string;
  name: string;
  age: number;
  gender: "homme" | "femme" | "autre";
  looking_for: "hommes" | "femmes" | "tous";
  bio: string;
  avatar_url: string | null;
  location: unknown;
  city: string;
  is_online: boolean;
  is_verified: boolean;
  last_seen: string;
  created_at: string;
}

export interface DbModeActivation {
  id: string;
  user_id: string;
  mode: string;
  is_active: boolean;
  available_time: string;
  details: Record<string, unknown>;
  expires_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface DbConversation {
  id: string;
  user_a: string;
  user_b: string;
  mode: string | null;
  last_message_at: string;
  created_at: string;
}
