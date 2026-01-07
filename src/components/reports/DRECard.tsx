import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DREData {
  receitaBruta: number;
  custos: number;
  lucroOperacional: number;
  margemLucro: number;
}

interface DRECardProps {
  data: DREData | null;
  isLoading: boolean;
  periodLabel: string;
}

export function DRECard({ data, isLoading, periodLabel }: DRECardProps) {
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
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            DRE Simplificado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado disponível para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isProfit = data.lucroOperacional >= 0;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            DRE Simplificado
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {periodLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-1">
        {/* Receita Bruta */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Bruta</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(data.receitaBruta)}
              </p>
            </div>
          </div>
          <TrendingUp className="h-8 w-8 text-emerald-500/30" />
        </div>

        {/* Custos Estimados */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Custos (CMV ~35%)</p>
              <p className="text-xl font-bold text-red-600">
                - {formatCurrency(data.custos)}
              </p>
            </div>
          </div>
          <TrendingDown className="h-8 w-8 text-red-500/30" />
        </div>

        {/* Separador */}
        <div className="border-t border-dashed border-border my-2" />

        {/* Lucro Operacional */}
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          isProfit 
            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30' 
            : 'bg-gradient-to-r from-red-500/20 to-red-600/10 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isProfit ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}>
              <DollarSign className={`h-5 w-5 ${isProfit ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lucro Operacional</p>
              <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(data.lucroOperacional)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Margem</p>
            <p className={`text-lg font-semibold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              {data.margemLucro.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
