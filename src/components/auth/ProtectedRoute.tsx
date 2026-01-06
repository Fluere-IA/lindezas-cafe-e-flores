import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  requiresSubscription?: boolean;
}

export function ProtectedRoute({ children, requiredRole, requiresSubscription = true }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const { subscribed, planName, isLoading: subLoading } = useSubscription();
  const location = useLocation();

  const isLoading = authLoading || (isAuthenticated && subLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lindezas-cream">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-lindezas-forest mx-auto mb-4" />
          <p className="text-lindezas-forest">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check subscription requirement (admins bypass subscription check)
  if (requiresSubscription && !subscribed && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lindezas-cream">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <Lock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Assinatura Necessária</h1>
          <p className="text-slate-600 mb-6">
            Para acessar o painel, você precisa ter uma assinatura ativa.
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
