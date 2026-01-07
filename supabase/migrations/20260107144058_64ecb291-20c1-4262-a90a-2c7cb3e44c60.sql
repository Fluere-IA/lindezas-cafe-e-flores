-- Drop and recreate the INSERT policy to ensure it works correctly
DROP POLICY IF EXISTS "org_insert_authenticated" ON public.organizations;

-- Create a more explicit INSERT policy
CREATE POLICY "org_insert_authenticated" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also ensure the organization_members INSERT policy exists and is correct
DROP POLICY IF EXISTS "members_insert_own_org" ON public.organization_members;

CREATE POLICY "members_insert_own_org" 
ON public.organization_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());