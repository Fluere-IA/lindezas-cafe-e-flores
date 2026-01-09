import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  type?: string | null;
  table_count?: number | null;
  created_at: string;
  onboarding_completed?: boolean | null;
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  isMasterAdmin: boolean;
  isLoading: boolean;
  refetchOrganizations: () => Promise<Organization[]>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check master admin status from user_roles
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  // Check master admin status
  useEffect(() => {
    const checkMasterAdmin = async () => {
      if (!user) {
        setIsMasterAdmin(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsMasterAdmin(!!data);
      } catch {
        setIsMasterAdmin(false);
      }
    };
    checkMasterAdmin();
  }, [user?.id]);

  // Fetch with retry logic for newly created users
  const fetchOrganizations = useCallback(async (retries = 5): Promise<Organization[]> => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      localStorage.removeItem('currentOrganizationId');
      return [];
    }

    try {
      setIsLoading(true);
      
      let orgs: Organization[] = [];
      
      // Master admins see all organizations
      if (isMasterAdmin) {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug, phone, type, table_count, created_at, onboarding_completed')
          .order('name');

        if (error) throw error;
        orgs = data || [];
      } else {
        // Regular users only see organizations they belong to
        const { data: memberOrgs, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        if (memberOrgs && memberOrgs.length > 0) {
          const orgIds = memberOrgs.map(m => m.organization_id);
          const { data, error } = await supabase
            .from('organizations')
            .select('id, name, slug, phone, type, table_count, created_at, onboarding_completed')
            .in('id', orgIds)
            .order('name');

          if (error) throw error;
          orgs = data || [];
        }
      }
      
      // Retry logic for newly registered users
      if (orgs.length === 0 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return fetchOrganizations(retries - 1);
      }
      
      setOrganizations(orgs);
      
      // Update currentOrganization with fresh data
      if (orgs.length > 0) {
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        
        setCurrentOrganization(prev => {
          const currentOrgId = prev?.id || savedOrgId;
          const matchedOrg = orgs.find(org => org.id === currentOrgId);
          
          if (matchedOrg) {
            localStorage.setItem('currentOrganizationId', matchedOrg.id);
            return matchedOrg;
          } else if (orgs.length === 1) {
            localStorage.setItem('currentOrganizationId', orgs[0].id);
            return orgs[0];
          }
          return prev;
        });
      }
      
      return orgs;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, isMasterAdmin]);

  // Fetch organizations when user changes and auth is done loading
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // If no user, clear state
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }
    
    // Fetch organizations
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // Persist current organization to localStorage
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id);
    }
  }, [currentOrganization]);

  // Subscribe to organization changes in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('org-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organizations',
        },
        () => {
          // Refetch when organizations change
          fetchOrganizations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrganizations]);

  const value: OrganizationContextType = {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    isMasterAdmin,
    isLoading,
    refetchOrganizations: fetchOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
