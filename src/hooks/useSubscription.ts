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
        
        // Parse error response for status code and error details
        let errorData = null;
        try {
          // FunctionsHttpError has context.response that needs to be parsed
          if (error.context?.body) {
            errorData = JSON.parse(error.context.body);
          }
        } catch (e) {
          // Ignore parse errors
        }
        
        // Check for 401 status or invalid session errors
        const isInvalidSession = 
          error.context?.status === 401 ||
          errorData?.code === 'INVALID_SESSION' ||
          error.message?.includes('INVALID_SESSION') ||
          error.message?.includes('user_not_found') || 
          error.message?.includes('does not exist');
        
        if (isInvalidSession) {
          console.log('User session invalid, signing out...');
          await supabase.auth.signOut();
          localStorage.removeItem('currentOrganizationId');
          window.location.href = '/auth';
          return;
        }
        
        setSubscriptionState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      // Also check if the response itself indicates invalid session
      if (data?.code === 'INVALID_SESSION') {
        console.log('User session invalid (from response), signing out...');
        await supabase.auth.signOut();
        localStorage.removeItem('currentOrganizationId');
        window.location.href = '/auth';
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
