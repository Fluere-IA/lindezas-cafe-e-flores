-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "org_update_owners" ON public.organizations;

-- Recreate the policy using ONLY security definer functions (no direct table access)
CREATE POLICY "org_update_owners"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  public.is_master_admin(auth.uid()) OR
  public.is_org_owner(auth.uid(), id)
);