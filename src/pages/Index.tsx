import { useState } from 'react';
import { Header } from '@/components/pos/Header';
import { ModeToggle } from '@/components/pos/ModeToggle';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { SearchBar } from '@/components/pos/SearchBar';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { POSMode, CategoryFilter, Product } from '@/types';
import { toast } from 'sonner';

const Index = () => {
  const [mode, setMode] = useState<POSMode>('balcao');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: products = [], isLoading } = useProducts();
  const cart = useCart();

  const handleAddToCart = (product: Product) => {
    cart.addItem(product);
    toast.success(`${product.name} adicionado`, {
      description: `R$ ${product.price.toFixed(2)}`,
      duration: 1500,
    });
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    
    if (mode === 'mesa' && !tableNumber) {
      toast.error('Selecione o número da mesa');
      return;
    }

    const orderInfo = mode === 'mesa' 
      ? `Mesa ${tableNumber}` 
      : 'Balcão';

    toast.success('Pedido finalizado!', {
      description: `${orderInfo} - Total: R$ ${cart.total.toFixed(2)}`,
    });

    cart.clearCart();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-border bg-card/50 flex items-center justify-between gap-4 flex-wrap">
            <ModeToggle
              mode={mode}
              onModeChange={setMode}
              tableNumber={tableNumber}
              onTableChange={setTableNumber}
            />
            <CategoryTabs
              activeFilter={categoryFilter}
              onFilterChange={setCategoryFilter}
            />
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-64"
            />
          </div>

          {/* Products */}
          <div className="flex-1 overflow-y-auto p-6">
            <ProductGrid
              products={products}
              filter={categoryFilter}
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
              isLoading={isLoading}
            />
          </div>
        </main>

        {/* Cart Sidebar */}
        <CartSidebar
          items={cart.items}
          total={cart.total}
          mode={mode}
          tableNumber={tableNumber}
          onUpdateQuantity={cart.updateQuantity}
          onRemoveItem={cart.removeItem}
          onClearCart={cart.clearCart}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
};

export default Index;
