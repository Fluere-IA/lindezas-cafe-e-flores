import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Safety timeout to prevent infinite loading
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Master admins bypass all role checks
  if (isMasterAdmin) {
    return <>{children}</>;
  }

  // If still loading organizations after force timeout, show a helpful message
  // Don't redirect to onboarding - members joining via invite should wait for data
  if (!currentOrganization && organizations.length === 0) {
    // Show a retry UI instead of redirecting to onboarding
    // This handles the case where membership data hasn't propagated yet
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Carregando sua organização...</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Aguarde enquanto carregamos seus dados.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  // If there are organizations but none selected, auto-select or show loading
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
