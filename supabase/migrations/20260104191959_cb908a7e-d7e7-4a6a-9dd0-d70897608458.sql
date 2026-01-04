-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cafeteria', 'flores')),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  mode TEXT NOT NULL CHECK (mode IN ('mesa', 'balcao')),
  table_number INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for POS system)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (POS terminal)
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public read access to order_items" ON public.order_items FOR SELECT USING (true);

-- Create policies for public insert/update (POS operations)
CREATE POLICY "Allow public insert to orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Insert seed categories
INSERT INTO public.categories (name, type, icon) VALUES
  ('Comidas', 'cafeteria', 'utensils'),
  ('Bebidas', 'cafeteria', 'coffee'),
  ('Flores', 'flores', 'flower');

-- Insert seed products with category references
WITH cat_comidas AS (SELECT id FROM public.categories WHERE name = 'Comidas'),
     cat_bebidas AS (SELECT id FROM public.categories WHERE name = 'Bebidas'),
     cat_flores AS (SELECT id FROM public.categories WHERE name = 'Flores')

INSERT INTO public.products (name, description, price, category_id, stock, is_active) VALUES
  -- Comidas
  ('Tortilha Fit Frango', 'Recheio cremoso de frango com ricota e ervas', 22.00, (SELECT id FROM cat_comidas), 50, true),
  ('Tortilha Vegetariana', 'Abobrinha grelhada, tomate seco e rúcula', 20.00, (SELECT id FROM cat_comidas), 50, true),
  ('Tortilha Pistache Gold', 'Creme de pistache real com morangos frescos', 28.00, (SELECT id FROM cat_comidas), 30, true),
  ('Tortilha Nutella Supreme', 'Nutella pura com banana e canela', 24.00, (SELECT id FROM cat_comidas), 40, true),
  ('Lanche Natural Peru', 'Pão integral, peito de peru, queijo branco e orégano', 18.00, (SELECT id FROM cat_comidas), 35, true),
  ('Lanche Natural Atum', 'Patê de atum caseiro com cenoura ralada', 18.00, (SELECT id FROM cat_comidas), 35, true),
  -- Bebidas
  ('Suco Verde Detox', 'Couve, limão, maçã e gengibre', 14.00, (SELECT id FROM cat_bebidas), 100, true),
  ('Suco Laranja Natural', 'Suco de laranja 100% natural', 12.00, (SELECT id FROM cat_bebidas), 100, true),
  ('Espresso Duplo', 'Café espresso intenso duplo', 8.00, (SELECT id FROM cat_bebidas), 200, true),
  ('Cappuccino da Casa', 'Com borda de doce de leite', 14.00, (SELECT id FROM cat_bebidas), 100, true),
  ('Iced Latte', 'Café gelado cremoso com leite', 16.00, (SELECT id FROM cat_bebidas), 100, true),
  -- Flores
  ('Rosa Unitária Vermelha', 'Para montagem de arranjos', 15.00, (SELECT id FROM cat_flores), 200, true),
  ('Haste de Lírio', 'Para montagem de arranjos', 20.00, (SELECT id FROM cat_flores), 100, true),
  ('Buquê do Dia P', 'Arranjo pronto variado', 65.00, (SELECT id FROM cat_flores), 20, true),
  ('Orquídea Pote 11', 'Presente pronto elegante', 85.00, (SELECT id FROM cat_flores), 15, true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();