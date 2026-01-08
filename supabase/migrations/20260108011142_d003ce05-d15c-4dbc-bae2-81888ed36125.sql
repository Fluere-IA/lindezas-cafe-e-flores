-- Drop the existing SELECT policy for categories
DROP POLICY IF EXISTS "Users can read categories from their org or master admin sees a" ON public.categories;

-- Create new policy that allows reading org categories OR global categories
CREATE POLICY "Users can read categories from their org or global"
ON public.categories
FOR SELECT
USING (
  is_master_admin(auth.uid()) 
  OR organization_id IS NULL 
  OR organization_id IN (SELECT get_user_organizations(auth.uid()))
);