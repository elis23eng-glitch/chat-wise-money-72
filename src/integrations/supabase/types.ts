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
      balance_alerts: {
        Row: {
          created_at: string
          entradas: number
          extra: number | null
          gastos: number
          id: string
          periodo: string
          periodo_fim: string
          periodo_inicio: string
          saldo: number
          tipo: string
          tom: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entradas?: number
          extra?: number | null
          gastos?: number
          id?: string
          periodo?: string
          periodo_fim: string
          periodo_inicio: string
          saldo?: number
          tipo: string
          tom?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entradas?: number
          extra?: number | null
          gastos?: number
          id?: string
          periodo?: string
          periodo_fim?: string
          periodo_inicio?: string
          saldo?: number
          tipo?: string
          tom?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          categoria: string
          comprovante: string | null
          created_at: string
          data: string
          descricao: string
          estabelecimento: string | null
          hora: string | null
          id: string
          local: string | null
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string
          comprovante?: string | null
          created_at?: string
          data?: string
          descricao?: string
          estabelecimento?: string | null
          hora?: string | null
          id?: string
          local?: string | null
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          comprovante?: string | null
          created_at?: string
          data?: string
          descricao?: string
          estabelecimento?: string | null
          hora?: string | null
          id?: string
          local?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          id: string
          prazo: string | null
          titulo: string
          user_id: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          created_at?: string
          id?: string
          prazo?: string | null
          titulo: string
          user_id: string
          valor_alvo: number
          valor_atual?: number
        }
        Update: {
          created_at?: string
          id?: string
          prazo?: string | null
          titulo?: string
          user_id?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: []
      }
      incomes: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      ocr_settings: {
        Row: {
          alerta_medio: number
          limiar_categoria: number
          limiar_data: number
          limiar_estabelecimento: number
          limiar_geral: number
          limiar_valor: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alerta_medio?: number
          limiar_categoria?: number
          limiar_data?: number
          limiar_estabelecimento?: number
          limiar_geral?: number
          limiar_valor?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alerta_medio?: number
          limiar_categoria?: number
          limiar_data?: number
          limiar_estabelecimento?: number
          limiar_geral?: number
          limiar_valor?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      receipt_audits: {
        Row: {
          arquivo_tipo: string | null
          comprovante: string | null
          confianca_media: number
          created_at: string
          data: string | null
          duplicidade_ignorada: boolean
          duplicidade_total: number
          edicoes: Json
          estabelecimento: string | null
          id: string
          itens: Json
          itens_baixa_confianca: number
          observacao: string
          tentativas_ocr: number
          total_itens: number
          user_id: string
        }
        Insert: {
          arquivo_tipo?: string | null
          comprovante?: string | null
          confianca_media?: number
          created_at?: string
          data?: string | null
          duplicidade_ignorada?: boolean
          duplicidade_total?: number
          edicoes?: Json
          estabelecimento?: string | null
          id?: string
          itens?: Json
          itens_baixa_confianca?: number
          observacao?: string
          tentativas_ocr?: number
          total_itens?: number
          user_id: string
        }
        Update: {
          arquivo_tipo?: string | null
          comprovante?: string | null
          confianca_media?: number
          created_at?: string
          data?: string | null
          duplicidade_ignorada?: boolean
          duplicidade_total?: number
          edicoes?: Json
          estabelecimento?: string | null
          id?: string
          itens?: Json
          itens_baixa_confianca?: number
          observacao?: string
          tentativas_ocr?: number
          total_itens?: number
          user_id?: string
        }
        Relationships: []
      }
      recurring_rules: {
        Row: {
          ativa: boolean
          categoria: string
          chave: string
          created_at: string
          descricao: string
          dia_do_mes: number
          estabelecimento: string | null
          frequencia: string
          id: string
          proxima_data: string | null
          ultimo_registro: string | null
          user_id: string
          valor_medio: number
        }
        Insert: {
          ativa?: boolean
          categoria?: string
          chave: string
          created_at?: string
          descricao: string
          dia_do_mes?: number
          estabelecimento?: string | null
          frequencia?: string
          id?: string
          proxima_data?: string | null
          ultimo_registro?: string | null
          user_id: string
          valor_medio?: number
        }
        Update: {
          ativa?: boolean
          categoria?: string
          chave?: string
          created_at?: string
          descricao?: string
          dia_do_mes?: number
          estabelecimento?: string | null
          frequencia?: string
          id?: string
          proxima_data?: string | null
          ultimo_registro?: string | null
          user_id?: string
          valor_medio?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      listar_minhas_sessoes: {
        Args: never
        Returns: {
          atual: boolean
          atualizada_em: string
          criada_em: string
          id: string
          ip: string
          user_agent: string
        }[]
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
  public: {
    Enums: {},
  },
} as const
