import React, { createContext, useContext, ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

export type PlanTier = 'trial' | 'start' | 'pro';

interface SubscriptionContextType {
  subscribed: boolean;
  planName: string | null;
  planTier: PlanTier;
  subscriptionEnd: string | null;
  isLoading: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  trialEnd: string | null;
  refreshSubscription: () => Promise<void>;
  hasAccess: (requiredPlan: PlanTier) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Plan hierarchy for access checks
const planHierarchy: Record<PlanTier, number> = {
  trial: 0,
  start: 1,
  pro: 2,
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscription = useSubscription();

  // Derive plan tier from plan name
  // Note: isInTrial is a parallel state, not a tier - user can have Pro subscription AND be in trial
  const getPlanTier = (): PlanTier => {
    if (!subscription.subscribed) return 'trial';
    
    const planName = subscription.planName?.toLowerCase() || '';
    if (planName.includes('pro') || planName.includes('premium')) return 'pro';
    if (planName.includes('start') || planName.includes('basic')) return 'start';
    
    return 'start'; // Default to start if subscribed but unrecognized plan
  };

  const planTier = getPlanTier();

  // Check if user has access to a feature requiring a specific plan
  const hasAccess = (requiredPlan: PlanTier): boolean => {
    // Trial users get limited access (same as start)
    const effectiveTier = planTier === 'trial' ? 'start' : planTier;
    return planHierarchy[effectiveTier] >= planHierarchy[requiredPlan];
  };

  const value: SubscriptionContextType = {
    ...subscription,
    planTier,
    hasAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
