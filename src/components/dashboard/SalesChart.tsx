import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailySales } from '@/hooks/useDashboard';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SalesChartProps {
  data: DailySales[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function SalesChart({ data, isLoading }: SalesChartProps) {
  const navigate = useNavigate();
  const { hasAccess, isLoading: subLoading } = useSubscriptionContext();
  const isPro = hasAccess('pro');

  if (isLoading || subLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-secondary/30 rounded-lg animate-pulse">
        <p className="text-muted-foreground">Carregando gráfico...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-secondary/30 rounded-lg">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  // For non-pro users, show limited data (only last 3 days) with blur overlay
  const displayData = isPro ? data : data.slice(-3);

  return (
    <div className="relative">
      <div className={`h-[300px] w-full ${!isPro ? 'blur-sm pointer-events-none' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(150, 33%, 26%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(150, 33%, 26%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(43, 30%, 88%)" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(150, 15%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(150, 15%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(43, 50%, 99%)',
                border: '1px solid hsl(43, 30%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
              labelStyle={{ color: 'hsl(150, 33%, 26%)', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(150, 33%, 26%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Upgrade overlay for non-pro users */}
      {!isPro && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/80 to-transparent rounded-lg">
          <div className="text-center p-4 bg-background/95 rounded-xl border border-amber-200 shadow-lg max-w-xs">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium text-foreground mb-2">
              Gráfico completo de 7 dias
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Veja o histórico completo de vendas com o plano Pro
            </p>
            <Button 
              size="sm"
              onClick={() => navigate('/assinatura')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs"
            >
              <Crown className="h-3 w-3 mr-1" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
