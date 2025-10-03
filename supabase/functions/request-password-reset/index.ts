import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔵 [START] Password reset request received");
  
  if (req.method === "OPTIONS") {
    console.log("✅ [CORS] Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();
    console.log("📧 [INPUT] Email received:", email ? "***@***" : "MISSING");

    if (!email) {
      console.log("❌ [VALIDATION] Email is missing");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    console.log("🔑 [ENV] Environment variables check:");
    console.log("  - SUPABASE_URL:", supabaseUrl ? "✅ Present" : "❌ MISSING");
    console.log("  - SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅ Present" : "❌ MISSING");
    console.log("  - RESEND_API_KEY:", resendApiKey ? "✅ Present" : "❌ MISSING");

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      console.error("❌ [ENV] Missing required environment variables");
      throw new Error("Server configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    console.log("✅ [INIT] Supabase and Resend clients initialized");

    // Look up user by email
    console.log("🔍 [DB] Looking up user in profiles table...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("❌ [DB] Error querying profiles:", profileError);
    }
    
    console.log("🔍 [DB] User lookup result:", profile ? "✅ Found" : "❌ Not found");

    // Always return success to prevent email enumeration
    if (!profile || profileError) {
      console.log("⚠️ [SECURITY] User not found, but returning success for security");
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure token
    console.log("🎲 [TOKEN] Generating secure token...");
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration
    console.log("✅ [TOKEN] Token generated, expires at:", expiresAt.toISOString());

    // Store token in database
    console.log("💾 [DB] Storing token in password_reset_tokens table...");
    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: profile.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("❌ [DB] Error storing token:", {
        code: tokenError.code,
        message: tokenError.message,
        details: tokenError.details,
        hint: tokenError.hint,
      });
      throw new Error("Failed to create reset token");
    }
    console.log("✅ [DB] Token stored successfully");

    // Get the base URL for the reset link
    const resetUrl = `https://ufduttonlab.github.io/lab-scheduler/#/reset-password?token=${token}`;
    console.log("🔗 [URL] Reset URL generated");

    // Send email via Resend
    console.log("📨 [EMAIL] Attempting to send email via Resend...");
    console.log("📨 [EMAIL] From: Dutton Lab <noreply@marariverresearch.org>");
    console.log("📨 [EMAIL] To:", email);
    
    const emailResponse = await resend.emails.send({
      from: "Dutton Lab <noreply@marariverresearch.org>",
      to: [email],
      subject: "Reset Your Password - Dutton Lab Scheduler",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hello ${profile.full_name || "there"},</p>
          <p>We received a request to reset your password for the Dutton Lab Scheduler.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">University of Florida - Dutton Lab</p>
        </div>
      `,
    });

    console.log("✅ [EMAIL] Resend API response:", JSON.stringify(emailResponse, null, 2));

    console.log("🎉 [SUCCESS] Password reset flow completed successfully");
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("💥 [ERROR] Exception caught in request-password-reset:");
    console.error("  - Message:", error.message);
    console.error("  - Name:", error.name);
    console.error("  - Stack:", error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
