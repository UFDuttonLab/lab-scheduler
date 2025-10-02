import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ConfigureSMTP = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfigure = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('configure-smtp', {
        body: { 
          managementToken: 'sbp_f85b651b4d90905a43d237febfee9c242bea186c'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "SMTP Configured Successfully",
          description: "Password reset emails will now be sent via Resend.",
        });
      } else {
        throw new Error(data.error || 'Configuration failed');
      }
    } catch (error: any) {
      console.error('SMTP configuration error:', error);
      toast({
        title: "Configuration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configure Email Settings</CardTitle>
          <CardDescription>
            One-time setup to enable password reset emails via Resend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConfigure} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Configuring..." : "Configure SMTP"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigureSMTP;
