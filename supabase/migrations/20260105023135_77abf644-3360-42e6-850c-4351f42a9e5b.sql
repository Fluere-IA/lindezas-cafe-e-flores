-- Update status constraint to include 'paid'
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['pending'::text, 'preparing'::text, 'ready'::text, 'completed'::text, 'cancelled'::text, 'paid'::text]));