-- Add custom theme color to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#2563EB';

-- Add onboarding_completed flag
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;