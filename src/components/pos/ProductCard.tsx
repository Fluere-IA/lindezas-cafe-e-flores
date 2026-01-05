import { Plus, Coffee, Sandwich, GlassWater, Flower2 } from 'lucide-react';
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
    return 'bg-flower-blue/15 text-flower-blue border-flower-blue/25';
  }
  return 'bg-forest/10 text-forest border-forest/20';
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const Icon = getProductIcon(product);
  const iconColor = getIconColor(product);
  const badgeStyle = getCategoryBadgeStyle(product.category?.type);
  const productImage = getProductImage(product.name);
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price);

  return (
    <button
      onClick={() => onAdd(product)}
      className="product-card group text-left w-full overflow-hidden"
    >
      {/* Image/Icon Area */}
      <div className="relative h-32 bg-gradient-to-br from-secondary/40 to-secondary/70 flex items-center justify-center overflow-hidden">
        {productImage ? (
          <img 
            src={productImage} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <Icon className={cn('h-10 w-10 transition-transform duration-300 group-hover:scale-110', iconColor)} />
        )}
        
        {/* Category Badge */}
        <div className={cn(
          'absolute top-2 left-2 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border backdrop-blur-md shadow-sm',
          badgeStyle
        )}>
          {product.category?.name || 'Geral'}
        </div>

        {/* Stock indicator */}
        {product.stock <= 5 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-sm">
            Últimas {product.stock}
          </div>
        )}

        {/* Add overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-gold text-forest flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-elevated">
          <Plus className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 bg-gradient-to-b from-card to-card/80">
        <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="mt-2 font-display text-xl font-bold text-gold">
          {formattedPrice}
        </p>
      </div>
    </button>
  );
}
