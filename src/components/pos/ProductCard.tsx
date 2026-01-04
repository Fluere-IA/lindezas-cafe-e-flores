import { Plus, Coffee, Sandwich, GlassWater, Flower2 } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

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
    return 'bg-flower-blue/15 text-flower-blue border-flower-blue/25';
  }
  return 'bg-forest/10 text-forest border-forest/20';
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const Icon = getProductIcon(product);
  const iconColor = getIconColor(product);
  const badgeStyle = getCategoryBadgeStyle(product.category?.type);
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price);

  return (
    <button
      onClick={() => onAdd(product)}
      className="product-card group text-left w-full"
    >
      {/* Image/Icon Area */}
      <div className="relative h-32 bg-gradient-to-br from-secondary/50 to-secondary flex items-center justify-center overflow-hidden">
        <Icon className={cn('h-12 w-12 transition-transform group-hover:scale-110', iconColor)} />
        
        {/* Category Badge */}
        <div className={cn(
          'absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
          badgeStyle
        )}>
          {product.category?.name || 'Geral'}
        </div>

        {/* Stock indicator */}
        {product.stock <= 5 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-medium">
            Últimas {product.stock}
          </div>
        )}

        {/* Add overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-md">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="mt-2 font-display text-lg font-semibold text-gold">
          {formattedPrice}
        </p>
      </div>
    </button>
  );
}
