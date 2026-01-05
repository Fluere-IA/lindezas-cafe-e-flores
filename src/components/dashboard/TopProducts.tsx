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
          className="flex items-center gap-4 p-3 rounded-xl bg-lindezas-cream/70 border border-lindezas-gold/20 animate-fade-in hover:shadow-md transition-all"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-md"
            style={{
              backgroundColor: index === 0 ? '#D4A84B' : index === 1 ? '#8B8B8B' : index === 2 ? '#CD7F32' : '#E8E4DC',
              color: index <= 2 ? '#ffffff' : '#4A3728'
            }}
          >
            {index + 1}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-lindezas-forest truncate">
              {product.productName}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.totalQuantity} vendidos
            </p>
          </div>
          
          <div className="text-right">
            <p className="font-display font-bold text-lindezas-gold">
              {formatCurrency(product.totalRevenue)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
