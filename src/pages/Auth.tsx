import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionError } from "@/lib/dbWrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

/**
 * Whether to offer self-service password reset on the sign-in form.
 *
 * Flip to true once Supabase Auth has working custom SMTP. Everything behind it - the
 * resetPasswordForEmail call, the /reset-password route and the PKCE recovery handling in
 * App.tsx - is already in place and does not need touching.
 */
const SHOW_FORGOT_PASSWORD = false;

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Supabase Auth sends this itself, over whatever SMTP is configured in the dashboard.
      // It replaces a hand-rolled flow that generated its own token, stored it in a
      // password_reset_tokens table and mailed it via Resend. Supabase generates, expires and
      // single-uses the token, so none of that is ours to get wrong any more.
      //
      // redirectTo must be listed under Authentication -> URL Configuration -> Redirect URLs
      // or Supabase refuses to honour it and sends the user to the Site URL instead.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      });

      if (error) {
        // Deliberately generic: this page is reachable while logged out, so echoing the
        // server's message could confirm whether an account exists.
        console.error("Password reset request failed:", error.message);
        throw new Error("Could not send the reset email right now. Please try again shortly.");
      }

      toast({
        title: "Check your email",
        description: "If an account exists with that email, we've sent you a password reset link.",
      });
      setShowForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Dutton Lab Scheduler</CardTitle>
            <CardDescription>University of Florida</CardDescription>
          </CardHeader>
          <CardContent>
            {!showForgotPassword ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="student@ufl.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                {/* Self-service password reset is HIDDEN, not deleted.
                    It depends on outbound email, and there is currently no mail provider
                    configured, so the link would send people into a flow that silently never
                    delivers. Meanwhile a PI can set a new password directly from Lab
                    Configuration -> Users (the key icon), which needs no email at all.
                    To restore this: set SHOW_FORGOT_PASSWORD back to true once custom SMTP is
                    configured in Supabase (Authentication -> Emails -> SMTP Settings). The
                    handler, the route and ResetPasswordVerify are all still wired up and use
                    Supabase's native recovery flow, so nothing else needs changing. */}
                {SHOW_FORGOT_PASSWORD && (
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </Button>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  Forgotten your password? Ask Chris to set a new one for you.
                </p>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="student@ufl.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
