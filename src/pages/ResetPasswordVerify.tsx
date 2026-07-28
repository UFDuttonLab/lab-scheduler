import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const { toast } = useToast();

  // A recovery session, not a hand-rolled token.
  //
  // Supabase's PKCE recovery link lands on the site root as "?code=...". supabase-js
  // exchanges it during client init and fires PASSWORD_RECOVERY, which AuthContext routes
  // here. By the time this page renders there is a real, short-lived session on the account,
  // and updateUser() is authorised by it. The old ?token= query param, the
  // password_reset_tokens table and the update-password function are all gone.
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        setTokenValid(true);
        setVerifying(false);
        return;
      }

      // The client may still be mid-exchange on a cold load, so give it one beat before
      // declaring the link dead.
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled || !session) return;
        setTokenValid(true);
        setVerifying(false);
      });

      setTimeout(() => {
        if (cancelled) return;
        setVerifying(prev => {
          if (!prev) return prev;
          toast({
            title: "Invalid or expired link",
            description: "This password reset link is no longer valid. Please request a new one.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/auth"), 2000);
          return false;
        });
      }, 4000);

      return () => sub.subscription.unsubscribe();
    };

    check();
    return () => { cancelled = true; };
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
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
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
