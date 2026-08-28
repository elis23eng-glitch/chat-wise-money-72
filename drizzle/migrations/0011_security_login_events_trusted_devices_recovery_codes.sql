CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  device_id text,
  device_name text,
  user_agent text,
  ip text,
  status text NOT NULL DEFAULT 'sucesso',
  novo_dispositivo boolean NOT NULL DEFAULT false,
  confiavel boolean NOT NULL DEFAULT false,
  notificado boolean NOT NULL DEFAULT false
);
CREATE INDEX login_events_user_created_idx ON public.login_events (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY login_events_select_own ON public.login_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY login_events_insert_own ON public.login_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY login_events_delete_own ON public.login_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  apelido text NOT NULL DEFAULT '',
  user_agent text,
  confiavel_ate timestamptz NOT NULL,
  sessao_max_horas integer NOT NULL DEFAULT 720,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trusted_devices TO authenticated;
GRANT ALL ON public.trusted_devices TO service_role;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY trusted_devices_select_own ON public.trusted_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY trusted_devices_insert_own ON public.trusted_devices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY trusted_devices_update_own ON public.trusted_devices FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY trusted_devices_delete_own ON public.trusted_devices FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mfa_recovery_codes_user_idx ON public.mfa_recovery_codes (user_id);
GRANT SELECT ON public.mfa_recovery_codes TO authenticated;
GRANT ALL ON public.mfa_recovery_codes TO service_role;
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY mfa_recovery_codes_select_own ON public.mfa_recovery_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);