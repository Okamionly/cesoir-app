// ========================================
// CeSoir Supabase Database Types — hand-written canonical types
// ========================================
//
// NOTE: A freshly generated types file lives at
//   `src/lib/supabase-types.generated.ts`
// That file is the source-of-truth for table column types. To regenerate:
//   npx supabase gen types typescript --project-id ycyxmvzilzkusecpgvbi \
//     > src/lib/supabase-types.generated.ts
//
// This file is kept because it also exports domain enums (Gender,
// InteractionAction, ModeType, etc.) and aliased row types (DbProfile,
// DbFeedActivity, ...) used throughout the app. A later refactor could
// migrate callers to `Database["public"]["Tables"]["X"]["Row"]` from the
// generated file and remove this hand-written layer.

// ----------------------------------------
// Enums / Union Types
// ----------------------------------------

export type Gender = "homme" | "femme" | "autre";
export type LookingFor = "hommes" | "femmes" | "tous";
export type InteractionAction = "like" | "pass" | "superlike" | "report" | "block";
export type ReportReason =
  | "fake_profile"
  | "harassment"
  | "inappropriate_content"
  | "spam"
  | "underage"
  | "scam"
  | "other";
export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";
export type ModeType =
  | "solo-diner"
  | "plus-one"
  | "tourist"
  | "night-owl"
  | "breakup"
  | "new-in-town"
  | "langue"
  | "dog-date"
  | "seasonal";
export type SquadStatus = "active" | "full" | "closed";
export type FeedActivityType = "availability" | "looking" | "area" | "trending";
export type CheckinStatus = "active" | "safe" | "alert";

// ----------------------------------------
// Existing Tables
// ----------------------------------------

export interface DbProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  looking_for: LookingFor;
  bio: string;
  avatar_url: string | null;
  location: unknown;
  city: string;
  is_online: boolean;
  is_verified: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface DbModeActivation {
  id: string;
  user_id: string;
  mode: ModeType;
  is_active: boolean;
  available_time: string;
  details: Record<string, unknown>;
  expires_at: string;
  created_at: string;
}

export interface DbInteraction {
  id: string;
  from_user: string;
  to_user: string;
  action: InteractionAction;
  mode: string | null;
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

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface DbReview {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  conversation_id: string | null;
  rating: number; // 1-5
  tags: string[];
  comment: string;
  mode: string | null;
  anonymous: boolean;
  created_at: string;
}

export interface DbReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  created_at: string;
}

// ----------------------------------------
// New Feature Tables (Migration 002)
// ----------------------------------------

export interface DbSquad {
  id: string;
  name: string;
  creator_id: string;
  members: string[];
  mode: string | null;
  status: SquadStatus;
  created_at: string;
}

export interface DbSquadInvite {
  id: string;
  squad_id: string;
  inviter_id: string;
  code: string; // 6 chars unique
  used_by: string | null;
  created_at: string;
}

export interface DbFeedActivity {
  id: string;
  user_id: string;
  type: FeedActivityType;
  content: string;
  mode: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface DbChallenge {
  id: string;
  user_id: string;
  challenge_type: string;
  progress: number;
  total: number;
  completed: boolean;
  xp_earned: number;
  date: string;
}

export interface DbAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  earned_at: string;
}

export interface DbKarmaTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface DbStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export interface DbPopupEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  mode: string | null;
  lat: number | null;
  lng: number | null;
  venue: string;
  event_time: string;
  max_attendees: number;
  tags: string[];
  created_at: string;
}

export interface DbEventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
}

export interface DbTrustedContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  share_location: boolean;
  alert_no_checkin: boolean;
  share_route: boolean;
}

export interface DbCheckin {
  id: string;
  user_id: string;
  conversation_id: string | null;
  status: CheckinStatus;
  started_at: string;
  last_checkin_at: string;
}

export interface DbUserSettings {
  id: string;
  user_id: string;
  smart_notifications: boolean;
  mode_alerts: boolean;
  match_alerts: boolean;
  chat_messages: boolean;
  personality_type: string | null;
  onboarding_completed: boolean;
}

export interface DbAvailability {
  id: string;
  user_id: string;
  day_of_week: number; // 0-6
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  repeat_weekly: boolean;
}

// ----------------------------------------
// Matches View
// ----------------------------------------

export interface DbMatch {
  user_a: string;
  user_b: string;
  mode: string | null;
  matched_at: string;
}

