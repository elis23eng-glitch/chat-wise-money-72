create or replace function public.listar_minhas_sessoes()
returns table (
  id uuid,
  criada_em timestamptz,
  atualizada_em timestamptz,
  user_agent text,
  ip text,
  atual boolean
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select s.id,
         s.created_at,
         coalesce(s.refreshed_at, s.updated_at),
         s.user_agent,
         host(s.ip)::text,
         s.id::text = coalesce(auth.jwt() ->> 'session_id', '')
  from auth.sessions s
  where s.user_id = auth.uid()
  order by coalesce(s.refreshed_at, s.updated_at) desc
$$;

revoke all on function public.listar_minhas_sessoes() from public;
grant execute on function public.listar_minhas_sessoes() to authenticated;