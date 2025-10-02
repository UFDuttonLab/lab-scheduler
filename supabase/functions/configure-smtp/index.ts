import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { managementToken } = await req.json();
    
    if (!managementToken) {
      throw new Error('Management API token is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Extract project ID from Supabase URL
    const projectId = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectId) {
      throw new Error('Could not extract project ID from SUPABASE_URL');
    }

    console.log('Configuring SMTP settings for project:', projectId);

    // Configure SMTP settings via Management API
    const smtpConfig = {
      smtp_admin_email: 'onboarding@resend.dev',
      smtp_host: 'smtp.resend.com',
      smtp_port: '587',
      smtp_user: 'resend',
      smtp_pass: resendApiKey,
      smtp_sender_name: 'Lab Scheduler'
    };

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtpConfig),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to configure SMTP:', error);
      throw new Error(`Management API error: ${error}`);
    }

    const result = await response.json();
    console.log('SMTP configured successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMTP configured successfully. Password reset emails will now be sent via Resend.',
        config: smtpConfig
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error configuring SMTP:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        instructions: 'Get your management token from: https://supabase.com/dashboard/account/tokens'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
