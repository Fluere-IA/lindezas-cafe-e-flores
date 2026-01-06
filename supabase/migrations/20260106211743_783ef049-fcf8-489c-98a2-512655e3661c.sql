-- Add phone and type columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS owner_name text;