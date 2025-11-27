-- Tabela de metas/budgets por categoria
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria TEXT NOT NULL,
  modo TEXT NOT NULL CHECK (modo IN ('Work', 'Personal')),
  valor_limite NUMERIC NOT NULL,
  mes_referencia TEXT NOT NULL, -- formato: 'YYYY-MM'
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, categoria, modo, mes_referencia)
);

-- Enable RLS
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários veem próprias metas" 
ON public.metas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprias metas" 
ON public.metas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias metas" 
ON public.metas FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias metas" 
ON public.metas FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_metas_updated_at
BEFORE UPDATE ON public.metas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de ofertas personalizadas
CREATE TABLE public.ofertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_oferta TEXT NOT NULL, -- 'cashback', 'desconto', 'emprestimo', etc
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  detalhes JSONB NOT NULL DEFAULT '{}',
  validade TIMESTAMP WITH TIME ZONE,
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários veem próprias ofertas" 
ON public.ofertas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Sistema cria ofertas" 
ON public.ofertas FOR INSERT 
WITH CHECK (true);