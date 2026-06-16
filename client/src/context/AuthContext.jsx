import { useEffect, useState, useCallback } from "react";

import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContext.js";

// ─── Provider ───────────────────────────────────────────────────────────────
const API_URL = import.meta.env.DEV ? "/api" : (import.meta.env.VITE_API_URL || "");

// ─── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // true until first session check resolves

  // ── Helper: sync users table ──────────────────────────────────────────────
  const syncUserRecord = useCallback(async (authUser, sessionToken) => {
    if (!authUser || !sessionToken) return;
    try {
      const res = await fetch(`${API_URL}/sync-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ email: authUser.email }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        console.warn("[AuthContext] users table sync failed:", json.error || res.statusText);
      } else {
        console.log("[AuthContext] users table sync successful:", json.user);
      }
    } catch (err) {
      console.warn("[AuthContext] users table sync network error:", err.message);
    }
  }, []);

  // ── Boot: load existing session ───────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user && s?.access_token) {
        syncUserRecord(s.user, s.access_token);
      }
    });

    // Real-time auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
 
        // Auto-create users table record on first sign-in
        if ((event === "SIGNED_IN" || event === "USER_UPDATED") && s?.user && s?.access_token) {
          await syncUserRecord(s.user, s.access_token);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserRecord]);

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // If email confirmation is disabled, user is immediately created
    // onAuthStateChange will handle the users table insert
    return data;
  };

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // State is cleared by onAuthStateChange listener
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook lives in ./useAuth.js to satisfy the Vite fast-refresh
// rule: a file may only export components OR non-component values, not both.
