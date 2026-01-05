import { BarChart3, TrendingUp, Trophy, Clock } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { useDashboardStats, useTopProducts, useDailySales, useRecentOrders } from '@/hooks/useDashboard';

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts();
  const { data: dailySales, isLoading: dailySalesLoading } = useDailySales();
  const { data: recentOrders, isLoading: recentOrdersLoading } = useRecentOrders();

  return (
    <div className="flex flex-col min-h-screen bg-lindezas-cream">
      <DashboardHeader />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Page Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-lindezas-cream border-2 border-lindezas-gold/40 shadow-md">
            <BarChart3 className="h-6 w-6" style={{ color: '#2D5A27' }} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-lindezas-forest">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Charts and Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-lindezas-gold/30 p-6 shadow-lg">
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-lindezas-gold/30 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-lindezas-gold/20">
                <Trophy className="h-5 w-5" style={{ color: '#D4A84B' }} />
              </div>
              <h2 className="font-display text-xl font-bold text-lindezas-forest">
                Mais Vendidos
              </h2>
            </div>
            <TopProducts products={topProducts} isLoading={topProductsLoading} />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-lindezas-gold/30 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-flower-blue/15">
              <Clock className="h-5 w-5 text-flower-blue" />
            </div>
            <h2 className="font-display text-xl font-bold text-lindezas-forest">
              Pedidos Recentes
            </h2>
          </div>
          <RecentOrders orders={recentOrders} isLoading={recentOrdersLoading} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
