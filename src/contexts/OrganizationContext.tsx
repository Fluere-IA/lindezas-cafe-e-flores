import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  onboarding_completed?: boolean | null;
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  isMasterAdmin: boolean;
  isLoading: boolean;
  refetchOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, role, isLoading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isMasterAdmin = role === 'admin';

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch organizations with onboarding status
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, created_at, onboarding_completed')
        .order('name');

      if (error) throw error;

      const orgs = data || [];
      setOrganizations(orgs);
      
      // Restore from localStorage if available
      if (orgs.length > 0 && !currentOrganization) {
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const savedOrg = orgs.find(org => org.id === savedOrgId);
        
        if (savedOrg) {
          setCurrentOrganization(savedOrg);
        }
        // For master admins without saved org, don't auto-select
        // For regular users with single org, the SelecionarOrganizacao page handles redirect
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentOrganization]);

  // Fetch organizations when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchOrganizations();
    }
  }, [user, authLoading, fetchOrganizations]);

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
    isLoading: isLoading || authLoading,
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
