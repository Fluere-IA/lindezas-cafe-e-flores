-- Drop the old constraint and create a new one with more roles
ALTER TABLE public.organization_members 
DROP CONSTRAINT organization_members_role_check;

ALTER TABLE public.organization_members 
ADD CONSTRAINT organization_members_role_check 
CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'cashier'::text, 'kitchen'::text]));