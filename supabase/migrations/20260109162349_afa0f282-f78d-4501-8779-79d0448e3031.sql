-- Atualizar o trigger on_auth_user_created para pular criação de org quando usuário é convidado
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id uuid;
  org_slug text;
BEGIN
  -- Se o usuário foi criado via convite, não criar organização automática
  -- A metadata 'invited' é definida pela edge function send-invite-email
  IF NEW.raw_user_meta_data ->> 'invited' = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Gerar slug único para a organização
  org_slug := 'meu-negocio-' || substr(md5(random()::text), 1, 8);
  
  -- Criar organização padrão
  INSERT INTO public.organizations (name, slug, onboarding_completed)
  VALUES ('Meu Negócio', org_slug, false)
  RETURNING id INTO new_org_id;
  
  -- Vincular usuário como owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;