import { Product, CategoryFilter } from '@/types';
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  filter: CategoryFilter;
  searchQuery: string;
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductGrid({ products, filter, searchQuery, onAddToCart, isLoading }: ProductGridProps) {
  const filteredProducts = products.filter((product) => {
    // Filter by category
    if (filter !== 'all' && product.category?.type !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg">Nenhum produto encontrado</p>
        <p className="text-sm">Tente outra busca ou categoria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {filteredProducts.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <ProductCard product={product} onAdd={onAddToCart} />
        </div>
      ))}
    </div>
  );
}
