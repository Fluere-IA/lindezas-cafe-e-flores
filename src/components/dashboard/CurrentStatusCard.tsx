import { Users, Clock, CheckCircle2, DollarSign, AlertTriangle } from 'lucide-react';
import { CurrentStatus } from '@/hooks/useDashboard';

interface CurrentStatusCardProps {
  status: CurrentStatus | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Returns color based on waiting time (0-5 min: green, 5-10: yellow, 10-15: orange, 15+: red)
function getWaitingColor(minutes: number): { bg: string; text: string; bar: string } {
  if (minutes < 5) return { bg: 'bg-green-100', text: 'text-green-700', bar: '#16a34a' };
  if (minutes < 10) return { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: '#eab308' };
  if (minutes < 15) return { bg: 'bg-orange-100', text: 'text-orange-700', bar: '#f97316' };
  return { bg: 'bg-red-100', text: 'text-red-700', bar: '#dc2626' };
}

function getProgressPercentage(minutes: number): number {
  // Max at 20 minutes = 100%
  return Math.min((minutes / 20) * 100, 100);
}

export function CurrentStatusCard({ status, isLoading }: CurrentStatusCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-lindezas-gold/30 p-6 shadow-lg animate-pulse">
        <div className="h-8 bg-lindezas-cream rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-lindezas-cream rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasPendingOrders = status?.pendingOrdersList && status.pendingOrdersList.length > 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-lindezas-gold/30 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(45, 90, 39, 0.1)' }}>
          <Clock className="h-5 w-5" style={{ color: '#2D5A27' }} />
        </div>
        <h2 className="font-display text-xl font-bold text-lindezas-forest">
          Situação Atual
        </h2>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Ao vivo</span>
        </div>
      </div>

      {/* Waiting Time Progress Bars */}
      {hasPendingOrders && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" style={{ color: '#D4A84B' }} />
            <span className="text-sm font-semibold text-lindezas-forest">Tempo de Espera</span>
          </div>
          
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {status?.pendingOrdersList.slice(0, 5).map((order) => {
              const colors = getWaitingColor(order.minutesWaiting);
              const progress = getProgressPercentage(order.minutesWaiting);
              
              return (
                <div 
                  key={order.orderNumber}
                  className={`rounded-xl p-3 border ${colors.bg}`}
                  style={{ borderColor: colors.bar + '40' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${colors.text}`}>
                        #{order.orderNumber}
                      </span>
                      {order.tableNumber && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-muted-foreground">
                          Mesa {order.tableNumber}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${colors.text}`}>
                      {order.minutesWaiting} min
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: colors.bar,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {status?.pendingOrdersList && status.pendingOrdersList.length > 5 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              +{status.pendingOrdersList.length - 5} pedidos pendentes
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tables */}
        <div className="bg-lindezas-cream/70 rounded-xl p-4 border border-lindezas-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" style={{ color: '#2D5A27' }} />
            <span className="text-xs font-medium text-muted-foreground">Mesas Ocupadas</span>
          </div>
          <p className="font-display text-3xl font-bold text-lindezas-forest">
            {status?.activeTables.length || 0}
          </p>
          {status?.activeTables && status.activeTables.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {status.activeTables.slice(0, 6).map(table => (
                <span 
                  key={table} 
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#2D5A27', color: '#ffffff' }}
                >
                  {table}
                </span>
              ))}
              {status.activeTables.length > 6 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  +{status.activeTables.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pending Orders */}
        <div className="bg-lindezas-cream/70 rounded-xl p-4 border border-lindezas-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" style={{ color: '#D4A84B' }} />
            <span className="text-xs font-medium text-muted-foreground">Pendentes</span>
          </div>
          <p className="font-display text-3xl font-bold" style={{ color: '#D4A84B' }}>
            {status?.pendingOrders || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">aguardando preparo</p>
        </div>

        {/* Ready Orders */}
        <div className="bg-lindezas-cream/70 rounded-xl p-4 border border-lindezas-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4" style={{ color: '#16a34a' }} />
            <span className="text-xs font-medium text-muted-foreground">Feitos</span>
          </div>
          <p className="font-display text-3xl font-bold" style={{ color: '#16a34a' }}>
            {status?.readyOrders || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">prontos para servir</p>
        </div>

        {/* Open Amount */}
        <div className="bg-lindezas-cream/70 rounded-xl p-4 border border-lindezas-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4" style={{ color: '#2D5A27' }} />
            <span className="text-xs font-medium text-muted-foreground">Em Aberto</span>
          </div>
          <p className="font-display text-2xl font-bold text-lindezas-forest">
            {formatCurrency(status?.totalOpenAmount || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">a receber</p>
        </div>
      </div>
    </div>
  );
}
