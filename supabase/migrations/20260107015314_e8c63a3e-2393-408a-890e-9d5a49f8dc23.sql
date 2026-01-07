-- Drop the restrictive INSERT policy on organizations if exists
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Create PERMISSIVE policy (default) for creating organizations
CREATE POLICY "Anyone authenticated can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);