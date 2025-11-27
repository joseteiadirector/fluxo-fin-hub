
-- Remover constraint antiga e adicionar nova com todos os tipos de serviços
ALTER TABLE public.services_logs 
DROP CONSTRAINT IF EXISTS services_logs_tipo_servico_check;

ALTER TABLE public.services_logs 
ADD CONSTRAINT services_logs_tipo_servico_check 
CHECK (tipo_servico IN ('PIX', 'Recarga', 'Beneficios', 'Cashback', 'Seguro', 'Emprestimo'));
