-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'cashier', 'kitchen');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- RLS policies for user_roles (only admins can manage roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for categories (authenticated users only)
DROP POLICY IF EXISTS "Allow public delete to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public insert to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public update to categories" ON public.categories;

CREATE POLICY "Authenticated users can read categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for products (authenticated users only)
DROP POLICY IF EXISTS "Allow public insert to products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public update to products" ON public.products;

CREATE POLICY "Authenticated users can read products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for orders (authenticated users only)
DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update to orders" ON public.orders;

CREATE POLICY "Authenticated users can read orders"
ON public.orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (true);

-- Update RLS policies for order_items (authenticated users only)
DROP POLICY IF EXISTS "Allow public delete to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public read access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public update to order_items" ON public.order_items;

CREATE POLICY "Authenticated users can read order_items"
ON public.order_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert order_items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update order_items"
ON public.order_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete order_items"
ON public.order_items FOR DELETE
TO authenticated
USING (true);

-- Update RLS policies for payments (authenticated users only)
DROP POLICY IF EXISTS "Allow public insert to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public read access to payments" ON public.payments;

CREATE POLICY "Authenticated users can read payments"
ON public.payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (true);