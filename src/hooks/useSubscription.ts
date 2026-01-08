import { useState, useEffect, useCallback, useRef } from 'react';
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
  const { isAuthenticated, session, isLoading: authLoading } = useAuth();
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    subscribed: false,
    planName: null,
    subscriptionEnd: null,
    isLoading: true,
    isInTrial: false,
    trialDaysRemaining: 0,
    trialEnd: null,
  });
  
  // Track retry attempts to avoid logout on temporary issues
  const retryCountRef = useRef(0);
  const isCheckingRef = useRef(false);

  const checkSubscription = useCallback(async (isInitialCheck = false) => {
    // Don't check if auth is still loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !session) {
      setSubscriptionState(prev => ({ ...prev, isLoading: false, subscribed: false }));
      return;
    }

    // Prevent concurrent calls
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      // Ensure we have a valid, fresh session before calling the edge function
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        console.log('No valid session available, skipping subscription check');
        setSubscriptionState(prev => ({ ...prev, isLoading: false, subscribed: false }));
        isCheckingRef.current = false;
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        
        // Parse error response for status code and error details
        let errorData = null;
        try {
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
          retryCountRef.current++;
          
          // Only logout after multiple failed attempts and not during initial load
          if (retryCountRef.current >= 3 && !isInitialCheck) {
            console.log('User session invalid after retries, signing out...');
            await supabase.auth.signOut();
            localStorage.removeItem('currentOrganizationId');
            window.location.href = '/auth';
            isCheckingRef.current = false;
            return;
          }
          
          // For initial check or first retries, just wait and try again later
          console.log(`Auth error during subscription check (attempt ${retryCountRef.current}), will retry`);
          setSubscriptionState(prev => ({ ...prev, isLoading: false }));
          isCheckingRef.current = false;
          return;
        }
        
        setSubscriptionState(prev => ({ ...prev, isLoading: false }));
        isCheckingRef.current = false;
        return;
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      // Also check if the response itself indicates invalid session
      if (data?.code === 'INVALID_SESSION') {
        console.log('User session invalid (from response), will retry');
        setSubscriptionState(prev => ({ ...prev, isLoading: false }));
        isCheckingRef.current = false;
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
    } finally {
      isCheckingRef.current = false;
    }
  }, [isAuthenticated, session, authLoading]);

  // Initial check with delay to let auth stabilize
  useEffect(() => {
    if (authLoading) return;
    
    // Small delay to ensure auth state is fully settled
    const timer = setTimeout(() => {
      checkSubscription(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, session]);

  // Auto-refresh subscription status every 60 seconds
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const interval = setInterval(() => checkSubscription(false), 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, authLoading, checkSubscription]);

  return {
    ...subscriptionState,
    refreshSubscription: () => checkSubscription(false),
  };
}
