export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      item_events: {
        Row: {
          actor: string | null
          created_at: string
          from_value: string | null
          id: string
          item_id: string
          payload: Json | null
          to_value: string | null
          type: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          from_value?: string | null
          id?: string
          item_id: string
          payload?: Json | null
          to_value?: string | null
          type: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          from_value?: string | null
          id?: string
          item_id?: string
          payload?: Json | null
          to_value?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_groups: {
        Row: {
          archived_at: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          archived_at?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          archived_at?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      item_types: {
        Row: {
          archived_at: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          archived_at?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          archived_at?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      items: {
        Row: {
          archived_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          group_id: string | null
          id: string
          is_recurring: boolean
          link: string | null
          name: string
          note: string | null
          owned_at: string | null
          price: number | null
          price_target: number | null
          priority: string
          purchased_at: string | null
          purchased_by: string | null
          purchased_price: number | null
          purchased_store: string | null
          quantity: number
          receipt_url: string | null
          status: string
          type_id: string | null
          updated_at: string
          updated_by: string | null
          warranty_until: string | null
        }
        Insert: {
          archived_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean
          link?: string | null
          name: string
          note?: string | null
          owned_at?: string | null
          price?: number | null
          price_target?: number | null
          priority?: string
          purchased_at?: string | null
          purchased_by?: string | null
          purchased_price?: number | null
          purchased_store?: string | null
          quantity?: number
          receipt_url?: string | null
          status?: string
          type_id?: string | null
          updated_at?: string
          updated_by?: string | null
          warranty_until?: string | null
        }
        Update: {
          archived_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean
          link?: string | null
          name?: string
          note?: string | null
          owned_at?: string | null
          price?: number | null
          price_target?: number | null
          priority?: string
          purchased_at?: string | null
          purchased_by?: string | null
          purchased_price?: number | null
          purchased_store?: string | null
          quantity?: number
          receipt_url?: string | null
          status?: string
          type_id?: string | null
          updated_at?: string
          updated_by?: string | null
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "item_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
        ]
      }
      price_checks: {
        Row: {
          checked_at: string
          created_by: string | null
          id: string
          item_id: string
          price: number
          source: string
          store: string | null
          url: string | null
        }
        Insert: {
          checked_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          price: number
          source?: string
          store?: string | null
          url?: string | null
        }
        Update: {
          checked_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          price?: number
          source?: string
          store?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_checks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      item_price_summary: {
        Row: {
          best_price: number | null
          check_count: number | null
          item_id: string | null
          latest_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_checks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

