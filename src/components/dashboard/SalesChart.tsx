import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailySales } from '@/hooks/useDashboard';

interface SalesChartProps {
  data: DailySales[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function SalesChart({ data, isLoading }: SalesChartProps) {
  if (isLoading) {
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

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
  );
}
