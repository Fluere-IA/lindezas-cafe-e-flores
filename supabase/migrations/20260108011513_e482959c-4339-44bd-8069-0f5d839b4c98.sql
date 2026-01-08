-- Drop existing type check constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;

-- Add new constraint with more establishment types
ALTER TABLE categories ADD CONSTRAINT categories_type_check 
CHECK (type IN ('cafeteria', 'restaurante', 'bar', 'pizzaria', 'padaria', 'lanchonete', 'geral'));