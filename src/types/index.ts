export interface Category {
  id: string;
  name: string;
  type: 'cafeteria' | 'flores';
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: number;
  mode: 'mesa' | 'balcao';
  table_number: number | null;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  created_at: string;
}

export type POSMode = 'mesa' | 'balcao';
export type CategoryFilter = 'all' | 'cafeteria' | 'flores';
