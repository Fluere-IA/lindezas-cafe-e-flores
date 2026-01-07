import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductListItemProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductListItem({ product, onAdd }: ProductListItemProps) {
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
        "w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm active:scale-[0.99] transition-all text-left",
        isAdding && "ring-2 ring-primary bg-primary/5"
      )}
    >
      {/* Add button */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
        isAdding 
          ? "bg-primary text-primary-foreground" 
          : "bg-primary/10 text-primary"
      )}>
        {isAdding ? (
          <Check className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-foreground truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {product.description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <p className="font-bold text-primary">
          {formattedPrice}
        </p>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="text-[10px] text-destructive">
            Últimas {product.stock}
          </span>
        )}
      </div>
    </button>
  );
}
