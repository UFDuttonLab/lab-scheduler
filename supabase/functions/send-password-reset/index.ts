import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log("Received password reset webhook");

    // Verify webhook signature if secret is configured
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      try {
        wh.verify(payload, headers);
        console.log("Webhook signature verified");
      } catch (error) {
        console.error("Webhook signature verification failed:", error);
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Parse the webhook payload
    const webhookData = JSON.parse(payload);
    console.log("Webhook event type:", webhookData.email_data?.email_action_type);

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = webhookData as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    // Only handle password recovery emails
    if (email_action_type !== "recovery") {
      console.log("Not a recovery email, skipping");
      return new Response(JSON.stringify({ message: "Not a recovery email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    
    // Build the password reset URL
    // The redirect_to includes the full path, we need to append the Supabase auth verification
    const resetUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;
    
    console.log("Sending password reset email to:", user.email);

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Dutton Lab Scheduler</h1>
                      <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">University of Florida</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                      
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        We received a request to reset your password for your Dutton Lab Scheduler account.
                      </p>
                      
                      <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Click the button below to create a new password:
                      </p>
                      
                      <!-- Reset Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 30px;">
                            <a href="${resetUrl}" 
                               style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        Or copy and paste this link into your browser:
                      </p>
                      
                      <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 12px; margin-bottom: 30px; word-break: break-all;">
                        <a href="${resetUrl}" style="color: #667eea; text-decoration: none; font-size: 13px;">
                          ${resetUrl}
                        </a>
                      </div>
                      
                      <div style="border-top: 1px solid #e9ecef; padding-top: 20px;">
                        <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px; line-height: 1.5;">
                          <strong>Note:</strong> This password reset link will expire in 1 hour for security reasons.
                        </p>
                        <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                        Dutton Lab at University of Florida
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        This is an automated message, please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "Dutton Lab Scheduler <noreply@marariverresearch.org>",
      to: [user.email],
      subject: "Reset Your Password - Dutton Lab Scheduler",
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Password reset email sent successfully to:", user.email);

    return new Response(
      JSON.stringify({ message: "Password reset email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
