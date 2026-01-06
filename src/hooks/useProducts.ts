import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useProducts() {
  const { currentOrganization, isMasterAdmin } = useOrganization();
  
  return useQuery({
    queryKey: ['products', currentOrganization?.id],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('name');
      
      // Filter by organization unless master admin viewing all
      if (currentOrganization && !isMasterAdmin) {
        query = query.eq('organization_id', currentOrganization.id);
      } else if (currentOrganization) {
        query = query.eq('organization_id', currentOrganization.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!currentOrganization || isMasterAdmin,
  });
}

export function useCategories() {
  const { currentOrganization, isMasterAdmin } = useOrganization();
  
  return useQuery({
    queryKey: ['categories', currentOrganization?.id],
    queryFn: async (): Promise<Category[]> => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (currentOrganization) {
        query = query.eq('organization_id', currentOrganization.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentOrganization || isMasterAdmin,
  });
}
