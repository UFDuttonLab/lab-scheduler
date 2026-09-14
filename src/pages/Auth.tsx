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
import { TurnstileWidget } from "@/components/recruiting/TurnstileWidget";

/**
 * Whether to offer self-service password reset on the sign-in form.
 *
 * On since 2026-09-11. It was off because outbound mail was believed to be unconfigured;
 * auth mail in fact goes out through Lovable Cloud, and a recovery link was delivered and
 * clicked end to end that day. Set to false again only if mail delivery actually stops,
 * since a visible button that sends nothing is worse than no button.
 */
const SHOW_FORGOT_PASSWORD = true;

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // send-recovery-email is a public endpoint (no JWT - the user has forgotten their
  // password), so Turnstile is its bot gate. The widget renders nothing and reports no
  // token when VITE_TURNSTILE_SITE_KEY is unset; the function then refuses, fail-closed.
  const [turnstileToken, setTurnstileToken] = useState("");
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
      // NOT supabase.auth.resetPasswordForEmail(). That makes Supabase mail a link resolving to
      // ${SUPABASE_URL}/auth/v1/verify?token=..., and FETCHING that URL is what redeems the
      // one-time token. Corporate mail filters pre-fetch every link in a message, so the token
      // was being spent seconds after sending and people got "invalid or expired link". Measured
      // on this system: a scanner login 26 s after send, for Opentrons and for UF alike.
      //
      // send-recovery-email mints the token without sending, mails a link to THIS app carrying
      // token_hash, and sends it from noreply@marariverresearch.org via Resend. The token is then
      // spent only by the verifyOtp call on the reset page, which a scanner will not run.
      const { data, error } = await supabase.functions.invoke('send-recovery-email', {
        body: { email, turnstileToken },
      });

      if (error || data?.error) {
        // A non-2xx from an edge function gives data:null and error:FunctionsHttpError, so the
        // real message is in the body. Show the server's text here - the function is written to
        // return only messages that are safe for a logged-out stranger to see, and it answers
        // identically for known and unknown addresses.
        const message = error
          ? await readFunctionError(error, "Could not send the reset email right now. Please try again shortly.")
          : String(data.error);
        console.error("Password reset request failed:", error ?? data?.error);
        throw new Error(message);
      }

      toast({
        title: "Check your email",
        description:
          "If an account exists with that email, we've sent a link to set a new password. " +
          "It expires in an hour.",
      });
      setShowForgotPassword(false);
      setEmail("");
      setTurnstileToken("");
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
                  Still stuck? Ask Chris to set a new password for you.
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
                <TurnstileWidget onToken={setTurnstileToken} />
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
