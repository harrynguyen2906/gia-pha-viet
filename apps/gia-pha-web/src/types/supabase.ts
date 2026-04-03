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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          clan_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          clan_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          clan_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clans: {
        Row: {
          banner_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          display_name: string | null
          founding_year: number | null
          head_of_house_id: string | null
          id: string
          is_public: boolean
          motto: string | null
          name: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_name?: string | null
          founding_year?: number | null
          head_of_house_id?: string | null
          id?: string
          is_public?: boolean
          motto?: string | null
          name: string
          updated_at: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_name?: string | null
          founding_year?: number | null
          head_of_house_id?: string | null
          id?: string
          is_public?: boolean
          motto?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clans_head_of_house_id_fkey"
            columns: ["head_of_house_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      duties: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["DutyCategory"]
          clan_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["DutyPriority"]
          progress: number
          ritual_event_id: string | null
          status: Database["public"]["Enums"]["DutyStatus"]
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          category: Database["public"]["Enums"]["DutyCategory"]
          clan_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["DutyPriority"]
          progress?: number
          ritual_event_id?: string | null
          status?: Database["public"]["Enums"]["DutyStatus"]
          title: string
          updated_at: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["DutyCategory"]
          clan_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["DutyPriority"]
          progress?: number
          ritual_event_id?: string | null
          status?: Database["public"]["Enums"]["DutyStatus"]
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duties_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duties_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duties_ritual_event_id_fkey"
            columns: ["ritual_event_id"]
            isOneToOne: false
            referencedRelation: "ritual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_logs: {
        Row: {
          action: string
          created_at: string
          duty_id: string
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          duty_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          duty_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duty_logs_duty_id_fkey"
            columns: ["duty_id"]
            isOneToOne: false
            referencedRelation: "duties"
            referencedColumns: ["id"]
          },
        ]
      }
      grave_sites: {
        Row: {
          clan_id: string
          condition: Database["public"]["Enums"]["SiteCondition"]
          created_at: string
          deleted_at: string | null
          epitaph: string | null
          id: string
          last_visited: string | null
          latitude: number
          longitude: number
          member_id: string
          registered_by: string | null
          section_plot: string | null
          site_type: Database["public"]["Enums"]["SiteType"]
          updated_at: string
        }
        Insert: {
          clan_id: string
          condition?: Database["public"]["Enums"]["SiteCondition"]
          created_at?: string
          deleted_at?: string | null
          epitaph?: string | null
          id?: string
          last_visited?: string | null
          latitude: number
          longitude: number
          member_id: string
          registered_by?: string | null
          section_plot?: string | null
          site_type?: Database["public"]["Enums"]["SiteType"]
          updated_at: string
        }
        Update: {
          clan_id?: string
          condition?: Database["public"]["Enums"]["SiteCondition"]
          created_at?: string
          deleted_at?: string | null
          epitaph?: string | null
          id?: string
          last_visited?: string | null
          latitude?: number
          longitude?: number
          member_id?: string
          registered_by?: string | null
          section_plot?: string | null
          site_type?: Database["public"]["Enums"]["SiteType"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grave_sites_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grave_sites_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_media: {
        Row: {
          caption: string | null
          created_at: string
          file_size: number | null
          height: number | null
          id: string
          media_type: Database["public"]["Enums"]["MediaType"]
          member_id: string
          mime_type: string | null
          sort_order: number
          thumbnail_url: string | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          media_type: Database["public"]["Enums"]["MediaType"]
          member_id: string
          mime_type?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          media_type?: Database["public"]["Enums"]["MediaType"]
          member_id?: string
          mime_type?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_media_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_spouses: {
        Row: {
          created_at: string
          divorce_date: string | null
          id: string
          is_current: boolean
          marriage_date: string | null
          member_a_id: string
          member_b_id: string
        }
        Insert: {
          created_at?: string
          divorce_date?: string | null
          id?: string
          is_current?: boolean
          marriage_date?: string | null
          member_a_id: string
          member_b_id: string
        }
        Update: {
          created_at?: string
          divorce_date?: string | null
          id?: string
          is_current?: boolean
          marriage_date?: string | null
          member_a_id?: string
          member_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_spouses_member_a_id_fkey"
            columns: ["member_a_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_spouses_member_b_id_fkey"
            columns: ["member_b_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          biography: string | null
          birth_date_lunar: string | null
          birth_date_solar: string | null
          branch_name: string | null
          clan_id: string
          created_at: string
          created_by: string | null
          death_date_lunar: string | null
          death_date_solar: string | null
          deleted_at: string | null
          departure_rite: string | null
          full_name: string
          gender: Database["public"]["Enums"]["GenderType"]
          generation: number
          id: string
          is_deceased: boolean
          lineage_role: Database["public"]["Enums"]["LineageRole"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          biography?: string | null
          birth_date_lunar?: string | null
          birth_date_solar?: string | null
          branch_name?: string | null
          clan_id: string
          created_at?: string
          created_by?: string | null
          death_date_lunar?: string | null
          death_date_solar?: string | null
          deleted_at?: string | null
          departure_rite?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["GenderType"]
          generation?: number
          id?: string
          is_deceased?: boolean
          lineage_role?: Database["public"]["Enums"]["LineageRole"]
          updated_at: string
        }
        Update: {
          avatar_url?: string | null
          biography?: string | null
          birth_date_lunar?: string | null
          birth_date_solar?: string | null
          branch_name?: string | null
          clan_id?: string
          created_at?: string
          created_by?: string | null
          death_date_lunar?: string | null
          death_date_solar?: string | null
          deleted_at?: string | null
          departure_rite?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["GenderType"]
          generation?: number
          id?: string
          is_deceased?: boolean
          lineage_role?: Database["public"]["Enums"]["LineageRole"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          relationship_type: Database["public"]["Enums"]["RelationshipType"]
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          relationship_type?: Database["public"]["Enums"]["RelationshipType"]
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          relationship_type?: Database["public"]["Enums"]["RelationshipType"]
        }
        Relationships: [
          {
            foreignKeyName: "relationships_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_duties: {
        Row: {
          assigned_group: Database["public"]["Enums"]["AssignedGroup"]
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string
          id: string
          is_completed: boolean
          ritual_event_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          assigned_group?: Database["public"]["Enums"]["AssignedGroup"]
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          is_completed?: boolean
          ritual_event_id: string
          sort_order?: number
          updated_at: string
        }
        Update: {
          assigned_group?: Database["public"]["Enums"]["AssignedGroup"]
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          is_completed?: boolean
          ritual_event_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_duties_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritual_duties_ritual_event_id_fkey"
            columns: ["ritual_event_id"]
            isOneToOne: false
            referencedRelation: "ritual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_events: {
        Row: {
          ancestor_id: string | null
          certified_at: string | null
          certified_by: string | null
          clan_id: string
          created_at: string
          created_by: string | null
          date_lunar: string | null
          date_solar: string
          deleted_at: string | null
          description: string | null
          id: string
          is_certified: boolean
          is_recurring: boolean
          lunar_recurrence: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ancestor_id?: string | null
          certified_at?: string | null
          certified_by?: string | null
          clan_id: string
          created_at?: string
          created_by?: string | null
          date_lunar?: string | null
          date_solar: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_certified?: boolean
          is_recurring?: boolean
          lunar_recurrence?: string | null
          title: string
          updated_at: string
        }
        Update: {
          ancestor_id?: string | null
          certified_at?: string | null
          certified_by?: string | null
          clan_id?: string
          created_at?: string
          created_by?: string | null
          date_lunar?: string | null
          date_solar?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_certified?: boolean
          is_recurring?: boolean
          lunar_recurrence?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_events_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritual_events_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_instructions: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          ritual_event_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          ritual_event_id: string
          sort_order?: number
          title: string
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          ritual_event_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_instructions_ritual_event_id_fkey"
            columns: ["ritual_event_id"]
            isOneToOne: false
            referencedRelation: "ritual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      site_media: {
        Row: {
          caption: string | null
          created_at: string
          file_size: number | null
          id: string
          media_type: Database["public"]["Enums"]["MediaType"]
          site_id: string
          sort_order: number
          thumbnail_url: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          media_type: Database["public"]["Enums"]["MediaType"]
          site_id: string
          sort_order?: number
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          media_type?: Database["public"]["Enums"]["MediaType"]
          site_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_media_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "grave_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          phone: string | null
          settings: Json
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          locale?: string
          phone?: string | null
          settings?: Json
          timezone?: string
          updated_at: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          phone?: string | null
          settings?: Json
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clan_id: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          member_id: string | null
          password_hash: string | null
          provider: string | null
          provider_id: string | null
          role: Database["public"]["Enums"]["UserRole"]
          updated_at: string
        }
        Insert: {
          clan_id?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          member_id?: string | null
          password_hash?: string | null
          provider?: string | null
          provider_id?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updated_at: string
        }
        Update: {
          clan_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          member_id?: string | null
          password_hash?: string | null
          provider?: string | null
          provider_id?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_offerings: {
        Row: {
          created_at: string
          id: string
          member_id: string
          message: string | null
          offered_by: string
          offering_type: Database["public"]["Enums"]["OfferingType"]
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          message?: string | null
          offered_by: string
          offering_type: Database["public"]["Enums"]["OfferingType"]
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          message?: string | null
          offered_by?: string
          offering_type?: Database["public"]["Enums"]["OfferingType"]
        }
        Relationships: [
          {
            foreignKeyName: "virtual_offerings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      AssignedGroup: "ELDERS" | "HEIRS" | "YOUTH" | "ALL"
      DutyCategory: "RELIGIOUS" | "MAINTENANCE" | "ARCHIVAL" | "SOCIAL"
      DutyPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      DutyStatus: "QUEUE" | "ACTIVE" | "COMPLETED"
      GenderType: "MALE" | "FEMALE" | "OTHER"
      LineageRole: "HEAD_OF_HOUSE" | "ELDER" | "HEIR" | "YOUTH" | "MEMBER"
      MediaType: "AVATAR" | "PHOTO" | "PANORAMA" | "DOCUMENT" | "MODEL_3D"
      NotificationType:
        | "RITUAL_REMINDER"
        | "DUTY_ASSIGNED"
        | "DUTY_DUE"
        | "DUTY_COMPLETED"
        | "MEMBER_ADDED"
        | "SITE_REGISTERED"
        | "SYSTEM"
      OfferingType: "INCENSE" | "FLOWERS" | "FOOD" | "PRAYER"
      RelationshipType: "BIOLOGICAL" | "ADOPTED" | "STEP"
      SiteCondition: "MAINTAINED" | "NEEDS_VISIT" | "WEATHERED" | "RESTORATION"
      SiteType: "TEMPLE" | "CHURCH" | "CEMETERY" | "PRIVATE" | "OTHER"
      UserRole: "ADMIN" | "HEAD_OF_HOUSE" | "ELDER" | "MEMBER" | "GUEST"
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
      AssignedGroup: ["ELDERS", "HEIRS", "YOUTH", "ALL"],
      DutyCategory: ["RELIGIOUS", "MAINTENANCE", "ARCHIVAL", "SOCIAL"],
      DutyPriority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      DutyStatus: ["QUEUE", "ACTIVE", "COMPLETED"],
      GenderType: ["MALE", "FEMALE", "OTHER"],
      LineageRole: ["HEAD_OF_HOUSE", "ELDER", "HEIR", "YOUTH", "MEMBER"],
      MediaType: ["AVATAR", "PHOTO", "PANORAMA", "DOCUMENT", "MODEL_3D"],
      NotificationType: [
        "RITUAL_REMINDER",
        "DUTY_ASSIGNED",
        "DUTY_DUE",
        "DUTY_COMPLETED",
        "MEMBER_ADDED",
        "SITE_REGISTERED",
        "SYSTEM",
      ],
      OfferingType: ["INCENSE", "FLOWERS", "FOOD", "PRAYER"],
      RelationshipType: ["BIOLOGICAL", "ADOPTED", "STEP"],
      SiteCondition: ["MAINTAINED", "NEEDS_VISIT", "WEATHERED", "RESTORATION"],
      SiteType: ["TEMPLE", "CHURCH", "CEMETERY", "PRIVATE", "OTHER"],
      UserRole: ["ADMIN", "HEAD_OF_HOUSE", "ELDER", "MEMBER", "GUEST"],
    },
  },
} as const
