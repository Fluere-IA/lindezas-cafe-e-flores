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
      iconBg: '#2D5A27',
      borderColor: 'border-lindezas-forest/30',
    },
    {
      title: 'Pedidos Hoje',
      value: stats?.todayOrders?.toString() || '0',
      icon: ShoppingBag,
      iconBg: '#D4A84B',
      borderColor: 'border-lindezas-gold/40',
    },
    {
      title: 'Ticket Médio',
      value: stats ? formatCurrency(stats.averageTicket) : 'R$ 0,00',
      icon: TrendingUp,
      iconBg: '#5B8DB8',
      borderColor: 'border-flower-blue/30',
    },
    {
      title: 'Em Preparo',
      value: stats?.pendingOrders?.toString() || '0',
      icon: Clock,
      iconBg: '#5C4033',
      borderColor: 'border-lindezas-espresso/30',
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
              'relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border-2 p-5 transition-all hover:shadow-lg animate-fade-in',
              card.borderColor,
              isLoading && 'animate-pulse'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-2 font-display text-3xl font-bold text-lindezas-forest">
                  {isLoading ? '...' : card.value}
                </p>
              </div>
              <div 
                className="rounded-xl p-3 shadow-md"
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
