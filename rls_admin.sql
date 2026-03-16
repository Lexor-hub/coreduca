-- ============================================
-- RLS POLICIES PARA O PAINEL ADMIN
-- ============================================

-- TRILHAS
-- Permite que administradores gerenciem Trilhas
CREATE POLICY "Admins podem inserir trilhas" ON public.trilhas FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "Admins podem atualizar trilhas" ON public.trilhas FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "Admins podem deletar trilhas" ON public.trilhas FOR DELETE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- MISSÕES
-- Permite que administradores gerenciem Missões
CREATE POLICY "Admins podem inserir missoes" ON public.missoes FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "Admins podem atualizar missoes" ON public.missoes FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "Admins podem deletar missoes" ON public.missoes FOR DELETE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- QUESTÕES
-- Permite que administradores gerenciem Questões
CREATE POLICY "Admins podem inserir questoes" ON public.questoes FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "Admins podem atualizar questoes" ON public.questoes FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "Admins podem deletar questoes" ON public.questoes FOR DELETE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
