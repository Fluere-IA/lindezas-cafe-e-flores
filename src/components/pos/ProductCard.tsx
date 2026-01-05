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
      <div className="relative h-36 bg-gradient-to-br from-secondary/30 to-secondary/50 flex items-center justify-center overflow-hidden">
        {productImage ? (
          <>
            <img 
              src={productImage} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Illustrative image notice */}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-[8px] font-medium backdrop-blur-sm">
              Imagem ilustrativa
            </div>
          </>
        ) : (
          <Icon className={cn('h-10 w-10 transition-transform duration-200 group-hover:scale-105', iconColor)} />
        )}
        
        {/* Category Badge */}
        <div className={cn(
          'absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-wide border backdrop-blur-sm',
          badgeStyle
        )}>
          {product.category?.name || 'Geral'}
        </div>

        {/* Stock indicator */}
        {product.stock <= 5 && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-medium">
            Últimas {product.stock}
          </div>
        )}

        {/* Add button */}
        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-lindezas-gold/90 text-lindezas-forest flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Plus className="h-4 w-4" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="font-sans font-semibold text-sm text-lindezas-forest line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="mt-2 font-sans text-lg font-bold text-lindezas-gold">
          {formattedPrice}
        </p>
      </div>
    </button>
  );
}
