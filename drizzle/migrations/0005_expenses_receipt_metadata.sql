ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS estabelecimento text,
  ADD COLUMN IF NOT EXISTS hora text,
  ADD COLUMN IF NOT EXISTS local text;