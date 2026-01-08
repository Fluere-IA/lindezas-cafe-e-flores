import { lazy, Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PlanGuard } from '@/components/subscription/PlanGuard';
import { useReports, PeriodFilter } from '@/hooks/useReports';
import { DRECard } from '@/components/reports/DRECard';
import { ABCChart } from '@/components/reports/ABCChart';
import { HeatmapChart } from '@/components/reports/HeatmapChart';
import { AuditCard } from '@/components/reports/AuditCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, TrendingUp, FileText, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function ReportsContent() {
  const { period, setPeriod, periodLabel, dre, abc, heatmap, audit } = useReports();

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Últimos 7 dias' },
    { value: 'month', label: 'Este Mês' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Relatórios Avançados
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise financeira e desempenho de produtos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">
                  {dre.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(dre.data?.receitaBruta || 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos Vendidos</p>
                <p className="text-2xl font-bold">
                  {abc.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    abc.data?.reduce((sum, p) => sum + p.quantity, 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className="text-2xl font-bold">
                  {dre.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `${(dre.data?.margemLucro || 0).toFixed(1)}%`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DRECard
          data={dre.data}
          isLoading={dre.isLoading}
          periodLabel={periodLabel}
        />
        <ABCChart
          data={abc.data}
          isLoading={abc.isLoading}
          periodLabel={periodLabel}
        />
      </div>

      {/* Pro Features: Heatmap and Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeatmapChart
          data={heatmap.data}
          isLoading={heatmap.isLoading}
          periodLabel={periodLabel}
        />
        <AuditCard
          data={audit.data}
          isLoading={audit.isLoading}
          periodLabel={periodLabel}
        />
      </div>

      {/* Additional Info */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Sobre os Cálculos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                O <strong>CMV (Custo de Mercadoria Vendida)</strong> está estimado em 35% da receita bruta, 
                que é a média do setor de alimentação. Para um cálculo preciso, configure a ficha técnica 
                dos seus produtos na seção de Estoque.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                A <strong>Curva ABC</strong> classifica produtos: <span className="text-emerald-600 font-medium">A</span> (80% da receita), 
                <span className="text-amber-600 font-medium"> B</span> (15%), e <span className="text-slate-500 font-medium">C</span> (5%). 
                Foque nos produtos A para maximizar lucros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Relatorios() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <PlanGuard
          requiredPlan="pro"
          featureName="Relatórios Avançados"
          description="Acesse análises financeiras detalhadas, DRE simplificado e Curva ABC de produtos com o plano Pro."
        >
          <ReportsContent />
        </PlanGuard>
      </main>
    </div>
  );
}
