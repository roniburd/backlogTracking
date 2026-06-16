export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          field_changed: string | null
          id: number
          item_id: string | null
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          field_changed?: string | null
          id?: never
          item_id?: string | null
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          field_changed?: string | null
          id?: never
          item_id?: string | null
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "work_items_view"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author: string | null
          body: string
          created_at: string
          id: string
          work_item_id: string
        }
        Insert: {
          author?: string | null
          body: string
          created_at?: string
          id?: string
          work_item_id: string
        }
        Update: {
          author?: string | null
          body?: string
          created_at?: string
          id?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items_view"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      saved_queries: {
        Row: {
          created_at: string
          definition: Json
          id: string
          name: string
          owner: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition?: Json
          id?: string
          name: string
          owner?: string | null
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: Json
          id?: string
          name?: string
          owner?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_queries_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          is_attention: boolean
          is_default: boolean
          is_terminal: boolean
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_attention?: boolean
          is_default?: boolean
          is_terminal?: boolean
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_attention?: boolean
          is_default?: boolean
          is_terminal?: boolean
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      work_item_labels: {
        Row: {
          label_id: string
          work_item_id: string
        }
        Insert: {
          label_id: string
          work_item_id: string
        }
        Update: {
          label_id?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items_view"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          created_at: string
          created_by: string | null
          date_type: string | null
          description: string
          id: string
          last_comment_at: string | null
          last_status_change_at: string | null
          latest_update: string | null
          pm_owner: string | null
          sdm_owner: string | null
          stack_rank: number
          status_id: string | null
          target_date: string | null
          tech_lead_owner: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_type?: string | null
          description: string
          id?: string
          last_comment_at?: string | null
          last_status_change_at?: string | null
          latest_update?: string | null
          pm_owner?: string | null
          sdm_owner?: string | null
          stack_rank?: number
          status_id?: string | null
          target_date?: string | null
          tech_lead_owner?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_type?: string | null
          description?: string
          id?: string
          last_comment_at?: string | null
          last_status_change_at?: string | null
          latest_update?: string | null
          pm_owner?: string | null
          sdm_owner?: string | null
          stack_rank?: number
          status_id?: string | null
          target_date?: string | null
          tech_lead_owner?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_pm_owner_fkey"
            columns: ["pm_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_sdm_owner_fkey"
            columns: ["sdm_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_tech_lead_owner_fkey"
            columns: ["tech_lead_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      work_items_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_type: string | null
          description: string | null
          id: string | null
          label_ids: string[] | null
          label_names: string[] | null
          last_activity_at: string | null
          last_comment_at: string | null
          last_status_change_at: string | null
          latest_update: string | null
          pm_email: string | null
          pm_name: string | null
          pm_owner: string | null
          sdm_email: string | null
          sdm_name: string | null
          sdm_owner: string | null
          stack_rank: number | null
          status_color: string | null
          status_id: string | null
          status_is_attention: boolean | null
          status_is_terminal: boolean | null
          status_label: string | null
          status_sort_order: number | null
          target_date: string | null
          tech_lead_email: string | null
          tech_lead_name: string | null
          tech_lead_owner: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_pm_owner_fkey"
            columns: ["pm_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_sdm_owner_fkey"
            columns: ["sdm_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_tech_lead_owner_fkey"
            columns: ["tech_lead_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      set_user_admin: {
        Args: { make_admin: boolean; target_user: string }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

