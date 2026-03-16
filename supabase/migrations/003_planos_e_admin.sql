-- ============================================
-- MIGRATION: 003_planos_e_admin.sql
-- Atualiza planos para free/premium_mensal/premium_anual
-- Configura conta admin inicial
-- ============================================

-- 1. Converter usuarios "premium" existentes para "premium_mensal"
UPDATE public.profiles SET plano = 'premium_mensal' WHERE plano = 'premium';

-- 2. Remover constraint antiga e adicionar nova com 3 planos
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plano_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plano_check
  CHECK (plano IN ('free', 'premium_mensal', 'premium_anual'));

-- 3. Setar admin pelo email
UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'leonardomendonca2301@gmail.com' LIMIT 1
);
