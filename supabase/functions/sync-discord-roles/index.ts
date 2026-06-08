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
// ROLE_COMMAND optional
// ROLE_S4_RD optional
// ROLE_STAFF optional, maps to admin/editor access if used
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


function decodeJwtPayload(jwt: string) {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
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

    let user = userData?.user || null;
    let profileFromDb: any = null;

    // Some deployed browser callback flows store a valid Supabase JWT but
    // admin.auth.getUser(jwt) may reject it depending on session handling.
    // For beta role sync, fallback to reading the user id from the JWT payload
    // and then use the trusted service-role client to fetch the profile row.
    if (userError || !user) {
      const payload = decodeJwtPayload(jwt);
      const userIdFromJwt = payload?.sub ? String(payload.sub) : "";

      if (userIdFromJwt) {
        const { data: profileData } = await admin
          .from("profiles")
          .select("*")
          .eq("id", userIdFromJwt)
          .maybeSingle();

        profileFromDb = profileData || null;

        user = {
          id: userIdFromJwt,
          email: payload?.email || "",
          user_metadata: payload?.user_metadata || payload?.app_metadata || {},
          identities: [],
        };
      }
    }

    if (!user || !user.id) {
      return jsonResponse({
        error: "Invalid Supabase session",
        hint: "No valid user id could be read from the Supabase token.",
      }, 401);
    }

    const discordUserId =
      extractDiscordUserId(user) ||
      profileFromDb?.discord_user_id ||
      null;

    const discordUsername =
      extractDiscordUsername(user) ||
      profileFromDb?.discord_username ||
      profileFromDb?.display_name ||
      "Discord User";

    if (!discordUserId) {
      return jsonResponse({
        error: "No Discord identity found for this account",
        hint: "profiles.discord_user_id is empty. Re-login with Discord or update the profile row.",
        user_id: user.id,
      }, 400);
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

    const roleMap: Record<string, string> = {};

    function addMappedRole(secretName: string, accessKey: string) {
      const roleId = env(secretName, false).trim();
      if (!roleId) return;
      roleMap[roleId] = accessKey;
    }

    addMappedRole("ROLE_GENERAL", "general");
    addMappedRole("ROLE_SRC", "src");
    addMappedRole("ROLE_LRR", "lrr");
    addMappedRole("ROLE_KALASAG", "kalasag");
    addMappedRole("ROLE_HARIBON", "haribon");
    addMappedRole("ROLE_UAV_OPERATOR", "uav_operator");
    addMappedRole("ROLE_MARKSMAN", "marksman");
    addMappedRole("ROLE_COMBAT_MEDIC", "combat_medic");
    addMappedRole("ROLE_RTO", "rto");

    // Editor/admin access roles. Any matching Discord role will be written to
    // public.user_access automatically, so Command/S4/Admin users can publish
    // without manual SQL inserts.
    addMappedRole("ROLE_ADMIN", "admin");
    addMappedRole("ROLE_COMMAND", "command");
    addMappedRole("ROLE_S4_RD", "s4_rd");
    addMappedRole("ROLE_STAFF", "admin");
    addMappedRole("ROLE_ADMIN_2", "admin");
    addMappedRole("ROLE_COMMAND_2", "command");
    addMappedRole("ROLE_S4_RD_2", "s4_rd");

    const accessKeys = new Set<string>(["general"]);
    const matchedEditorRoles: string[] = [];

    for (const roleId of roleIds) {
      const accessKey = roleMap[roleId];
      if (accessKey) {
        accessKeys.add(accessKey);
        if (["admin", "command", "s4_rd"].includes(accessKey)) {
          matchedEditorRoles.push(`${accessKey}:${roleId}`);
        }
      }
    }

    if (accessKeys.has("admin") || accessKeys.has("command") || accessKeys.has("s4_rd")) {
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
        "command",
        "s4_rd",
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
        matched_editor_roles: matchedEditorRoles,
      },
    });

    return jsonResponse({
      ok: true,
      user_id: user.id,
      used_profile_fallback: Boolean(profileFromDb),
      discord_user_id: String(discordUserId),
      discord_username: discordUsername,
      roles: roleIds,
      access_keys: accessArray,
      matched_editor_roles: matchedEditorRoles,
      editor_access_granted: accessArray.some((key) => ["admin", "command", "s4_rd"].includes(key)),
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown server error",
    }, 500);
  }
});
