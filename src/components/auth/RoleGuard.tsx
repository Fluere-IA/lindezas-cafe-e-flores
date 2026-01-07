import { Navigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Organization-level roles (from organization_members table)
export type OrgRole = 'owner' | 'admin' | 'member' | 'cashier' | 'kitchen';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: OrgRole[];
  fallback?: 'redirect' | 'denied';
}

export function RoleGuard({ children, allowedRoles, fallback = 'redirect' }: RoleGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrganization, isMasterAdmin } = useOrganization();

  const { data: memberRole, isLoading: roleLoading } = useQuery({
    queryKey: ['member-role', currentOrganization?.id, user?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching member role:', error);
        return null;
      }

      return data?.role as OrgRole | null;
    },
    enabled: !!currentOrganization?.id && !!user?.id,
  });

  const isLoading = authLoading || roleLoading;

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

  // Check if user has allowed role
  const hasAccess = memberRole && allowedRoles.includes(memberRole);

  if (!hasAccess) {
    if (fallback === 'redirect') {
      return <Navigate to="/dashboard" replace />;
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
