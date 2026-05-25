export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      automation_messages: {
        Row: {
          automation_id: string
          body: string
          created_at: string
          delay_seconds: number
          id: string
          position: number
        }
        Insert: {
          automation_id: string
          body: string
          created_at?: string
          delay_seconds?: number
          id?: string
          position?: number
        }
        Update: {
          automation_id?: string
          body?: string
          created_at?: string
          delay_seconds?: number
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_messages_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_posts: {
        Row: {
          automation_id: string
          id: string
          ig_post_id: string
        }
        Insert: {
          automation_id: string
          id?: string
          ig_post_id: string
        }
        Update: {
          automation_id?: string
          id?: string
          ig_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_posts_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string
          id: string
          keywords: string[]
          name: string
          post_scope: Database["public"]["Enums"]["automation_post_scope"]
          status: Database["public"]["Enums"]["automation_status"]
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keywords?: string[]
          name?: string
          post_scope?: Database["public"]["Enums"]["automation_post_scope"]
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_type?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keywords?: string[]
          name?: string
          post_scope?: Database["public"]["Enums"]["automation_post_scope"]
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_type?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dm_events: {
        Row: {
          automation_id: string | null
          created_at: string
          error: string | null
          id: string
          ig_event_id: string | null
          status: Database["public"]["Enums"]["dm_event_status"]
          trigger_payload: Json | null
          user_id: string
        }
        Insert: {
          automation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          ig_event_id?: string | null
          status?: Database["public"]["Enums"]["dm_event_status"]
          trigger_payload?: Json | null
          user_id: string
        }
        Update: {
          automation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          ig_event_id?: string | null
          status?: Database["public"]["Enums"]["dm_event_status"]
          trigger_payload?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_events_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_follow_ups: {
        Row: {
          created_at: string | null
          id: string
          instagram_customer_id: string
          merchant_scoped_id: string
          status: string
          summary: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instagram_customer_id: string
          merchant_scoped_id: string
          status?: string
          summary: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instagram_customer_id?: string
          merchant_scoped_id?: string
          status?: string
          summary?: string
        }
        Relationships: []
      }
      instagram_accounts: {
        Row: {
          access_token: string
          connected_at: string
          id: string
          ig_user_id: string
          token_expires_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          id?: string
          ig_user_id: string
          token_expires_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          id?: string
          ig_user_id?: string
          token_expires_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      store_info: {
        Row: {
          id: string
          merchant_scoped_id: string
          store_name: string | null
          hours: string | null
          currency: string | null
          instagram_handle: string | null
          address: string | null
          other_info: Json | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          merchant_scoped_id: string
          store_name?: string | null
          hours?: string | null
          currency?: string | null
          instagram_handle?: string | null
          address?: string | null
          other_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          merchant_scoped_id?: string
          store_name?: string | null
          hours?: string | null
          currency?: string | null
          instagram_handle?: string | null
          address?: string | null
          other_info?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      automation_post_scope: "all" | "specific"
      automation_status: "draft" | "active" | "paused"
      automation_trigger: "comment" | "dm"
      dm_event_status: "sent" | "failed" | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      automation_post_scope: ["all", "specific"],
      automation_status: ["draft", "active", "paused"],
      automation_trigger: ["comment", "dm"],
      dm_event_status: ["sent", "failed", "skipped"],
    },
  },
} as const
