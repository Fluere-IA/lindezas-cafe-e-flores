import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
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

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;

      setOrganizations(data || []);
      
      // Don't auto-select for master admins - let them choose
      if (data && data.length > 0 && !currentOrganization) {
        // Try to restore from localStorage
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const savedOrg = data.find(org => org.id === savedOrgId);
        
        // Only auto-select if we have a saved org or if user is not master admin
        if (savedOrg) {
          setCurrentOrganization(savedOrg);
        }
        // If master admin with no saved org, don't auto-select - they need to choose
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchOrganizations();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id);
    }
  }, [currentOrganization]);

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
