// Red Squadron Armory - Discord Role Sync Edge Function
// Deploy name: sync-discord-roles
//
// Purpose:
// 1. Verify the logged-in Supabase user.
// 2. Read their Discord identity.
// 3. Ask Discord API for their roles inside the Red Squadron server.
// 4. Convert Discord Role IDs into Supabase access keys.
// 5. Update public.user_access automatically.
//
// Required Supabase secrets:
// DISCORD_BOT_TOKEN
// DISCORD_GUILD_ID
// ROLE_GENERAL
// ROLE_SRC
// ROLE_LRR
// ROLE_KALASAG
// ROLE_HARIBON
// ROLE_UAV_OPERATOR
// ROLE_MARKSMAN
// ROLE_COMBAT_MEDIC
// ROLE_RTO
// ROLE_ADMIN optional
// SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function env(name: string, required = true) {
  const value = Deno.env.get(name);
  if (required && !value) {
    throw new Error(`Missing required secret: ${name}`);
  }
  return value || "";
}

function extractDiscordUserId(user: any) {
  const metadata = user.user_metadata || {};
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const discordIdentity = identities.find((identity: any) => identity.provider === "discord");
  const identityData = discordIdentity?.identity_data || {};

  return (
    metadata.provider_id ||
    metadata.sub ||
    metadata.user_id ||
    metadata.id ||
    identityData.provider_id ||
    identityData.sub ||
    identityData.id ||
    null
  );
}

function extractDiscordUsername(user: any) {
  const metadata = user.user_metadata || {};
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const discordIdentity = identities.find((identity: any) => identity.provider === "discord");
  const identityData = discordIdentity?.identity_data || {};

  return (
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    metadata.preferred_username ||
    identityData.full_name ||
    identityData.name ||
    identityData.user_name ||
    identityData.preferred_username ||
    user.email ||
    "Discord User"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = env("SUPABASE_URL");
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || "";

    if (!serviceKey) {
      throw new Error("Missing SERVICE_ROLE_KEY");
    }

    const discordBotToken = env("DISCORD_BOT_TOKEN");
    const guildId = env("DISCORD_GUILD_ID");

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    if (!jwt) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);

    if (userError || !userData?.user) {
      return jsonResponse({ error: "Invalid Supabase session" }, 401);
    }

    const user = userData.user;
    const discordUserId = extractDiscordUserId(user);
    const discordUsername = extractDiscordUsername(user);

    if (!discordUserId) {
      return jsonResponse({ error: "No Discord identity found for this account" }, 400);
    }

    const discordRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      }
    );

    if (discordRes.status === 404) {
      await admin.from("profiles").upsert({
        id: user.id,
        discord_user_id: String(discordUserId),
        discord_username: discordUsername,
        display_name: discordUsername,
        main_branch: "none",
        last_role_sync: new Date().toISOString(),
        last_detected_roles: [],
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      await admin.from("user_access").delete().eq("user_id", user.id);
      return jsonResponse({
        ok: false,
        error: "User is not a member of the Red Squadron Discord server",
        access_keys: [],
      }, 403);
    }

    if (!discordRes.ok) {
      const text = await discordRes.text();
      return jsonResponse({
        error: "Discord API failed",
        status: discordRes.status,
        details: text,
      }, 500);
    }

    const member = await discordRes.json();
    const roleIds = Array.isArray(member.roles) ? member.roles.map(String) : [];

    const roleMap: Record<string, string> = {
      [env("ROLE_GENERAL", false)]: "general",
      [env("ROLE_SRC", false)]: "src",
      [env("ROLE_LRR", false)]: "lrr",
      [env("ROLE_KALASAG", false)]: "kalasag",
      [env("ROLE_HARIBON", false)]: "haribon",
      [env("ROLE_UAV_OPERATOR", false)]: "uav_operator",
      [env("ROLE_MARKSMAN", false)]: "marksman",
      [env("ROLE_COMBAT_MEDIC", false)]: "combat_medic",
      [env("ROLE_RTO", false)]: "rto",
      [env("ROLE_ADMIN", false)]: "admin",
    };

    const accessKeys = new Set<string>(["general"]);
    for (const roleId of roleIds) {
      const accessKey = roleMap[roleId];
      if (accessKey) accessKeys.add(accessKey);
    }

    if (accessKeys.has("admin")) {
      [
        "general",
        "src",
        "lrr",
        "kalasag",
        "haribon",
        "uav_operator",
        "marksman",
        "combat_medic",
        "rto",
        "admin",
      ].forEach((key) => accessKeys.add(key));
    }

    const accessArray = Array.from(accessKeys);

    let mainBranch = "general";
    for (const branch of ["src", "lrr", "kalasag", "haribon"]) {
      if (accessKeys.has(branch)) {
        mainBranch = branch;
        break;
      }
    }

    await admin.from("profiles").upsert({
      id: user.id,
      discord_user_id: String(discordUserId),
      discord_username: discordUsername,
      display_name: discordUsername,
      main_branch: mainBranch,
      last_role_sync: new Date().toISOString(),
      last_detected_roles: roleIds,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    await admin.from("user_access").delete().eq("user_id", user.id);

    const rows = accessArray.map((access_key) => ({
      user_id: user.id,
      access_key,
    }));

    if (rows.length) {
      await admin.from("user_access").insert(rows);
    }

    await admin.from("access_audit_logs").insert({
      user_id: user.id,
      action: "discord_role_sync",
      details: {
        discord_user_id: discordUserId,
        discord_username: discordUsername,
        roles: roleIds,
        access_keys: accessArray,
      },
    });

    return jsonResponse({
      ok: true,
      discord_user_id: String(discordUserId),
      discord_username: discordUsername,
      roles: roleIds,
      access_keys: accessArray,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown server error",
    }, 500);
  }
});
