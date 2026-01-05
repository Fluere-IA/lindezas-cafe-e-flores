import { useState } from 'react';
import { Plus, Check, Coffee, Sandwich, GlassWater, Flower2 } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { getProductImage } from '@/lib/productImages';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

function getProductIcon(product: Product) {
  const name = product.name.toLowerCase();
  const categoryType = product.category?.type;
  
  if (categoryType === 'flores') return Flower2;
  if (name.includes('suco') || name.includes('latte') || name.includes('espresso') || name.includes('cappuccino')) {
    return GlassWater;
  }
  if (name.includes('tortilha') || name.includes('lanche')) return Sandwich;
  return Coffee;
}

function getIconColor(product: Product): string {
  const categoryType = product.category?.type;
  if (categoryType === 'flores') return 'text-flower-blue';
  return 'text-forest-light';
}

function getCategoryBadgeStyle(type: string | undefined) {
  if (type === 'flores') {
    return 'bg-lindezas-forest text-white';
  }
  return 'bg-lindezas-forest text-white';
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const Icon = getProductIcon(product);
  const iconColor = getIconColor(product);
  const badgeStyle = getCategoryBadgeStyle(product.category?.type);
  const productImage = getProductImage(product.name);
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price);

  const handleClick = () => {
    if (isAdding) return;
    
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Short 50ms vibration
    }
    
    setIsAdding(true);
    onAdd(product);
    
    // Reset after animation
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "product-card group text-left w-full overflow-hidden active:scale-[0.98] transition-transform",
        isAdding && "ring-2 ring-lindezas-gold"
      )}
    >
      {/* Image/Icon Area */}
      <div className="relative h-32 sm:h-36 bg-gradient-to-br from-secondary/30 to-secondary/50 flex items-center justify-center overflow-hidden">
        {productImage ? (
          <img 
            src={productImage} 
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-300",
              isAdding ? "scale-110" : "group-hover:scale-105"
            )}
            loading="lazy"
          />
        ) : (
          <Icon className={cn('h-10 w-10 transition-transform duration-200 group-hover:scale-105', iconColor)} />
        )}
        
        {/* Category Badge */}
        <div className={cn(
          'absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide shadow-sm',
          badgeStyle
        )}>
          {product.category?.name || 'Geral'}
        </div>

        {/* Stock indicator */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-medium shadow-sm">
            Últimas {product.stock}
          </div>
        )}

        {/* Add feedback overlay */}
        <div className={cn(
          "absolute inset-0 bg-lindezas-gold/90 flex items-center justify-center transition-all duration-300",
          isAdding ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 text-lindezas-forest font-bold">
            <Check className="h-6 w-6" />
            <span className="text-lg">+1</span>
          </div>
        </div>

        {/* Add button - visible on hover (desktop) or always visible (mobile) */}
        <div className={cn(
          "absolute bottom-2 right-2 w-9 h-9 rounded-full bg-lindezas-gold text-lindezas-forest flex items-center justify-center shadow-lg transition-all duration-200",
          "sm:opacity-0 sm:group-hover:opacity-100",
          isAdding && "scale-0"
        )}>
          <Plus className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-sans font-semibold text-sm text-lindezas-forest line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="mt-1.5 font-sans text-base sm:text-lg font-bold text-lindezas-gold">
          {formattedPrice}
        </p>
      </div>
    </button>
  );
}
