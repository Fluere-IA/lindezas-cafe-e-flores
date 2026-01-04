import { DollarSign, ShoppingBag, TrendingUp, Clock } from 'lucide-react';
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
      icon: DollarSign,
      color: 'bg-forest/10 text-forest',
      iconBg: 'bg-forest',
    },
    {
      title: 'Pedidos Hoje',
      value: stats?.todayOrders?.toString() || '0',
      icon: ShoppingBag,
      color: 'bg-gold/10 text-gold',
      iconBg: 'bg-gold',
    },
    {
      title: 'Ticket Médio',
      value: stats ? formatCurrency(stats.averageTicket) : 'R$ 0,00',
      icon: TrendingUp,
      color: 'bg-flower-blue/10 text-flower-blue',
      iconBg: 'bg-flower-blue',
    },
    {
      title: 'Em Preparo',
      value: stats?.pendingOrders?.toString() || '0',
      icon: Clock,
      color: 'bg-latte/20 text-espresso',
      iconBg: 'bg-espresso',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={cn(
              'relative overflow-hidden rounded-xl bg-card border border-border p-5 transition-all hover:shadow-card animate-fade-in',
              isLoading && 'animate-pulse'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">
                  {isLoading ? '...' : card.value}
                </p>
              </div>
              <div className={cn('rounded-lg p-2.5', card.iconBg)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
