import { BarChart3, TrendingUp, Trophy } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CurrentStatusCard } from '@/components/dashboard/CurrentStatusCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { 
  useDashboardStats, 
  useCurrentStatus,
  useTopProducts, 
  useDailySales
} from '@/hooks/useDashboard';

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: currentStatus, isLoading: statusLoading } = useCurrentStatus();
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts();
  const { data: dailySales, isLoading: dailySalesLoading } = useDailySales();

  return (
    <div className="flex flex-col min-h-screen bg-lindezas-cream">
      <DashboardHeader />
      
      <main className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">
        {/* Page Title */}
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-lindezas-forest/70" />
          <h1 className="font-sans text-xl md:text-2xl font-semibold text-lindezas-forest">Visão Geral</h1>
        </div>

        {/* Current Status - Main Focus */}
        <CurrentStatusCard status={currentStatus} isLoading={statusLoading} />

        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Sales Chart */}
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-lindezas-forest/60" />
            <h2 className="font-sans text-base font-medium text-lindezas-forest">
              Faturamento - Últimos 7 dias
            </h2>
          </div>
          <SalesChart data={dailySales} isLoading={dailySalesLoading} />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-lindezas-gold" />
            <h2 className="font-sans text-base font-medium text-lindezas-forest">
              Mais Vendidos Hoje
            </h2>
          </div>
          <TopProducts products={topProducts} isLoading={topProductsLoading} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
