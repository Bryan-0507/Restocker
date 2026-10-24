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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          category: Database["public"]["Enums"]["business_category"]
          category_other: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["business_category"]
          category_other?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["business_category"]
          category_other?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      capture_inputs: {
        Row: {
          capture_id: string
          created_at: string
          id: string
          is_relevant: boolean | null
          rejection_reason: string | null
          storage_path: string | null
          text_content: string | null
          transcription: string | null
          type: Database["public"]["Enums"]["capture_input_type"]
        }
        Insert: {
          capture_id: string
          created_at?: string
          id?: string
          is_relevant?: boolean | null
          rejection_reason?: string | null
          storage_path?: string | null
          text_content?: string | null
          transcription?: string | null
          type: Database["public"]["Enums"]["capture_input_type"]
        }
        Update: {
          capture_id?: string
          created_at?: string
          id?: string
          is_relevant?: boolean | null
          rejection_reason?: string | null
          storage_path?: string | null
          text_content?: string | null
          transcription?: string | null
          type?: Database["public"]["Enums"]["capture_input_type"]
        }
        Relationships: [
          {
            foreignKeyName: "capture_inputs_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "captures"
            referencedColumns: ["id"]
          },
        ]
      }
      capture_items: {
        Row: {
          capture_id: string
          confidence: number | null
          created_at: string
          id: string
          input_id: string | null
          llm_product_id: string | null
          llm_quantity: number | null
          llm_type: Database["public"]["Enums"]["movement_type"] | null
          product_id: string | null
          quantity: number | null
          raw_text: string
          status: Database["public"]["Enums"]["capture_item_status"]
          type: Database["public"]["Enums"]["movement_type"] | null
        }
        Insert: {
          capture_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          input_id?: string | null
          llm_product_id?: string | null
          llm_quantity?: number | null
          llm_type?: Database["public"]["Enums"]["movement_type"] | null
          product_id?: string | null
          quantity?: number | null
          raw_text: string
          status?: Database["public"]["Enums"]["capture_item_status"]
          type?: Database["public"]["Enums"]["movement_type"] | null
        }
        Update: {
          capture_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          input_id?: string | null
          llm_product_id?: string | null
          llm_quantity?: number | null
          llm_type?: Database["public"]["Enums"]["movement_type"] | null
          product_id?: string | null
          quantity?: number | null
          raw_text?: string
          status?: Database["public"]["Enums"]["capture_item_status"]
          type?: Database["public"]["Enums"]["movement_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "capture_items_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "captures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capture_items_input_id_fkey"
            columns: ["input_id"]
            isOneToOne: false
            referencedRelation: "capture_inputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capture_items_llm_product_id_fkey"
            columns: ["llm_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capture_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      captures: {
        Row: {
          business_id: string
          captured_by: string
          cost_usd: number | null
          created_at: string
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          output_tokens: number | null
          prompt_version: string | null
          raw_response: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["capture_status"]
        }
        Insert: {
          business_id: string
          captured_by: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          prompt_version?: string | null
          raw_response?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["capture_status"]
        }
        Update: {
          business_id?: string
          captured_by?: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          prompt_version?: string | null
          raw_response?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["capture_status"]
        }
        Relationships: [
          {
            foreignKeyName: "captures_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_events: {
        Row: {
          business_id: string
          changes: Json
          created_at: string
          id: string
          performed_by: string | null
          product_id: string
          type: Database["public"]["Enums"]["catalog_event_type"]
        }
        Insert: {
          business_id: string
          changes?: Json
          created_at?: string
          id?: string
          performed_by?: string | null
          product_id: string
          type: Database["public"]["Enums"]["catalog_event_type"]
        }
        Update: {
          business_id?: string
          changes?: Json
          created_at?: string
          id?: string
          performed_by?: string | null
          product_id?: string
          type?: Database["public"]["Enums"]["catalog_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "catalog_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          business_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          business_id: string
          capture_item_id: string | null
          created_at: string
          id: string
          performed_by: string
          product_id: string
          quantity: number
          reverts_movement_id: string | null
          source: Database["public"]["Enums"]["movement_source"]
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          business_id: string
          capture_item_id?: string | null
          created_at?: string
          id?: string
          performed_by: string
          product_id: string
          quantity: number
          reverts_movement_id?: string | null
          source: Database["public"]["Enums"]["movement_source"]
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          business_id?: string
          capture_item_id?: string | null
          created_at?: string
          id?: string
          performed_by?: string
          product_id?: string
          quantity?: number
          reverts_movement_id?: string | null
          source?: Database["public"]["Enums"]["movement_source"]
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_capture_item_id_fkey"
            columns: ["capture_item_id"]
            isOneToOne: false
            referencedRelation: "capture_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_reverts_movement_id_fkey"
            columns: ["reverts_movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
        ]
      }
      product_aliases: {
        Row: {
          alias: string
          business_id: string
          created_at: string
          id: string
          origin: Database["public"]["Enums"]["alias_origin"]
          product_id: string
        }
        Insert: {
          alias: string
          business_id: string
          created_at?: string
          id?: string
          origin?: Database["public"]["Enums"]["alias_origin"]
          product_id: string
        }
        Update: {
          alias?: string
          business_id?: string
          created_at?: string
          id?: string
          origin?: Database["public"]["Enums"]["alias_origin"]
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_aliases_product_id_business_id_fkey"
            columns: ["product_id", "business_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          created_at: string
          current_quantity: number
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          minimum_quantity: number
          name: string
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Insert: {
          business_id: string
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          minimum_quantity?: number
          name: string
          unit?: Database["public"]["Enums"]["product_unit"]
        }
        Update: {
          business_id?: string
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          minimum_quantity?: number
          name?: string
          unit?: Database["public"]["Enums"]["product_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_id: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          business_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_business: {
        Args: {
          p_category: Database["public"]["Enums"]["business_category"]
          p_category_other?: string
          p_name: string
        }
        Returns: string
      }
      create_product: {
        Args: {
          p_aliases?: string[]
          p_description?: string
          p_initial_quantity?: number
          p_minimum_quantity?: number
          p_name: string
          p_unit: Database["public"]["Enums"]["product_unit"]
        }
        Returns: string
      }
      current_business_id: { Args: never; Returns: string }
      is_business_admin: { Args: never; Returns: boolean }
      register_manual_movement: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_type: Database["public"]["Enums"]["movement_type"]
        }
        Returns: string
      }
    }
    Enums: {
      alias_origin: "manual" | "aprendido"
      business_category:
        | "reposteria"
        | "panaderia"
        | "restaurante"
        | "cafeteria"
        | "tienda"
        | "ferreteria"
        | "farmacia"
        | "salon_belleza"
        | "otro"
      capture_input_type: "foto" | "audio" | "texto"
      capture_item_status: "pendiente" | "aceptada" | "editada" | "descartada"
      capture_status:
        | "procesando"
        | "en_revision"
        | "confirmada"
        | "descartada"
        | "error"
      catalog_event_type:
        | "producto_creado"
        | "producto_editado"
        | "producto_desactivado"
        | "producto_reactivado"
        | "alias_agregado"
        | "alias_quitado"
      invitation_status: "pendiente" | "aceptada" | "expirada"
      movement_source: "foto" | "audio" | "texto" | "manual"
      movement_type: "entrada" | "uso" | "perdida" | "ajuste"
      product_unit: "kg" | "g" | "lb" | "oz" | "l" | "ml" | "unidad"
      user_role: "admin" | "base"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      alias_origin: ["manual", "aprendido"],
      business_category: [
        "reposteria",
        "panaderia",
        "restaurante",
        "cafeteria",
        "tienda",
        "ferreteria",
        "farmacia",
        "salon_belleza",
        "otro",
      ],
      capture_input_type: ["foto", "audio", "texto"],
      capture_item_status: ["pendiente", "aceptada", "editada", "descartada"],
      capture_status: [
        "procesando",
        "en_revision",
        "confirmada",
        "descartada",
        "error",
      ],
      catalog_event_type: [
        "producto_creado",
        "producto_editado",
        "producto_desactivado",
        "producto_reactivado",
        "alias_agregado",
        "alias_quitado",
      ],
      invitation_status: ["pendiente", "aceptada", "expirada"],
      movement_source: ["foto", "audio", "texto", "manual"],
      movement_type: ["entrada", "uso", "perdida", "ajuste"],
      product_unit: ["kg", "g", "lb", "oz", "l", "ml", "unidad"],
      user_role: ["admin", "base"],
    },
  },
} as const
