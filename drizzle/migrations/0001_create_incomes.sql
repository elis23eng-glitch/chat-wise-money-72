CREATE TABLE public.incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL,
  categoria text NOT NULL DEFAULT 'outros',
  data date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incomes TO authenticated;
GRANT ALL ON public.incomes TO service_role;

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY incomes_select_own ON public.incomes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY incomes_insert_own ON public.incomes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY incomes_update_own ON public.incomes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY incomes_delete_own ON public.incomes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX incomes_user_data_idx ON public.incomes (user_id, data DESC);