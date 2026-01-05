-- Add paid_amount column to orders to track partial payments (by value or by people)
ALTER TABLE public.orders 
ADD COLUMN paid_amount NUMERIC NOT NULL DEFAULT 0;