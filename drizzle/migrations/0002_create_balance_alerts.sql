CREATE TABLE public.balance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  tom text NOT NULL DEFAULT 'atencao',
  periodo text NOT NULL DEFAULT 'mes',
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  entradas numeric NOT NULL DEFAULT 0,
  gastos numeric NOT NULL DEFAULT 0,
  saldo numeric NOT NULL DEFAULT 0,
  extra numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo, periodo, periodo_inicio)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.balance_alerts TO authenticated;
GRANT ALL ON public.balance_alerts TO service_role;

ALTER TABLE public.balance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY balance_alerts_select_own ON public.balance_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY balance_alerts_insert_own ON public.balance_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY balance_alerts_update_own ON public.balance_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY balance_alerts_delete_own ON public.balance_alerts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX balance_alerts_user_created_idx ON public.balance_alerts (user_id, created_at DESC);