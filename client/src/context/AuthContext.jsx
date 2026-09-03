import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// The authApi mock is no longer used for core authentication
// Authentication and profiles MUST come from the real Supabase backend

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveUserProfile = async (sessionUser) => {
    if (!sessionUser) {
      setProfile(null);
      setRole(null);
      return;
    }
    
    try {
      // Fetch the REAL profile from Supabase using the authenticated user's ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setRole(data.role);
      } else {
        console.warn("Profile not found for user:", sessionUser.email);
        setProfile(null);
        setRole(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfile(null);
      setRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await resolveUserProfile(session.user);
        }
      } catch (error) {
        console.error("Session fetch error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await resolveUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Note: onAuthStateChange handles the profile fetching
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
