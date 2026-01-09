import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldX, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

// Organization-level roles (from organization_members table)
export type OrgRole = 'owner' | 'admin' | 'member' | 'cashier' | 'kitchen' | 'waiter';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: OrgRole[];
  fallback?: 'redirect' | 'denied';
}

export function RoleGuard({ children, allowedRoles, fallback = 'redirect' }: RoleGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrganization, isMasterAdmin, isLoading: orgLoading, organizations } = useOrganization();
  
  // Safety timeout to prevent infinite loading (5 seconds)
  const [forceLoaded, setForceLoaded] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceLoaded(true);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const { data: memberRole, isLoading: roleLoading } = useQuery({
    queryKey: ['member-role', currentOrganization?.id, user?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching member role:', error);
        return null;
      }

      return data?.role as OrgRole | null;
    },
    enabled: !!currentOrganization?.id && !!user?.id,
  });

  // Wait for auth and org loading states, with safety timeout
  const isLoading = !forceLoaded && (authLoading || orgLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Master admins bypass all role checks
  if (isMasterAdmin) {
    return <>{children}</>;
  }

  // If no organization found after timeout, show clear error with actions
  if (!currentOrganization && organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border border-border">
          <ShieldX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Organização não encontrada</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Não foi possível carregar sua organização. Isso pode acontecer se o convite ainda não foi processado.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar página
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.assign('/auth')}
              className="w-full"
            >
              Ir para login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If there are organizations but none selected, show loading briefly
  if (!currentOrganization && organizations.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user has allowed role
  const hasAccess = memberRole && allowedRoles.includes(memberRole);

  if (!hasAccess) {
    if (fallback === 'redirect') {
      // Redirect to appropriate page based on role
      let redirectTo = '/pedidos'; // Default for most roles
      if (memberRole === 'kitchen') {
        redirectTo = '/cozinha';
      } else if (memberRole === 'cashier') {
        redirectTo = '/caixa';
      }
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border border-border">
          <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
