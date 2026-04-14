import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ycyxmvzilzkusecpgvbi.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeXhtdnppbHprdXNlY3BndmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODQwNjksImV4cCI6MjA5MTc2MDA2OX0.as76sOhSW3Mgj2lWHoLantQUSHvWJA2nZmMn70YnJCY";
  _client = createClient(url, key);
  return _client;
}

/** Lazy-initialized Supabase client — safe for SSR/prerender */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

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
