-- Add tour_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tour_completed boolean DEFAULT false;