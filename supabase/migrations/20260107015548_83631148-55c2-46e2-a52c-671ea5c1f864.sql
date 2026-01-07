-- Drop old restrictive policy if exists
DROP POLICY IF EXISTS "Users can add themselves as owner of new org" ON public.organization_members;

-- Create PERMISSIVE policy allowing users to insert themselves
CREATE POLICY "Users can insert themselves as member"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());