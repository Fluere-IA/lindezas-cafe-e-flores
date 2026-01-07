-- Drop ALL existing INSERT policies on organizations
DROP POLICY IF EXISTS "Anyone authenticated can create organizations" ON public.organizations;

-- Create PERMISSIVE policy (explicitly)
CREATE POLICY "Anyone authenticated can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);