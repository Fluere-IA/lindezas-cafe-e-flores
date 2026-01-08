-- Drop the problematic policy that accesses auth.users
DROP POLICY IF EXISTS "Users can view their pending invites" ON public.organization_invites;

-- Create a new policy that uses auth.jwt() instead
CREATE POLICY "Users can view their pending invites" 
ON public.organization_invites 
FOR SELECT 
USING (
  (email = (auth.jwt() ->> 'email')::text AND status = 'pending')
  OR is_master_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_invites.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);