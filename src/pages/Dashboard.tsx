import { TrendingUp, Trophy } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
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
      
      <main className="flex-1 p-4 md:p-5 space-y-4 overflow-y-auto">
        {/* Main Status Cards */}
        <CurrentStatusCard 
          status={currentStatus} 
          stats={stats}
          isLoading={statsLoading || statusLoading} 
        />

        {/* Sales Chart */}
        <div className="bg-white rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-lindezas-forest/60" />
            <h2 className="text-sm font-medium text-lindezas-forest">Últimos 7 dias</h2>
          </div>
          <SalesChart data={dailySales} isLoading={dailySalesLoading} />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-lindezas-gold" />
            <h2 className="text-sm font-medium text-lindezas-forest">Mais Vendidos Hoje</h2>
          </div>
          <TopProducts products={topProducts} isLoading={topProductsLoading} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
