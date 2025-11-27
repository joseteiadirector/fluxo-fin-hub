-- Adicionar políticas RLS para permitir que usuários atualizem e deletem suas próprias ofertas
CREATE POLICY "Usuários atualizam próprias ofertas"
ON public.ofertas
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias ofertas"
ON public.ofertas
FOR DELETE
USING (auth.uid() = user_id);

-- Limpar ofertas duplicadas, mantendo apenas uma de cada tipo por usuário
DELETE FROM public.ofertas a
USING public.ofertas b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND a.tipo_oferta = b.tipo_oferta 
  AND a.ativa = true 
  AND b.ativa = true;