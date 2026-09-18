import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function loadProfile(currentSession) {
    if (!currentSession?.access_token) {
      setProfile(null);
      setRole(null);
      return;
    }

    setProfileLoading(true);

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load user profile.",
        );
      }

      const currentProfile = data?.data?.user || null;

      setProfile(currentProfile);
      setRole(currentProfile?.role || null);
    } catch (error) {
      console.error(
        "Failed to load user profile:",
        error,
      );

      setProfile(null);
      setRole(null);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Failed to load auth session:",
          error,
        );
      }

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      await loadProfile(currentSession);

      if (mounted) {
        setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        /*
         * Do not make the async profile request
         * directly inside onAuthStateChange.
         *
         * Session change is handled here.
         * Profile loading is handled separately
         * by the effect below.
         */
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Whenever the session changes, load the
   * corresponding Neon app_users profile.
   */
  useEffect(() => {
    if (!session) {
      setProfile(null);
      setRole(null);
      setProfileLoading(false);
      return;
    }

    loadProfile(session);
  }, [session]);

  async function signIn(email, password) {
    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signUp(email, password) {
    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  }

  const isAdmin = role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        loading,
        profileLoading,
        isAuthenticated: Boolean(session),
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}