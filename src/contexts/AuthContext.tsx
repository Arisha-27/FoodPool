import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/supabaseClient'; // Ensure this points to your client file
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// 1. We define the User type HERE to match what ProtectedRoute needs
export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_cook: boolean; // <-- This fixes the red line on user.is_cook
}

// 2. We add 'loading' to the context definition
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean; // <-- This fixes the red line on loading
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: 'cook' | 'customer') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to get the 'is_cook' status from your database
  const fetchProfile = async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // If DB fetch fails, fallback to metadata (useful for fresh signups)
      const isCook = data?.is_cook ?? (authUser.user_metadata?.is_cook === true);

      setUser({
        id: authUser.id,
        email: authUser.email!,
        full_name: data?.full_name || authUser.user_metadata?.full_name,
        is_cook: isCook,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signup = async (name: string, email: string, pass: string, role: 'cook' | 'customer') => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          is_cook: role === 'cook', // Passes this to the DB Trigger
        },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};