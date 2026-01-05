-- Create payments table to track payment history
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_type TEXT NOT NULL, -- 'full', 'by-items', 'by-people', 'by-value'
  items_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow public access for this POS system
CREATE POLICY "Allow public read access to payments" 
ON public.payments FOR SELECT USING (true);

CREATE POLICY "Allow public insert to payments" 
ON public.payments FOR INSERT WITH CHECK (true);

-- Index for efficient querying
CREATE INDEX idx_payments_table_number ON public.payments(table_number);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);