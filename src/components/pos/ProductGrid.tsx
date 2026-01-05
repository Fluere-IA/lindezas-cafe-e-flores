import { Product } from '@/types';
import { CategoryFilter } from './CategoryTabs';
import { ProductCard } from './ProductCard';
import { Loader2, Coffee } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  filter: CategoryFilter;
  searchQuery: string;
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductGrid({ products, filter, searchQuery, onAddToCart, isLoading }: ProductGridProps) {
  const filteredProducts = products.filter((product) => {
    // Filter by category name
    const categoryName = product.category?.name?.toLowerCase();
    if (categoryName !== filter) {
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
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-lindezas-gold" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando produtos...</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
          <Coffee className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
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
