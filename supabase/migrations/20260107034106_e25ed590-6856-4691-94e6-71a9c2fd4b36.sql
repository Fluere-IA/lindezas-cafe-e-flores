-- Drop and recreate the INSERT policy with proper TO clause
DROP POLICY IF EXISTS "org_insert_authenticated" ON public.organizations;

CREATE POLICY "org_insert_authenticated"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);