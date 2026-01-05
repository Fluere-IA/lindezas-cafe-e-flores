import { Users, DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { CurrentStatus, DashboardStats } from '@/hooks/useDashboard';

interface CurrentStatusCardProps {
  status: CurrentStatus | undefined;
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CurrentStatusCard({ status, stats, isLoading }: CurrentStatusCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-white rounded-xl border border-border/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Mesas Ocupadas',
      value: status?.activeTables.length || 0,
      icon: Users,
      color: '#2D5A27',
      tables: status?.activeTables || [],
    },
    {
      label: 'Em Aberto',
      value: formatCurrency(status?.totalOpenAmount || 0),
      subtext: 'a receber',
      icon: Wallet,
      color: '#D4A84B',
    },
    {
      label: 'Vendas Hoje',
      value: formatCurrency(stats?.todaySales || 0),
      growth: stats?.salesGrowth,
      icon: DollarSign,
      color: '#2D5A27',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(stats?.averageTicket || 0),
      icon: TrendingUp,
      color: '#5B8DB8',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-border/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <Icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            
            <p className="text-2xl font-semibold text-lindezas-forest">
              {card.value}
            </p>
            
            {card.subtext && (
              <p className="text-xs text-muted-foreground mt-0.5">{card.subtext}</p>
            )}
            
            {card.growth !== undefined && card.growth !== 0 && (
              <p className={`text-xs mt-1 font-medium ${card.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {card.growth >= 0 ? '+' : ''}{card.growth.toFixed(0)}% vs semana passada
              </p>
            )}
            
            {card.tables && card.tables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {card.tables.slice(0, 6).map(table => (
                  <span 
                    key={table} 
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: '#2D5A27', color: '#ffffff' }}
                  >
                    {table}
                  </span>
                ))}
                {card.tables.length > 6 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                    +{card.tables.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
