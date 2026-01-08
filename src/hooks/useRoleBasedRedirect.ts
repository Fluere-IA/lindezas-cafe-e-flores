import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type OrgRole = 'owner' | 'admin' | 'member' | 'cashier' | 'kitchen' | 'waiter';

export function useRoleBasedRedirect() {
  const getRedirectPath = useCallback(async (userId: string): Promise<string> => {
    try {
      // First check if user is master admin
      const { data: isMasterAdmin } = await supabase.rpc('is_master_admin', { _user_id: userId });
      
      if (isMasterAdmin) {
        return '/dashboard';
      }

      // Get user's organization membership and role
      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error || !membership) {
        // No membership found, might be a new owner or error
        return '/dashboard';
      }

      const role = membership.role as OrgRole;

      // Redirect based on role
      switch (role) {
        case 'kitchen':
          return '/cozinha';
        case 'cashier':
          return '/caixa';
        case 'member':
        case 'waiter':
          return '/pedidos';
        case 'owner':
        case 'admin':
        default:
          return '/dashboard';
      }
    } catch (error) {
      console.error('Error getting redirect path:', error);
      return '/dashboard';
    }
  }, []);

  return { getRedirectPath };
}
