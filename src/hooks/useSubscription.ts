import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionState {
  subscribed: boolean;
  planName: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  trialEnd: string | null;
}

export function useSubscription() {
  const { isAuthenticated, session } = useAuth();
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    subscribed: false,
    planName: null,
    subscriptionEnd: null,
    isLoading: true,
    isInTrial: false,
    trialDaysRemaining: 0,
    trialEnd: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!isAuthenticated || !session) {
      setSubscriptionState(prev => ({ ...prev, isLoading: false, subscribed: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setSubscriptionState({
        subscribed: data?.subscribed || false,
        planName: data?.plan_name || null,
        subscriptionEnd: data?.subscription_end || null,
        isLoading: false,
        isInTrial: data?.is_in_trial || false,
        trialDaysRemaining: data?.trial_days_remaining || 0,
        trialEnd: data?.trial_end || null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, session]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh subscription status every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkSubscription]);

  return {
    ...subscriptionState,
    refreshSubscription: checkSubscription,
  };
}
