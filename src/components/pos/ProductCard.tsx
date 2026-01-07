import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price);

  const handleClick = () => {
    if (isAdding) return;
    
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setIsAdding(true);
    onAdd(product);
    
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "product-card group text-left w-full overflow-hidden active:scale-[0.98] transition-all",
        isAdding && "ring-2 ring-primary"
      )}
    >
      {/* Content */}
      <div className="p-4 relative">
        {/* Add feedback overlay */}
        <div className={cn(
          "absolute inset-0 bg-primary/90 flex items-center justify-center transition-all duration-300 rounded-2xl",
          isAdding ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 text-primary-foreground font-bold">
            <Check className="h-6 w-6" />
            <span className="text-lg">+1</span>
          </div>
        </div>

        {/* Header with name and add button */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 flex-1">
            {product.name}
          </h3>
          <div className={cn(
            "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md transition-all shrink-0",
            isAdding && "scale-0"
          )}>
            <Plus className="h-4 w-4" />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {product.description || 'Produto disponível'}
        </p>

        {/* Price and stock */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-lg font-bold text-primary">
            {formattedPrice}
          </p>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
              Últimas {product.stock}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
