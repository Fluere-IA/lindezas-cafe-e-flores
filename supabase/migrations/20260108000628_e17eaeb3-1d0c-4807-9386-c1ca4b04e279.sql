-- Add position column to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Add position column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_categories_position ON public.categories(organization_id, position);
CREATE INDEX IF NOT EXISTS idx_products_position ON public.products(category_id, position);