-- Allow public insert to products
CREATE POLICY "Allow public insert to products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

-- Allow public update to products
CREATE POLICY "Allow public update to products" 
ON public.products 
FOR UPDATE 
USING (true);

-- Allow public insert to categories
CREATE POLICY "Allow public insert to categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

-- Allow public update to categories
CREATE POLICY "Allow public update to categories" 
ON public.categories 
FOR UPDATE 
USING (true);

-- Allow public delete to categories
CREATE POLICY "Allow public delete to categories" 
ON public.categories 
FOR DELETE 
USING (true);

-- Allow public delete to order_items (for removing items from orders)
CREATE POLICY "Allow public delete to order_items" 
ON public.order_items 
FOR DELETE 
USING (true);