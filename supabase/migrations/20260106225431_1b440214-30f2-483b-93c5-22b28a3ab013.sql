-- Fix the organization owners update policy - was using wrong column reference
DROP POLICY IF EXISTS "Org owners can update their organization" ON public.organizations;

CREATE POLICY "Org owners can update their organization"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);