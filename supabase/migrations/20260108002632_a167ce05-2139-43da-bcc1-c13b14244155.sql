-- Drop existing update policy
DROP POLICY IF EXISTS "Org admins can update categories" ON public.categories;

-- Create new policy that allows updating global categories (org_id is null) or user's org categories
CREATE POLICY "Org admins can update categories" 
ON public.categories 
FOR UPDATE 
USING (
  is_master_admin(auth.uid()) 
  OR organization_id IS NULL 
  OR user_belongs_to_org(organization_id, auth.uid())
);