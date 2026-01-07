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
      
      let orgs: Organization[] = [];
      
      // Master admins see all organizations
      if (role === 'admin') {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug, created_at, onboarding_completed')
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
            .select('id, name, slug, created_at, onboarding_completed')
            .in('id', orgIds)
            .order('name');

          if (error) throw error;
          orgs = data || [];
        }
      }
      
      setOrganizations(orgs);
      
      // Restore from localStorage if available and valid
      if (orgs.length > 0 && !currentOrganization) {
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const savedOrg = orgs.find(org => org.id === savedOrgId);
        
        if (savedOrg) {
          setCurrentOrganization(savedOrg);
        } else if (orgs.length === 1) {
          // Auto-select if user has only one organization
          setCurrentOrganization(orgs[0]);
          localStorage.setItem('currentOrganizationId', orgs[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, currentOrganization]);

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
