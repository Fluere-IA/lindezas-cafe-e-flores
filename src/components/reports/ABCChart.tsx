import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ABCProduct {
  name: string;
  revenue: number;
  quantity: number;
  percentage: number;
  classification: 'A' | 'B' | 'C';
}

interface ABCChartProps {
  data: ABCProduct[] | null;
  isLoading: boolean;
  periodLabel: string;
}

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--primary))',
  },
};

const classificationColors = {
  A: 'hsl(142, 76%, 36%)', // emerald
  B: 'hsl(45, 93%, 47%)',  // amber
  C: 'hsl(220, 14%, 60%)', // slate
};

export function ABCChart({ data, isLoading, periodLabel }: ABCChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Curva ABC de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum produto vendido no período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Curva ABC - Top Produtos
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {periodLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={32}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={classificationColors[entry.classification]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend & Details */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Curva A (80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Curva B (15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-muted-foreground">Curva C (5%)</span>
            </div>
          </div>

          {/* Product Details */}
          <div className="border-t pt-4 space-y-2">
            {data.slice(0, 5).map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      product.classification === 'A'
                        ? 'bg-emerald-500'
                        : product.classification === 'B'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.quantity} vendas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.percentage.toFixed(1)}% do total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
