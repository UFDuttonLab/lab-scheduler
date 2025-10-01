import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Component to handle Supabase auth redirects from email links
 * This is necessary because Supabase adds tokens as query params before the hash
 * which HashRouter doesn't process automatically
 */
export const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we're at the root and have auth-related query params
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    if (type === 'recovery' && location.pathname === '/') {
      // This is a password recovery redirect
      // Supabase client will automatically process the tokens
      // We just need to navigate to the reset password page
      const timer = setTimeout(() => {
        navigate('/reset-password');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [navigate, location]);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the password recovery link
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};
