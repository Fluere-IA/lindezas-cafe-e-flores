import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Store, Users, Clock, CheckCircle, XCircle, ChefHat } from 'lucide-react';
import { RecentOrder } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

interface RecentOrdersProps {
  orders: RecentOrder[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: 'Pendente', icon: Clock, className: 'text-gold bg-gold/10' },
  preparing: { label: 'Preparando', icon: ChefHat, className: 'text-flower-blue bg-flower-blue/10' },
  ready: { label: 'Pronto', icon: CheckCircle, className: 'text-forest bg-forest/10' },
  completed: { label: 'Concluído', icon: CheckCircle, className: 'text-forest bg-forest/10' },
  cancelled: { label: 'Cancelado', icon: XCircle, className: 'text-destructive bg-destructive/10' },
};

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Store className="h-12 w-12 mb-3 opacity-30" />
        <p>Nenhum pedido recente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order, index) => {
        const status = statusConfig[order.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        
        return (
          <div
            key={order.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-lindezas-cream/70 border border-lindezas-gold/20 animate-fade-in hover:shadow-md transition-all"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: '#2D5A27' }}
            >
              {order.mode === 'mesa' ? (
                <Users className="h-5 w-5 text-white" />
              ) : (
                <Store className="h-5 w-5 text-white" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {order.mode === 'mesa' && order.tableNumber ? (
                  <p className="font-semibold text-sm text-lindezas-forest">
                    Mesa {order.tableNumber}
                  </p>
                ) : (
                  <p className="font-semibold text-sm text-lindezas-forest">
                    Balcão
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(order.createdAt), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
            
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
              status.className
            )}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span>{status.label}</span>
            </div>
            
            <div className="text-right min-w-[90px]">
              <p className="font-display font-bold text-lg text-lindezas-gold">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
