-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  avatar_url TEXT,
  preferencias JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Criar tabela de contas
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome_da_conta TEXT NOT NULL,
  tipo_conta TEXT NOT NULL DEFAULT 'principal',
  saldo_atual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprias contas"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprias contas"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias contas"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias contas"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela de transações
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT now(),
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL,
  modo TEXT NOT NULL CHECK (modo IN ('trabalho', 'pessoal')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprias transações"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprias transações"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias transações"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias transações"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela de insights
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('alerta', 'oportunidade', 'informacao')),
  origem TEXT NOT NULL CHECK (origem IN ('regressao_linear', 'arvore_decisao', 'heuristica')),
  prioridade INTEGER DEFAULT 1,
  lido BOOLEAN DEFAULT false,
  gerado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprios insights"
  ON public.insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprios insights"
  ON public.insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprios insights"
  ON public.insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprios insights"
  ON public.insights FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela de logs de serviços
CREATE TABLE public.services_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo_servico TEXT NOT NULL CHECK (tipo_servico IN ('PIX', 'Recarga', 'Beneficio')),
  detalhes JSONB NOT NULL,
  valor DECIMAL(12, 2),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.services_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprios logs"
  ON public.services_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprios logs"
  ON public.services_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Criar função para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''));
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil ao registrar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Criar índices para melhor performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_modo ON public.transactions(modo);
CREATE INDEX idx_transactions_data ON public.transactions(data);
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_insights_user_id ON public.insights(user_id);
CREATE INDEX idx_services_logs_user_id ON public.services_logs(user_id);