import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'cashier' | 'kitchen';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
  });
  const [initialized, setInitialized] = useState(false);

  const fetchUserRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.role as AppRole | null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Initialize immediately with current session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          if (isMounted) {
            setAuthState({
              session,
              user: session.user,
              role,
              isLoading: false,
            });
          }
        } else {
          setAuthState({
            session: null,
            user: null,
            role: null,
            isLoading: false,
          });
        }
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          setInitialized(true);
        }
      }
    };

    // Start initialization
    initAuth();

    // Listen for auth changes AFTER initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          if (isMounted) {
            setAuthState({
              session,
              user: session.user,
              role,
              isLoading: false,
            });
          }
        } else {
          setAuthState({
            session: null,
            user: null,
            role: null,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!authState.session,
  };
}
