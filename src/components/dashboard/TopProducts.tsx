import { Trophy } from 'lucide-react';
import { TopProduct } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

interface TopProductsProps {
  products: TopProduct[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function TopProducts({ products, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-secondary/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mb-3 opacity-30" />
        <p>Nenhuma venda registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div
          key={product.productId}
          className={cn(
            'flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border/30 animate-fade-in',
          )}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm',
            index === 0 && 'bg-gold text-white',
            index === 1 && 'bg-muted-foreground/60 text-white',
            index === 2 && 'bg-espresso text-white',
            index > 2 && 'bg-secondary text-muted-foreground'
          )}>
            {index + 1}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {product.productName}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.totalQuantity} vendidos
            </p>
          </div>
          
          <div className="text-right">
            <p className="font-display font-semibold text-gold">
              {formatCurrency(product.totalRevenue)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
