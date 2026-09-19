import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [role, setRole] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [profileLoading, setProfileLoading] =
    useState(false);

  /*
   * =========================================================
   * INITIAL AUTH SESSION
   * =========================================================
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const {
          data: {
            session: currentSession,
          },
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "Failed to load auth session:",
            error,
          );
        }

        if (!mounted) {
          return;
        }

        setSession(
          currentSession,
        );

        setUser(
          currentSession?.user ??
            null,
        );
      } catch (error) {
        console.error(
          "Auth initialization failed:",
          error,
        );
      }
    }

    initializeAuth();

    /*
     * =======================================================
     * AUTH STATE LISTENER
     * =======================================================
     */
    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (!mounted) {
            return;
          }

          /*
           * ================================================
           * SIGNED OUT
           * ================================================
           */
          if (
            event ===
            "SIGNED_OUT"
          ) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setRole(null);
            setProfileLoading(false);
            setLoading(false);

            return;
          }

          /*
           * ================================================
           * SIGNED IN
           * ================================================
           *
           * The profile effect below will load
           * /api/auth/me exactly once for this session.
           */
       if (event === "SIGNED_IN") {
  setSession((currentSession) => {
    /*
     * Same authenticated user:
     *
     * Do not replace the React session object.
     *
     * This prevents:
     *
     * SIGNED_IN
     *   ↓
     * setSession()
     *   ↓
     * loadProfile()
     *   ↓
     * AdminPanel remount
     *   ↓
     * API refetch
     */
    if (
      currentSession?.user?.id &&
      currentSession.user.id ===
        newSession?.user?.id
    ) {
      return currentSession;
    }

    return newSession;
  });

  setUser((currentUser) => {
    /*
     * Same user → keep same React state object.
     */
    if (
      currentUser?.id &&
      currentUser.id ===
        newSession?.user?.id
    ) {
      return currentUser;
    }

    return newSession?.user ?? null;
  });

  return;
}
          /*
           * ================================================
           * USER UPDATED
           * ================================================
           */
          if (
            event ===
            "USER_UPDATED"
          ) {
            setSession(
              newSession,
            );

            setUser(
              newSession?.user ??
                null,
            );

            return;
          }

          /*
           * ================================================
           * INITIAL SESSION
           * ================================================
           *
           * Initial session is already obtained through
           * supabase.auth.getSession().
           */
          if (
            event ===
            "INITIAL_SESSION"
          ) {
            return;
          }

          /*
           * ================================================
           * TOKEN REFRESHED
           * ================================================
           *
           * IMPORTANT:
           *
           * Do not update React session state here.
           *
           * Supabase handles the refreshed session internally.
           * API services can call getSession() when they need
           * the current access token.
           */
          if (
            event ===
            "TOKEN_REFRESHED"
          ) {
            return;
          }
        },
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /*
   * =========================================================
   * LOAD PROFILE WHEN SESSION REALLY CHANGES
   * =========================================================
   *
   * This is the ONLY place that loads /api/auth/me.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProfile(
      currentSession,
    ) {
      /*
       * No authenticated session.
       */
      if (
        !currentSession?.access_token
      ) {
        if (!cancelled) {
          setProfile(null);
          setRole(null);
          setProfileLoading(false);
          setLoading(false);
        }

        return;
      }

      setProfileLoading(true);

      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${currentSession.access_token}`,
              },
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load user profile.",
          );
        }

        if (cancelled) {
          return;
        }

        const currentProfile =
          data?.data?.user ||
          null;

        setProfile(
          currentProfile,
        );

        setRole(
          currentProfile?.role ??
            null,
        );
      } catch (error) {
        console.error(
          "Failed to load user profile:",
          error,
        );

        if (!cancelled) {
          setProfile(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          setLoading(false);
        }
      }
    }

    loadProfile(session);

    return () => {
      cancelled = true;
    };
  }, [session]);

  /*
   * =========================================================
   * SIGN IN
   * =========================================================
   */
  async function signIn(
    email,
    password,
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

    if (error) {
      throw error;
    }

    return data;
  }

  /*
   * =========================================================
   * SIGN UP
   * =========================================================
   */
  async function signUp(
    email,
    password,
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  /*
   * =========================================================
   * SIGN OUT
   * =========================================================
   */
  async function signOut() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    /*
     * Auth listener also handles this,
     * but clearing immediately keeps UI responsive.
     */
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    setProfileLoading(false);
    setLoading(false);
  }

  const isAdmin =
    role === "ADMIN";

  const isAuthenticated =
    Boolean(session);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,

        loading,
        profileLoading,

        isAuthenticated,
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
  const context =
    useContext(
      AuthContext,
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}