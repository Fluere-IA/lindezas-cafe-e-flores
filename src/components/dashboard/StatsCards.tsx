import { DollarSign, ShoppingBag, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardStats } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Vendas Hoje',
      value: stats ? formatCurrency(stats.todaySales) : 'R$ 0,00',
      comparison: stats?.lastWeekSales ? formatCurrency(stats.lastWeekSales) : null,
      growth: stats?.salesGrowth || 0,
      icon: DollarSign,
      iconBg: '#2D5A27',
      borderColor: 'border-lindezas-forest/30',
    },
    {
      title: 'Pedidos Pagos',
      value: stats?.todayOrders?.toString() || '0',
      comparison: stats?.lastWeekOrders?.toString() || null,
      growth: stats?.ordersGrowth || 0,
      icon: ShoppingBag,
      iconBg: '#D4A84B',
      borderColor: 'border-lindezas-gold/40',
    },
    {
      title: 'Ticket Médio',
      value: stats ? formatCurrency(stats.averageTicket) : 'R$ 0,00',
      comparison: null,
      growth: 0,
      icon: TrendingUp,
      iconBg: '#5B8DB8',
      borderColor: 'border-flower-blue/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.growth >= 0;
        const GrowthIcon = isPositive ? ArrowUpRight : ArrowDownRight;
        
        return (
          <div
            key={card.title}
            className={cn(
              'relative overflow-hidden rounded-2xl bg-white border-2 p-5 transition-all hover:shadow-lg animate-fade-in',
              card.borderColor,
              isLoading && 'animate-pulse'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-1 font-display text-3xl font-bold text-lindezas-forest truncate">
                  {isLoading ? '...' : card.value}
                </p>
                
                {/* Comparison with last week */}
                {card.comparison && card.growth !== 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className={cn(
                      'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                      isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      <GrowthIcon className="h-3 w-3" />
                      {Math.abs(card.growth).toFixed(0)}%
                    </div>
                    <span className="text-xs text-muted-foreground">
                      vs semana passada
                    </span>
                  </div>
                )}
              </div>
              <div 
                className="rounded-xl p-3 shadow-md flex-shrink-0"
                style={{ backgroundColor: card.iconBg }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
