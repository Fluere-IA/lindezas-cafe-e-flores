-- Add is_paid column to order_items to track partial payments
ALTER TABLE public.order_items 
ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false;

-- Add paid_at timestamp to track when item was paid
ALTER TABLE public.order_items 
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add payment_method to track how item was paid
ALTER TABLE public.order_items 
ADD COLUMN payment_method TEXT DEFAULT NULL;

-- Create index for efficient querying of unpaid items
CREATE INDEX idx_order_items_is_paid ON public.order_items(is_paid);

-- Allow public update to order_items for marking as paid
CREATE POLICY "Allow public update to order_items" 
ON public.order_items 
FOR UPDATE 
USING (true);