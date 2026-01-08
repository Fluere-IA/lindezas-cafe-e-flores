-- Add unique constraint on user_roles for upsert
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_unique 
UNIQUE (user_id);