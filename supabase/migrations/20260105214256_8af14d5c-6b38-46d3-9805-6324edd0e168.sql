-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Authenticated users can read products" ON products;
DROP POLICY IF EXISTS "Authenticated users can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can read order_items" ON order_items;

-- Create permissive public read policies for products and categories
CREATE POLICY "Anyone can read products" 
ON products 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can read categories" 
ON categories 
FOR SELECT 
USING (true);

-- Create permissive public read/write policies for orders and order_items (for POS system)
CREATE POLICY "Anyone can read orders" 
ON orders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can read order_items" 
ON order_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create orders" 
ON orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update orders" 
ON orders 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can insert order_items" 
ON order_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update order_items" 
ON order_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete order_items" 
ON order_items 
FOR DELETE 
USING (true);

-- Update payments to allow public access for cashier functionality
DROP POLICY IF EXISTS "Cashiers and admins can read payments" ON payments;
DROP POLICY IF EXISTS "Cashiers and admins can create payments" ON payments;

CREATE POLICY "Anyone can read payments" 
ON payments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create payments" 
ON payments 
FOR INSERT 
WITH CHECK (true);