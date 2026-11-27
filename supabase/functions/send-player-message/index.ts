import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] as string);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !brevoApiKey) {
      return reply(500, { error: "Email service configuration is incomplete. Ask the administrator to check the Supabase function secrets." });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return reply(401, { error: "Sign in is required." });

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return reply(401, { error: "Your session is invalid. Please sign in again." });
    if (userData.user.app_metadata?.role !== "admin") {
      return reply(403, { error: "Only Talent Administration can send player emails." });
    }

    const body = await req.json();
    const playerUserId = String(body.player_user_id || "");
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    if (!playerUserId || !subject || !message) return reply(400, { error: "Player, subject and message are required." });
    if (subject.length > 180 || message.length > 10000) return reply(400, { error: "The subject or message is too long." });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: playerData, error: playerError } = await adminClient.auth.admin.getUserById(playerUserId);
    if (playerError || !playerData.user?.email) return reply(404, { error: "The player's registered email address could not be found." });

    const plainText = `Dear ${String(playerData.user.user_metadata?.full_name || "Player")},\n\n${message}\n\nKind regards,\nTalent Administration Team\nRadiantWaves Media Nigeria Ltd\nRadiantWaves Football Talent\ninfo@radiantwavesmedia.com`;
    const html = `<p>Dear ${escapeHtml(String(playerData.user.user_metadata?.full_name || "Player"))},</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><p>Kind regards,<br>Talent Administration Team<br><strong>RadiantWaves Media Nigeria Ltd</strong><br>RadiantWaves Football Talent<br>info@radiantwavesmedia.com</p>`;

    const mailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "api-key": brevoApiKey, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { name: "RadiantWaves Media", email: "info@radiantwavesmedia.com" },
        to: [{ email: playerData.user.email }],
        subject,
        textContent: plainText,
        htmlContent: html,
      }),
    });
    const mailResult = await mailResponse.json().catch(() => ({}));
    if (!mailResponse.ok) {
      return reply(502, { error: mailResult.message || "Brevo could not send the email. The in-app message remains saved." });
    }
    return reply(200, { success: true, recipient: playerData.user.email, messageId: mailResult.messageId || null });
  } catch (error) {
    return reply(500, { error: error instanceof Error ? error.message : "Unexpected email service error." });
  }
});
