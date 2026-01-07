-- Create function that auto-provisions organization for new users
-- This runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_slug text;
BEGIN
  -- Generate unique slug
  org_slug := 'org-' || substr(md5(random()::text), 1, 8);
  
  -- Create default organization for the new user
  INSERT INTO public.organizations (name, slug, onboarding_completed)
  VALUES ('Meu Negócio', org_slug, false)
  RETURNING id INTO new_org_id;
  
  -- Add user as owner of the organization
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create trigger that executes after insert in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();