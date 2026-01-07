-- Allow authenticated users to insert themselves as owner of a new organization
-- This is needed for the registration flow where the user creates their first org

CREATE POLICY "Users can add themselves as owner of new org"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'owner'
);

-- Also allow authenticated users to insert new organizations (for registration flow)
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);