import { Banknote, CreditCard, QrCode } from 'lucide-react';
import { PaymentMethodStats } from '@/hooks/useDashboard';

interface PaymentMethodsCardProps {
  stats: PaymentMethodStats[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const methodConfig: Record<string, { icon: typeof Banknote; label: string; color: string }> = {
  dinheiro: { icon: Banknote, label: 'Dinheiro', color: '#16a34a' },
  cartao: { icon: CreditCard, label: 'Cartão', color: '#3b82f6' },
  pix: { icon: QrCode, label: 'PIX', color: '#8b5cf6' },
};

export function PaymentMethodsCard({ stats, isLoading }: PaymentMethodsCardProps) {
  const total = stats?.reduce((sum, s) => sum + s.total, 0) || 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-lindezas-gold/30 p-6 shadow-lg animate-pulse">
        <div className="h-6 bg-lindezas-cream rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-lindezas-cream rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-lindezas-gold/30 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212, 168, 75, 0.2)' }}>
          <CreditCard className="h-5 w-5" style={{ color: '#D4A84B' }} />
        </div>
        <h2 className="font-display text-xl font-bold text-lindezas-forest">
          Pagamentos Hoje
        </h2>
      </div>

      {(!stats || stats.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Nenhum pagamento registrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((stat) => {
            const config = methodConfig[stat.method] || methodConfig.dinheiro;
            const Icon = config.icon;
            const percentage = total > 0 ? (stat.total / total) * 100 : 0;

            return (
              <div 
                key={stat.method}
                className="bg-lindezas-cream/70 rounded-xl p-4 border border-lindezas-gold/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: config.color }} />
                    </div>
                    <span className="font-semibold text-lindezas-forest">{config.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.count}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="h-2 bg-lindezas-cream rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: config.color 
                        }}
                      />
                    </div>
                  </div>
                  <span className="font-display font-bold text-lindezas-forest">
                    {formatCurrency(stat.total)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="pt-3 border-t-2 border-lindezas-gold/20 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">Total recebido</span>
              <span className="font-display text-2xl font-bold text-lindezas-gold">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
