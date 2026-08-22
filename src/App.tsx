import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
// Page imports
import Index from "./pages/Index";
import Schedule from "./pages/Schedule";
import Equipment from "./pages/Equipment";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Settings from "./pages/Settings";
import QuickAdd from "./pages/QuickAdd";
import ActivityLog from "./pages/ActivityLog";
import Auth from "./pages/Auth";
import ResetPasswordVerify from "./pages/ResetPasswordVerify";
import Help from "./pages/Help";
import Skills from "./pages/Skills";
import Join from "./pages/Join";
import Positions from "./pages/Positions";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";
import MicrobeBlaster from "./pages/MicrobeBlaster";
import ZombieLunch from "./pages/ZombieLunch";
import ARMicrobeShooter from "./pages/ARMicrobeShooter";

const queryClient = new QueryClient();

/**
 * Sends a user arriving on a password-recovery link to the reset form.
 *
 * Supabase's PKCE recovery link lands on the site ROOT as "?code=...". supabase-js exchanges
 * it during client init and fires PASSWORD_RECOVERY. Without this, that exchange leaves the
 * user holding a valid session on "/", so ProtectedRoute happily shows them the dashboard and
 * the reset form is never reached - they would appear to be "logged in" instead of being asked
 * for a new password.
 *
 * Lives inside HashRouter because it needs useNavigate.
 */
const RecoveryRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Strip ?code= so a refresh cannot retry a code that has already been consumed.
        window.history.replaceState({}, "", window.location.pathname + window.location.hash);
        navigate("/reset-password", { replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthProvider>
          <RecoveryRedirect />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            {/* #/join is the only PUBLIC route in the app - no ProtectedRoute, and the page
                renders its own header rather than <Navigation>, which reads useAuth() and
                would show a visitor the signed-in user's email. */}
            <Route path="/join" element={<Join />} />
            <Route path="/reset-password" element={<ResetPasswordVerify />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/equipment" element={<ProtectedRoute requirePermission="canManageEquipment"><Equipment /></ProtectedRoute>} />
            <Route path="/quick-add" element={<ProtectedRoute><QuickAdd /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute requirePermission="canViewAnalytics"><Analytics /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/activity-log" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requirePermission="canManageUsers"><Settings /></ProtectedRoute>} />
            {/* Skills gates itself on skill_module_settings.visible_to_all - while that is
                false only pi/manager get past it, so no ProtectedRoute permission is needed. */}
            <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
            <Route path="/positions" element={<ProtectedRoute requirePermission="canManageRecruitingPositions"><Positions /></ProtectedRoute>} />
            <Route path="/review" element={<ProtectedRoute requirePermission="canReviewApplications"><Review /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/microbe-blaster" element={<ProtectedRoute><MicrobeBlaster /></ProtectedRoute>} />
            <Route path="/zombie-lunch" element={<ProtectedRoute><ZombieLunch /></ProtectedRoute>} />
            <Route path="/ar-microbe-shooter" element={<ProtectedRoute><ARMicrobeShooter /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
