import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CategoryTabs, CategoryFilter } from '@/components/pos/CategoryTabs';
import { SearchBar } from '@/components/pos/SearchBar';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSheet } from '@/components/pos/CartSheet';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('bebidas');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  
  const { data: products = [], isLoading } = useProducts();
  const cart = useCart();

  const handleAddToCart = (product: Product) => {
    cart.addItem(product);
    toast.success(`+1 ${product.name}`, {
      duration: 1000,
      position: 'top-center',
    });
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;
    
    if (!tableNumber.trim()) {
      toast.error('Informe o número da mesa');
      return;
    }

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          mode: 'mesa',
          total: cart.total,
          status: 'pending',
          table_number: parseInt(tableNumber),
          notes: `Mesa ${tableNumber}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Pedido enviado para a cozinha!', {
        description: `Mesa ${tableNumber} - Pedido #${order.order_number}`,
      });

      cart.clearCart();
      setTableNumber('');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao enviar pedido', {
        description: 'Tente novamente',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <DashboardHeader />
      
      {/* Toolbar */}
      <div className="sticky top-0 z-40 px-4 py-2.5 bg-background/98 backdrop-blur-sm space-y-2.5">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full"
        />
        <CategoryTabs
          activeFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
        />
      </div>

      {/* Products */}
      <main className="flex-1 p-4">
        <ProductGrid
          products={products}
          filter={categoryFilter}
          searchQuery={searchQuery}
          onAddToCart={handleAddToCart}
          isLoading={isLoading}
        />
      </main>

      {/* Cart Sheet (Mobile Bottom) */}
      <CartSheet
        items={cart.items}
        total={cart.total}
        tableNumber={tableNumber}
        onTableNumberChange={setTableNumber}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClearCart={cart.clearCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Index;