// ----------------------------------------
// Database Type (Supabase-compatible)
// ----------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DbProfile;
        Insert: Partial<DbProfile> & Pick<DbProfile, "id" | "name" | "age" | "gender" | "looking_for">;
        Update: Partial<DbProfile>;
      };
      mode_activations: {
        Row: DbModeActivation;
        Insert: Partial<DbModeActivation> & Pick<DbModeActivation, "user_id" | "mode">;
        Update: Partial<DbModeActivation>;
      };
      interactions: {
        Row: DbInteraction;
        Insert: Partial<DbInteraction> & Pick<DbInteraction, "from_user" | "to_user" | "action">;
        Update: Partial<DbInteraction>;
      };
      conversations: {
        Row: DbConversation;
        Insert: Partial<DbConversation> & Pick<DbConversation, "user_a" | "user_b">;
        Update: Partial<DbConversation>;
      };
      messages: {
        Row: DbMessage;
        Insert: Partial<DbMessage> & Pick<DbMessage, "conversation_id" | "sender_id" | "content">;
        Update: Partial<DbMessage>;
      };
      reviews: {
        Row: DbReview;
        Insert: Partial<DbReview> & Pick<DbReview, "reviewer_id" | "reviewed_id" | "rating">;
        Update: Partial<DbReview>;
      };
      reports: {
        Row: DbReport;
        Insert: Partial<DbReport> & Pick<DbReport, "reporter_id" | "reported_id" | "reason">;
        Update: Partial<DbReport>;
      };
      squads: {
        Row: DbSquad;
        Insert: Partial<DbSquad> & Pick<DbSquad, "name" | "creator_id">;
        Update: Partial<DbSquad>;
      };
      squad_invites: {
        Row: DbSquadInvite;
        Insert: Partial<DbSquadInvite> & Pick<DbSquadInvite, "squad_id" | "inviter_id" | "code">;
        Update: Partial<DbSquadInvite>;
      };
      feed_activities: {
        Row: DbFeedActivity;
        Insert: Partial<DbFeedActivity> & Pick<DbFeedActivity, "user_id" | "type">;
        Update: Partial<DbFeedActivity>;
      };
      challenges: {
        Row: DbChallenge;
        Insert: Partial<DbChallenge> & Pick<DbChallenge, "user_id" | "challenge_type" | "total">;
        Update: Partial<DbChallenge>;
      };
      achievements: {
        Row: DbAchievement;
        Insert: Partial<DbAchievement> & Pick<DbAchievement, "user_id" | "achievement_key">;
        Update: Partial<DbAchievement>;
      };
      karma_transactions: {
        Row: DbKarmaTransaction;
        Insert: Partial<DbKarmaTransaction> & Pick<DbKarmaTransaction, "user_id" | "amount">;
        Update: Partial<DbKarmaTransaction>;
      };
      streaks: {
        Row: DbStreak;
        Insert: Partial<DbStreak> & Pick<DbStreak, "user_id">;
        Update: Partial<DbStreak>;
      };
      popup_events: {
        Row: DbPopupEvent;
        Insert: Partial<DbPopupEvent> & Pick<DbPopupEvent, "creator_id" | "title" | "event_time">;
        Update: Partial<DbPopupEvent>;
      };
      event_attendees: {
        Row: DbEventAttendee;
        Insert: Partial<DbEventAttendee> & Pick<DbEventAttendee, "event_id" | "user_id">;
        Update: Partial<DbEventAttendee>;
      };
      trusted_contacts: {
        Row: DbTrustedContact;
        Insert: Partial<DbTrustedContact> & Pick<DbTrustedContact, "user_id" | "name" | "phone">;
        Update: Partial<DbTrustedContact>;
      };
      checkins: {
        Row: DbCheckin;
        Insert: Partial<DbCheckin> & Pick<DbCheckin, "user_id">;
        Update: Partial<DbCheckin>;
      };
      user_settings: {
        Row: DbUserSettings;
        Insert: Partial<DbUserSettings> & Pick<DbUserSettings, "user_id">;
        Update: Partial<DbUserSettings>;
      };
      availability: {
        Row: DbAvailability;
        Insert: Partial<DbAvailability> & Pick<DbAvailability, "user_id" | "day_of_week">;
        Update: Partial<DbAvailability>;
      };
    };
    Views: {
      matches: {
        Row: DbMatch;
      };
    };
    Functions: {
      nearby_profiles: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_km?: number;
          mode_filter?: string | null;
          gender_filter?: string | null;
          limit_count?: number;
        };
        Returns: Array<{
          id: string;
          name: string;
          age: number;
          gender: string;
          bio: string;
          avatar_url: string | null;
          is_verified: boolean;
          distance_km: number;
          mode: string | null;
          available_time: string | null;
          mode_details: Record<string, unknown> | null;
          lat: number;
          lng: number;
        }>;
      };
      update_location: {
        Args: {
          user_id: string;
          lat: number;
          lng: number;
        };
        Returns: void;
      };
    };
  };
}
