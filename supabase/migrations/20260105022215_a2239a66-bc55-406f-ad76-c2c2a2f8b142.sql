-- Add order_id to link payments to specific orders
ALTER TABLE public.payments 
ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;