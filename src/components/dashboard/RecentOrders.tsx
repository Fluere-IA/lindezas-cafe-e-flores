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
            className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border/30 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {order.mode === 'mesa' ? (
                <Users className="h-5 w-5 text-primary" />
              ) : (
                <Store className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-foreground">
                  Pedido #{order.orderNumber}
                </p>
                {order.mode === 'mesa' && order.tableNumber && (
                  <span className="text-xs text-muted-foreground">
                    Mesa {order.tableNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(order.createdAt), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
            
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
              status.className
            )}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span>{status.label}</span>
            </div>
            
            <div className="text-right min-w-[80px]">
              <p className="font-display font-semibold text-gold">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
