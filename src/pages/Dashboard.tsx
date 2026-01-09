import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Trophy } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CurrentStatusCard } from '@/components/dashboard/CurrentStatusCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { TrialBanner } from '@/components/dashboard/TrialBanner';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';
import { Button } from '@/components/ui/button';
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
  
  // Track retry attempts for organization fetch
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 10; // Increased for newly invited members

  // Auto-retry fetching organization if not found
  useEffect(() => {
    if (!orgLoading && !currentOrganization && retryCount < maxRetries && !isRetrying) {
      setIsRetrying(true);
      const timer = setTimeout(async () => {
        console.log(`Dashboard: Retrying organization fetch (${retryCount + 1}/${maxRetries})`);
        await refetchOrganizations();
        setRetryCount(prev => prev + 1);
        setIsRetrying(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [orgLoading, currentOrganization, retryCount, isRetrying, refetchOrganizations]);

  // Redirect to onboarding ONLY for owners whose org hasn't completed onboarding
  useEffect(() => {
    if (orgLoading || hasCheckedOnboarding) return;

    const checkOnboarding = async () => {
      setHasCheckedOnboarding(true);
      
      // If coming from onboarding, trust the navigation state - don't redirect back
      if (location.state?.fromOnboarding) {
        return;
      }
      
      // Only redirect to onboarding if:
      // 1. Organization exists
      // 2. Onboarding is not completed
      // 3. AND the user is the owner of this organization
      if (currentOrganization && currentOrganization.onboarding_completed !== true) {
        // Check if current user is the owner
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', currentOrganization.id)
          .eq('user_id', user.id)
          .single();
        
        // Only redirect owners to onboarding - members should use the system as-is
        if (membership?.role === 'owner') {
          navigate('/onboarding', { replace: true });
        }
      }
    };

    checkOnboarding();
  }, [orgLoading, currentOrganization, navigate, hasCheckedOnboarding, location.state]);

  // Show skeleton while checking organization or retrying
  if (orgLoading || isRetrying || (!currentOrganization && retryCount < maxRetries)) {
    return <DashboardSkeleton />;
  }

  // If no organization found after loading and all retries, show error state
  if (!currentOrganization) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-5 flex items-center justify-center">
          <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border border-border">
            <h1 className="text-xl font-bold text-foreground mb-2">Nenhuma organização encontrada</h1>
            <p className="text-muted-foreground mb-4">
              Aguarde enquanto carregamos os dados ou tente recarregar a página.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline"
                onClick={async () => {
                  setRetryCount(0);
                  setIsRetrying(true);
                  await refetchOrganizations();
                  setIsRetrying(false);
                }}
              >
                Tentar novamente
              </Button>
              <Button onClick={() => window.location.reload()}>
                Recarregar página
              </Button>
            </div>
          </div>
        </main>
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
