CREATE TABLE public.receipt_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  comprovante text,
  estabelecimento text,
  data date,
  arquivo_tipo text,
  total_itens integer NOT NULL DEFAULT 0,
  itens_baixa_confianca integer NOT NULL DEFAULT 0,
  confianca_media numeric NOT NULL DEFAULT 1,
  tentativas_ocr integer NOT NULL DEFAULT 1,
  duplicidade_total integer NOT NULL DEFAULT 0,
  duplicidade_ignorada boolean NOT NULL DEFAULT false,
  edicoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacao text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipt_audits TO authenticated;
GRANT ALL ON public.receipt_audits TO service_role;
ALTER TABLE public.receipt_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipt_audits_select_own ON public.receipt_audits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY receipt_audits_insert_own ON public.receipt_audits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY receipt_audits_delete_own ON public.receipt_audits FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX receipt_audits_user_created_idx ON public.receipt_audits (user_id, created_at DESC);

CREATE TABLE public.ocr_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  limiar_geral numeric NOT NULL DEFAULT 0.7,
  limiar_valor numeric NOT NULL DEFAULT 0.8,
  limiar_data numeric NOT NULL DEFAULT 0.7,
  limiar_estabelecimento numeric NOT NULL DEFAULT 0.6,
  limiar_categoria numeric NOT NULL DEFAULT 0.6,
  alerta_medio numeric NOT NULL DEFAULT 0.7,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ocr_settings TO authenticated;
GRANT ALL ON public.ocr_settings TO service_role;
ALTER TABLE public.ocr_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ocr_settings_select_own ON public.ocr_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ocr_settings_insert_own ON public.ocr_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ocr_settings_update_own ON public.ocr_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.recurring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  chave text NOT NULL,
  descricao text NOT NULL,
  estabelecimento text,
  categoria text NOT NULL DEFAULT 'contas fixas',
  valor_medio numeric NOT NULL DEFAULT 0,
  dia_do_mes integer NOT NULL DEFAULT 1,
  frequencia text NOT NULL DEFAULT 'mensal',
  ativa boolean NOT NULL DEFAULT true,
  ultimo_registro date,
  proxima_data date,
  UNIQUE (user_id, chave)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_rules TO authenticated;
GRANT ALL ON public.recurring_rules TO service_role;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY recurring_rules_select_own ON public.recurring_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY recurring_rules_insert_own ON public.recurring_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY recurring_rules_update_own ON public.recurring_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY recurring_rules_delete_own ON public.recurring_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);