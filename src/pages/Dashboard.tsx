import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, Trophy, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CurrentStatusCard } from '@/components/dashboard/CurrentStatusCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { TrialBanner } from '@/components/dashboard/TrialBanner';
import { useSubscription } from '@/hooks/useSubscription';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  useDashboardStats, 
  useCurrentStatus,
  useTopProducts, 
  useDailySales
} from '@/hooks/useDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrganization, isLoading: orgLoading, refetchOrganizations } = useOrganization();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: currentStatus, isLoading: statusLoading } = useCurrentStatus();
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts();
  const { data: dailySales, isLoading: dailySalesLoading } = useDailySales();
  const { isInTrial, trialDaysRemaining, subscribed } = useSubscription();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  // Redirect to onboarding if not completed (null or false means not completed)
  useEffect(() => {
    if (orgLoading || hasCheckedOnboarding) return;

    const checkOnboarding = async () => {
      // If coming from onboarding (replace navigation), refetch to get updated state
      if (location.state?.fromOnboarding) {
        await refetchOrganizations();
      }
      
      setHasCheckedOnboarding(true);
      
      if (currentOrganization && currentOrganization.onboarding_completed !== true) {
        navigate('/onboarding', { replace: true });
      }
    };

    checkOnboarding();
  }, [orgLoading, currentOrganization, navigate, hasCheckedOnboarding, location.state, refetchOrganizations]);

  // Show loading while checking organization
  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="flex-1 p-4 md:p-5 space-y-4 overflow-y-auto">
        {/* Trial Banner */}
        {isInTrial && !subscribed && (
          <TrialBanner daysRemaining={trialDaysRemaining} />
        )}
        {/* Main Status Cards */}
        <CurrentStatusCard 
          status={currentStatus} 
          stats={stats}
          isLoading={statsLoading || statusLoading} 
        />

        {/* Sales Chart */}
        <div className="bg-white rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary/60" />
            <h2 className="text-sm font-medium text-foreground">Últimos 7 dias</h2>
          </div>
          <SalesChart data={dailySales} isLoading={dailySalesLoading} />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-medium text-foreground">Mais Vendidos Hoje</h2>
          </div>
          <TopProducts products={topProducts} isLoading={topProductsLoading} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
