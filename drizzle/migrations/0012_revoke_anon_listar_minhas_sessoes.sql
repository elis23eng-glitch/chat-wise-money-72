-- Revoke execute on listar_minhas_sessoes from anon to satisfy security linter.
-- The function must remain executable by authenticated users (used by RLS-backed app code).
revoke all on function public.listar_minhas_sessoes() from public, anon, authenticated;
grant execute on function public.listar_minhas_sessoes() to authenticated;