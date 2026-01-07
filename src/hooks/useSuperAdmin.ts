import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSuperAdmin() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: isSuperAdmin, isLoading: checkLoading } = useQuery({
    queryKey: ['is-super-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Use the database function is_master_admin
      const { data, error } = await supabase.rpc('is_master_admin', {
        _user_id: user.id,
      });

      if (error) {
        console.error('Error checking super admin status:', error);
        return false;
      }

      return data === true;
    },
    enabled: !!user?.id,
  });

  return {
    isSuperAdmin: isSuperAdmin ?? false,
    isLoading: authLoading || checkLoading,
  };
}
