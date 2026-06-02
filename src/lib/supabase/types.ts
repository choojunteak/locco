export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_initials: string;
          avatar_url: string | null;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          display_name: string;
          avatar_initials: string;
          avatar_url?: string | null;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "blocked";
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "blocked";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
      };
      food_lists: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          color: string;
          privacy: "private" | "friends" | "public";
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string;
          color?: string;
          privacy?: "private" | "friends" | "public";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["food_lists"]["Insert"]>;
      };
      places: {
        Row: {
          id: string;
          name: string;
          address: string;
          postal_code: string | null;
          latitude: number;
          longitude: number;
          price_range: "$" | "$$" | "$$$" | "$$$$";
          notes: string;
          normalized_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          postal_code?: string | null;
          latitude: number;
          longitude: number;
          price_range: "$" | "$$" | "$$$" | "$$$$";
          notes?: string;
          normalized_key?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["places"]["Insert"]>;
      };
      saved_places: {
        Row: {
          id: string;
          list_id: string;
          place_id: string;
          user_id: string;
          note: string | null;
          status: "want_to_try" | "tried" | "favourite";
          rating: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          place_id: string;
          user_id: string;
          note?: string | null;
          status?: "want_to_try" | "tried" | "favourite";
          rating?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_places"]["Insert"]>;
      };
      place_tags: {
        Row: {
          id: string;
          place_id: string;
          tag: string;
          tag_type: "category" | "mood";
        };
        Insert: {
          id?: string;
          place_id: string;
          tag: string;
          tag_type: "category" | "mood";
        };
        Update: Partial<Database["public"]["Tables"]["place_tags"]["Insert"]>;
      };
      comments: {
        Row: {
          id: string;
          place_id: string;
          user_id: string;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          place_id: string;
          user_id: string;
          comment: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
      };
      place_sources: {
        Row: {
          id: string;
          place_id: string;
          source_type: "tiktok" | "instagram" | "website" | "manual" | "other";
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          place_id: string;
          source_type: "tiktok" | "instagram" | "website" | "manual" | "other";
          url: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["place_sources"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
