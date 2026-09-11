import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { takeAuthLinkError, takeRecoverySession } from "@/lib/authCallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

const ResetPasswordVerify = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // A recovery session, not a hand-rolled token. The old ?token= query param, the
  // password_reset_tokens table and the update-password function are all gone.
  //
  // Four ways a person can arrive here, tried in order:
  //   1. A dead link. GoTrue puts the reason in the fragment ("#error=access_denied&
  //      error_code=otp_expired&..."); consumeAuthCallback() in main.tsx lifts it out.
  //   2. "#/reset-password?token_hash=...&type=recovery" - the email-template form of the
  //      link. The token is spent by the verifyOtp call below and nowhere else, so a mail
  //      scanner that pre-fetches the URL no longer burns it before the student clicks.
  //   3. Implicit-flow tokens in the fragment ("#access_token=...&refresh_token=..."), which
  //      is what a server-generated resetPasswordForEmail link produces. consumeAuthCallback()
  //      lifts those out too and they are exchanged for a session here.
  //   4. PKCE ("?code=..."), used by the browser-side Forgot Password flow in Auth.tsx.
  //      supabase-js exchanges it during client init and fires PASSWORD_RECOVERY, which the
  //      RecoveryRedirect in App.tsx routes here, so the session already exists.
  // In every case updateUser() below is authorised by a real, short-lived session.
  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const fail = (description: string) => {
      if (cancelled) return;
      setVerifying(false);
      toast({ title: "Invalid or expired link", description, variant: "destructive" });
      setTimeout(() => navigate("/auth"), 3000);
    };

    const succeed = () => {
      if (cancelled) return;
      setTokenValid(true);
      setVerifying(false);
    };

    const deadLink =
      'This link is no longer valid. Ask the lab PI to send a new one, or use "Forgot password" on the sign-in page.';

    const check = async () => {
      // 1. Dead link.
      const linkError = takeAuthLinkError();
      if (linkError) {
        fail(`${linkError}. ${deadLink}`);
        return;
      }

      // 2. token_hash link.
      const tokenHash = searchParams.get("token_hash");
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (cancelled) return;
        // Drop the token from the URL either way, so a refresh cannot retry a spent one.
        navigate("/reset-password", { replace: true });
        if (error) {
          fail(deadLink);
          return;
        }
        succeed();
        return;
      }

      // 3. Implicit-flow tokens.
      const recovery = takeRecoverySession();
      if (recovery) {
        const { error } = await supabase.auth.setSession(recovery);
        if (cancelled) return;
        if (error) {
          fail(deadLink);
          return;
        }
        succeed();
        return;
      }

      // 4. PKCE, or a session that is already open.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        succeed();
        return;
      }

      // The client may still be mid-exchange on a cold load, so give it one beat before
      // declaring the link dead.
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled || !session) return;
        succeed();
      });
      subscription = sub.subscription;

      setTimeout(() => {
        if (cancelled) return;
        setVerifying(prev => {
          if (!prev) return prev;
          toast({
            title: "Invalid or expired link",
            description: deadLink,
            variant: "destructive",
          });
          setTimeout(() => navigate("/auth"), 3000);
          return false;
        });
      }, 4000);
    };

    check();
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Authorised by the recovery session established above.
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const message = error.message || "Failed to reset password. The link may have expired.";
        if (/weak|pwned|compromis/i.test(message)) {
          toast({
            title: "Weak Password",
            description: "This password has been found in a data breach. Please choose a different, stronger password.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        throw new Error(message);
      }

      // Don't leave the recovery session lying around - it is a full session on the account.
      await supabase.auth.signOut();

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. You can now sign in.",
      });

      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Verifying reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tokenValid) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set Your Password</CardTitle>
            <CardDescription>Enter a new password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating Password..." : "Update Password"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPasswordVerify;
