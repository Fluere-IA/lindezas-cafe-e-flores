import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  requiresSubscription?: boolean;
}

export function ProtectedRoute({ children, requiredRole, requiresSubscription = true }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const { subscribed, isLoading: subLoading, isInTrial } = useSubscriptionContext();
  const location = useLocation();

  // User has access if subscribed OR in trial period
  const hasAccess = subscribed || isInTrial;

  // Wait for auth to load first, then wait for subscription if authenticated and subscription is required
  const isLoading = authLoading || (isAuthenticated && requiresSubscription && subLoading);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check subscription requirement (admins bypass subscription check, trial users have access)
  if (requiresSubscription && !hasAccess && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lindezas-cream">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <Lock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Período de Teste Encerrado</h1>
          <p className="text-slate-600 mb-6">
            Seu período de teste gratuito de 7 dias terminou. Escolha um plano para continuar usando o sistema.
          </p>
          <Button 
            onClick={() => window.location.href = '/#planos'}
            className="bg-lindezas-forest hover:bg-lindezas-forest/90"
          >
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lindezas-cream">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
