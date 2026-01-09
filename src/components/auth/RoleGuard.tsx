import { useState, useEffect, useRef } from 'react';
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
  const { currentOrganization, isMasterAdmin, isLoading: orgLoading, organizations, refetchOrganizations } = useOrganization();
  
  // Safety timeout to prevent infinite loading
  const [forceLoaded, setForceLoaded] = useState(false);
  
  // Auto-retry mechanism for newly invited members
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10;
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceLoaded(true);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  // Auto-retry fetching organizations when none found (for newly invited members)
  useEffect(() => {
    // Only retry if we're loaded, have a user, but no organizations found
    if (!forceLoaded || authLoading || orgLoading) return;
    if (!user) return;
    if (organizations.length > 0) {
      // Found organizations, clear retry
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
      return;
    }
    
    // Start auto-retry
    if (retryCount < maxRetries && !retryIntervalRef.current) {
      retryIntervalRef.current = setInterval(async () => {
        console.log(`[RoleGuard] Retry ${retryCount + 1}/${maxRetries} fetching organizations...`);
        const orgs = await refetchOrganizations();
        setRetryCount(prev => prev + 1);
        
        if (orgs.length > 0 || retryCount + 1 >= maxRetries) {
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
          }
        }
      }, 1500);
    }
    
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    };
  }, [forceLoaded, authLoading, orgLoading, user, organizations.length, retryCount, refetchOrganizations]);

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

  // If still loading organizations and retrying, show loading with retry info
  if (!currentOrganization && organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Carregando sua organização...</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {retryCount < maxRetries 
              ? `Tentativa ${retryCount + 1} de ${maxRetries}...`
              : 'Aguarde enquanto carregamos seus dados.'}
          </p>
          {retryCount >= maxRetries && (
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              Recarregar página
            </button>
          )}
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
