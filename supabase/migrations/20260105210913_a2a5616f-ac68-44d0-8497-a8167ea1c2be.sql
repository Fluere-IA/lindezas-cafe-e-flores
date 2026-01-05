-- Add CHECK constraint to orders table for table_number validation
ALTER TABLE orders
ADD CONSTRAINT orders_table_number_check 
CHECK (table_number IS NULL OR (table_number >= 1 AND table_number <= 99));

-- Add CHECK constraint to payments table for table_number validation
ALTER TABLE payments
ADD CONSTRAINT payments_table_number_check 
CHECK (table_number >= 1 AND table_number <= 999);