// Red Squadron Armory - Discord Role Sync Edge Function V53
// Safe automatic Discord role sync for armory visibility + editor publishing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string, required = true) {
  const value = Deno.env.get(name);
  if (required && !value) throw new Error(`Missing required secret: ${name}`);
  return value || "";
}

function extractBearer(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

function decodeJwtPayload(jwt: string) {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function extractDiscordUserId(user: any) {
  const metadata = user?.user_metadata || {};
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const discordIdentity = identities.find((identity: any) => identity.provider === "discord");
  const identityData = discordIdentity?.identity_data || {};
  return (
    metadata.provider_id || metadata.sub || metadata.user_id || metadata.id ||
    identityData.provider_id || identityData.sub || identityData.id || null
  );
}

function extractDiscordUsername(user: any) {
  const metadata = user?.user_metadata || {};
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const discordIdentity = identities.find((identity: any) => identity.provider === "discord");
  const identityData = discordIdentity?.identity_data || {};
  return (
    metadata.full_name || metadata.name || metadata.user_name || metadata.preferred_username ||
    identityData.full_name || identityData.name || identityData.user_name || identityData.preferred_username ||
    user?.email || "Discord User"
  );
}

function normalizeRoleName(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function accessKeyFromRoleName(roleName: string) {
  const normalized = normalizeRoleName(roleName);
  if (!normalized) return "";

  if (normalized.includes("admin") || normalized.includes("administrator")) return "admin";
  if (normalized.includes("command") || normalized.includes("commander")) return "command";

  const hasS4 = normalized.includes("s4") || normalized.includes("s 4") || normalized.includes("section 4");
  const hasResearch = normalized.includes("research");
  const hasDevelopment = normalized.includes("development") || normalized.includes("developement") || normalized.includes("dev");
  const hasRD = normalized.includes("rd") || normalized.includes("r d") || normalized.includes("r and d");
  if (hasS4 && (hasResearch || hasDevelopment || hasRD)) return "s4_rd";
  if (hasResearch && (hasDevelopment || hasRD)) return "s4_rd";

  if (normalized.includes("scout") && normalized.includes("ranger")) return "src";
  if (normalized === "src") return "src";
  if (normalized === "lrr" || normalized.includes("light reaction")) return "lrr";
  if (normalized.includes("kalasag")) return "kalasag";
  if (normalized.includes("haribon")) return "haribon";
  if (normalized.includes("uav")) return "uav_operator";
  if (normalized.includes("marksman")) return "marksman";
  if (normalized.includes("combat medic") || normalized === "medic" || normalized.includes(" medic")) return "combat_medic";
  if (normalized === "rto" || normalized.includes("radio telephone")) return "rto";
  return "";
}

async function fetchGuildRoleMap(guildId: string, botToken: string) {
  const roleNameById = new Map<string, string>();
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) {
    console.warn("Discord guild roles fetch failed", res.status, await res.text());
    return roleNameById;
  }
  const roles = await res.json();
  if (Array.isArray(roles)) {
    for (const role of roles) {
      if (role?.id && role?.name) roleNameById.set(String(role.id), String(role.name));
    }
  }
  return roleNameById;
}

function addMappedRole(roleMap: Record<string, string>, secretName: string, accessKey: string) {
  const roleId = env(secretName, false).trim();
  if (roleId) roleMap[roleId] = accessKey;
}

async function loadRoleMap(admin: any) {
  const roleMap: Record<string, string> = {};

  addMappedRole(roleMap, "ROLE_GENERAL", "general");
  addMappedRole(roleMap, "ROLE_SRC", "src");
  addMappedRole(roleMap, "ROLE_LRR", "lrr");
  addMappedRole(roleMap, "ROLE_KALASAG", "kalasag");
  addMappedRole(roleMap, "ROLE_HARIBON", "haribon");
  addMappedRole(roleMap, "ROLE_UAV_OPERATOR", "uav_operator");
  addMappedRole(roleMap, "ROLE_MARKSMAN", "marksman");
  addMappedRole(roleMap, "ROLE_COMBAT_MEDIC", "combat_medic");
  addMappedRole(roleMap, "ROLE_RTO", "rto");
  addMappedRole(roleMap, "ROLE_ADMIN", "admin");
  addMappedRole(roleMap, "ROLE_COMMAND", "command");
  addMappedRole(roleMap, "ROLE_S4_RD", "s4_rd");
  addMappedRole(roleMap, "ROLE_STAFF", "admin");

  try {
    const { data } = await admin
      .from("armory_editor_roles")
      .select("access_key, discord_role_id, is_active")
      .eq("is_active", true);
    if (Array.isArray(data)) {
      for (const row of data) {
        const roleId = String(row?.discord_role_id || "").trim();
        const accessKey = String(row?.access_key || "").trim();
        if (roleId && ["admin", "command", "s4_rd"].includes(accessKey)) {
          roleMap[roleId] = accessKey;
        }
      }
    }
  } catch (error) {
    console.warn("Editor role table load skipped:", error);
  }

  return roleMap;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = env("SUPABASE_URL");
    const serviceKey = env("SERVICE_ROLE_KEY");
    const guildId = env("DISCORD_GUILD_ID");
    const botToken = env("DISCORD_BOT_TOKEN");
    const jwt = extractBearer(req);
    if (!jwt) return jsonResponse({ error: "Missing Authorization bearer token" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let user: any = null;
    const { data: userData } = await admin.auth.getUser(jwt);
    user = userData?.user || null;

    if (!user) {
      const decoded = decodeJwtPayload(jwt);
      if (decoded?.sub) {
        user = { id: decoded.sub, email: decoded.email, user_metadata: decoded.user_metadata || {}, identities: [] };
      }
    }
    if (!user?.id) return jsonResponse({ error: "Invalid Supabase user token" }, 401);

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const discordUserId = String(existingProfile?.discord_user_id || extractDiscordUserId(user) || "").trim();
    const discordUsername = String(existingProfile?.discord_username || existingProfile?.display_name || extractDiscordUsername(user) || "Discord User");

    if (!discordUserId) {
      return jsonResponse({ ok: false, error: "No Discord user ID found for this profile", user_id: user.id }, 400);
    }

    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!memberRes.ok) {
      const details = await memberRes.text();
      await admin.from("profiles").upsert({
        id: user.id,
        discord_user_id: discordUserId,
        discord_username: discordUsername,
        display_name: discordUsername,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      return jsonResponse({
        ok: false,
        error: "Discord member lookup failed. Existing access was preserved.",
        status: memberRes.status,
        details,
        discord_user_id: discordUserId,
      }, memberRes.status === 404 ? 403 : 500);
    }

    const member = await memberRes.json();
    const roleIds = Array.isArray(member.roles) ? member.roles.map(String) : [];
    const roleMap = await loadRoleMap(admin);
    const roleNameById = await fetchGuildRoleMap(guildId, botToken);

    const accessKeys = new Set<string>(["general"]);
    const detectedRoleNames: string[] = [];
    const matchedRoleNames: string[] = [];
    const matchedEditorRoles: string[] = [];

    for (const roleId of roleIds) {
      const roleName = roleNameById.get(roleId) || "";
      if (roleName) detectedRoleNames.push(`${roleName}:${roleId}`);
      const accessKey = roleMap[roleId] || accessKeyFromRoleName(roleName);
      if (!accessKey) continue;
      accessKeys.add(accessKey);
      if (roleName) matchedRoleNames.push(`${accessKey}:${roleName}:${roleId}`);
      if (["admin", "command", "s4_rd"].includes(accessKey)) {
        matchedEditorRoles.push(`${accessKey}:${roleName || "role_id_only"}:${roleId}`);
      }
    }

    if (accessKeys.has("admin") || accessKeys.has("command") || accessKeys.has("s4_rd")) {
      ["general", "src", "lrr", "kalasag", "haribon", "uav_operator", "marksman", "combat_medic", "rto", "admin", "command", "s4_rd"].forEach(k => accessKeys.add(k));
    }

    const accessArray = Array.from(accessKeys);
    let mainBranch = "general";
    for (const branch of ["src", "lrr", "kalasag", "haribon"]) {
      if (accessKeys.has(branch)) { mainBranch = branch; break; }
    }
    const editorKeys = accessArray.filter(k => ["admin", "command", "s4_rd"].includes(k));

    const profilePayload: any = {
      id: user.id,
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      display_name: discordUsername,
      main_branch: mainBranch,
      last_role_sync: new Date().toISOString(),
      last_detected_roles: roleIds,
      last_detected_role_names: detectedRoleNames,
      last_detected_editor_keys: editorKeys,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await admin.from("profiles").upsert(profilePayload, { onConflict: "id" });
    if (profileError) {
      return jsonResponse({ ok: false, error: "Failed to update profile role sync", details: profileError.message }, 500);
    }

    const { error: deleteError } = await admin.from("user_access").delete().eq("user_id", user.id);
    if (deleteError) return jsonResponse({ ok: false, error: "Failed to refresh user access", details: deleteError.message }, 500);

    if (accessArray.length) {
      const { error: insertError } = await admin.from("user_access").insert(accessArray.map(access_key => ({ user_id: user.id, access_key })));
      if (insertError) {
        return jsonResponse({ ok: false, error: "Failed to write user access", details: insertError.message, access_keys_attempted: accessArray }, 500);
      }
    }

    try {
      await admin.from("access_audit_logs").insert({
        user_id: user.id,
        action: "discord_role_sync",
        details: {
          discord_user_id: discordUserId,
          discord_username: discordUsername,
          roles: roleIds,
          detected_role_names: detectedRoleNames,
          matched_role_names: matchedRoleNames,
          matched_editor_roles: matchedEditorRoles,
          access_keys: accessArray,
        },
      });
    } catch (_) {}

    return jsonResponse({
      ok: true,
      user_id: user.id,
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      roles: roleIds,
      detected_role_names: detectedRoleNames,
      access_keys: accessArray,
      matched_editor_roles: matchedEditorRoles,
      editor_access_granted: editorKeys.length > 0,
    });
  } catch (error) {
    console.error("sync-discord-roles error", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown server error" }, 500);
  }
});
