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
      
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* Page Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-lindezas-cream border-2 border-lindezas-gold/40 shadow-md">
            <BarChart3 className="h-6 w-6" style={{ color: '#2D5A27' }} />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-lindezas-forest">Visão Geral</h1>
        </div>

        {/* Current Status - Main Focus */}
        <CurrentStatusCard status={currentStatus} isLoading={statusLoading} />

        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Sales Chart */}
        <div className="bg-white rounded-2xl border-2 border-lindezas-gold/30 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-lindezas-forest/10">
              <TrendingUp className="h-5 w-5" style={{ color: '#2D5A27' }} />
            </div>
            <h2 className="font-display text-xl font-bold text-lindezas-forest">
              Faturamento - Últimos 7 dias
            </h2>
          </div>
          <SalesChart data={dailySales} isLoading={dailySalesLoading} />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border-2 border-lindezas-gold/30 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-lindezas-gold/20">
              <Trophy className="h-5 w-5" style={{ color: '#D4A84B' }} />
            </div>
            <h2 className="font-display text-xl font-bold text-lindezas-forest">
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
