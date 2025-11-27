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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          id: string
          nome_da_conta: string
          saldo_atual: number
          tipo_conta: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          nome_da_conta: string
          saldo_atual?: number
          tipo_conta?: string
          user_id: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          nome_da_conta?: string
          saldo_atual?: number
          tipo_conta?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          gerado_em: string | null
          id: string
          lido: boolean | null
          mensagem: string
          origem: string
          prioridade: number | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          gerado_em?: string | null
          id?: string
          lido?: boolean | null
          mensagem: string
          origem: string
          prioridade?: number | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          gerado_em?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          origem?: string
          prioridade?: number | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          atualizado_em: string | null
          categoria: string
          criado_em: string | null
          id: string
          mes_referencia: string
          modo: string
          user_id: string
          valor_limite: number
        }
        Insert: {
          atualizado_em?: string | null
          categoria: string
          criado_em?: string | null
          id?: string
          mes_referencia: string
          modo: string
          user_id: string
          valor_limite: number
        }
        Update: {
          atualizado_em?: string | null
          categoria?: string
          criado_em?: string | null
          id?: string
          mes_referencia?: string
          modo?: string
          user_id?: string
          valor_limite?: number
        }
        Relationships: []
      }
      ofertas: {
        Row: {
          ativa: boolean | null
          criado_em: string | null
          descricao: string
          detalhes: Json
          id: string
          tipo_oferta: string
          titulo: string
          user_id: string
          validade: string | null
        }
        Insert: {
          ativa?: boolean | null
          criado_em?: string | null
          descricao: string
          detalhes?: Json
          id?: string
          tipo_oferta: string
          titulo: string
          user_id: string
          validade?: string | null
        }
        Update: {
          ativa?: boolean | null
          criado_em?: string | null
          descricao?: string
          detalhes?: Json
          id?: string
          tipo_oferta?: string
          titulo?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atualizado_em: string | null
          avatar_url: string | null
          criado_em: string | null
          id: string
          nome_completo: string | null
          preferencias: Json | null
        }
        Insert: {
          atualizado_em?: string | null
          avatar_url?: string | null
          criado_em?: string | null
          id: string
          nome_completo?: string | null
          preferencias?: Json | null
        }
        Update: {
          atualizado_em?: string | null
          avatar_url?: string | null
          criado_em?: string | null
          id?: string
          nome_completo?: string | null
          preferencias?: Json | null
        }
        Relationships: []
      }
      services_logs: {
        Row: {
          criado_em: string | null
          detalhes: Json
          id: string
          tipo_servico: string
          user_id: string
          valor: number | null
        }
        Insert: {
          criado_em?: string | null
          detalhes: Json
          id?: string
          tipo_servico: string
          user_id: string
          valor?: number | null
        }
        Update: {
          criado_em?: string | null
          detalhes?: Json
          id?: string
          tipo_servico?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          atualizado_em: string | null
          categoria: string
          criado_em: string | null
          data: string | null
          descricao: string
          id: string
          modo: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          account_id: string
          atualizado_em?: string | null
          categoria: string
          criado_em?: string | null
          data?: string | null
          descricao: string
          id?: string
          modo: string
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          account_id?: string
          atualizado_em?: string | null
          categoria?: string
          criado_em?: string | null
          data?: string | null
          descricao?: string
          id?: string
          modo?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
