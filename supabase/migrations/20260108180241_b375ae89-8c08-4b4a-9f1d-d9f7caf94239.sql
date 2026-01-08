-- Add unique constraint on organization_members for upsert
ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_org_user_unique 
UNIQUE (organization_id, user_id);