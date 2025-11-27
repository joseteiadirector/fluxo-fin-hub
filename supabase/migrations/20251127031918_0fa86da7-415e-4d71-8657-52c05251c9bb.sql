-- Corrigir search_path da função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar profile
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email)
  );
  
  -- Criar conta principal
  INSERT INTO public.accounts (user_id, nome_da_conta, tipo_conta, saldo_atual)
  VALUES (
    NEW.id,
    'Conta Principal',
    'principal',
    0
  );
  
  RETURN NEW;
END;
$$;