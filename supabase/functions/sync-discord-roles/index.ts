// Red Squadron Armory - Discord Role Sync Edge Function V55
// Robust Discord role sync with explicit diagnostics and no silent 500s.

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

function getEnv(name: string, required = true) {
  const value = Deno.env.get(name);
  if (required && !value) throw new Error(`Missing required secret: ${name}`);
  return value || "";
}

function getServiceKey() {
  return Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
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
    metadata.full_name || metadata.name || metadata.user_name || metadata.preferred_username || metadata.username ||
    identityData.full_name || identityData.name || identityData.user_name || identityData.preferred_username || identityData.username ||
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

async function discordFetchJson(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: response.ok, status: response.status, data, text };
}

function addMappedRole(roleMap: Record<string, string>, secretName: string, accessKey: string) {
  const roleId = getEnv(secretName, false).trim();
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

  const { data, error } = await admin
    .from("armory_editor_roles")
    .select("access_key, discord_role_id, is_active")
    .eq("is_active", true);
  if (!error && Array.isArray(data)) {
    for (const row of data) {
      const roleId = String(row?.discord_role_id || "").trim();
      const accessKey = String(row?.access_key || "").trim();
      if (roleId && accessKey) roleMap[roleId] = accessKey;
    }
  }
  return roleMap;
}

async function fetchGuildRoleNames(guildId: string, botToken: string) {
  const map = new Map<string, string>();
  if (!botToken) return map;
  const result = await discordFetchJson(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    Authorization: `Bot ${botToken}`,
  });
  if (result.ok && Array.isArray(result.data)) {
    for (const role of result.data) {
      if (role?.id && role?.name) map.set(String(role.id), String(role.name));
    }
  }
  return map;
}

async function fetchMemberByBot(guildId: string, botToken: string, discordUserId: string) {
  if (!botToken) return { ok: false, status: 0, data: null, text: "Missing DISCORD_BOT_TOKEN", source: "bot" };
  const result = await discordFetchJson(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
    Authorization: `Bot ${botToken}`,
  });
  return { ...result, source: "bot" };
}

async function fetchMemberByProvider(guildId: string, providerToken: string) {
  if (!providerToken) return { ok: false, status: 0, data: null, text: "Missing Discord provider token", source: "provider" };
  const result = await discordFetchJson(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
    Authorization: `Bearer ${providerToken}`,
  });
  return { ...result, source: "provider" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const providerToken = String(body?.discord_provider_token || "").trim();
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getServiceKey();
    if (!serviceKey) return jsonResponse({ ok: false, error: "Missing SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY secret" }, 500);
    const guildId = getEnv("DISCORD_GUILD_ID");
    const botToken = getEnv("DISCORD_BOT_TOKEN", false).trim();
    const jwt = extractBearer(req);
    if (!jwt) return jsonResponse({ ok: false, error: "Missing Authorization bearer token" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    let user: any = userData?.user || null;
    if (!user && userError) console.warn("auth.getUser failed", userError.message);
    if (!user) {
      const decoded = decodeJwtPayload(jwt);
      if (decoded?.sub) user = { id: decoded.sub, email: decoded.email, user_metadata: decoded.user_metadata || {}, identities: [] };
    }
    if (!user?.id) return jsonResponse({ ok: false, error: "Invalid Supabase user token" }, 401);

    const { data: existingProfile, error: existingProfileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (existingProfileError) return jsonResponse({ ok: false, error: "Could not read profile", details: existingProfileError.message }, 200);

    const discordUserId = String(existingProfile?.discord_user_id || extractDiscordUserId(user) || "").trim();
    const discordUsername = String(existingProfile?.discord_username || existingProfile?.display_name || extractDiscordUsername(user) || "Discord User");
    if (!discordUserId) return jsonResponse({ ok: false, error: "No Discord user ID found for this profile", user_id: user.id }, 200);

    const botLookup = await fetchMemberByBot(guildId, botToken, discordUserId);
    let memberLookup: any = botLookup;
    if (!botLookup.ok && providerToken) {
      const providerLookup = await fetchMemberByProvider(guildId, providerToken);
      memberLookup = providerLookup.ok ? providerLookup : { ...providerLookup, bot_error: { status: botLookup.status, details: botLookup.text } };
    }

    if (!memberLookup.ok) {
      const syncMessage = `SYNC_FAILED:${memberLookup.source}:status=${memberLookup.status}:${memberLookup.text || "No response body"}`;
      const failurePayload = {
        id: user.id,
        discord_user_id: discordUserId,
        discord_username: discordUsername,
        display_name: discordUsername,
        is_active: true,
        last_role_sync: new Date().toISOString(),
        last_detected_role_names: [syncMessage],
        updated_at: new Date().toISOString(),
      };
      const { error: failureUpdateError } = await admin.from("profiles").upsert(failurePayload, { onConflict: "id" });
      return jsonResponse({
        ok: false,
        error: "Discord member lookup failed. Existing access was preserved.",
        discord_user_id: discordUserId,
        discord_username: discordUsername,
        source: memberLookup.source,
        status: memberLookup.status,
        details: memberLookup.text,
        bot_error: memberLookup.bot_error || null,
        profile_update_error: failureUpdateError?.message || null,
        hint: "Check DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, bot membership in the server, and Server Members Intent."
      }, 200);
    }

    const member = memberLookup.data || {};
    const roleIds = Array.isArray(member.roles) ? member.roles.map(String) : [];
    const roleMap = await loadRoleMap(admin);
    const roleNameById = await fetchGuildRoleNames(guildId, botToken);
    const accessKeys = new Set<string>(["general"]);
    const detectedRoleNames: string[] = [];
    const matchedRoleNames: string[] = [];

    for (const roleId of roleIds) {
      const roleName = roleNameById.get(roleId) || "";
      if (roleName) detectedRoleNames.push(`${roleName}:${roleId}`);
      const accessKey = roleMap[roleId] || accessKeyFromRoleName(roleName);
      if (accessKey) {
        accessKeys.add(accessKey);
        matchedRoleNames.push(`${accessKey}:${roleName || "role_id_only"}:${roleId}`);
      }
    }

    if (accessKeys.has("admin") || accessKeys.has("command") || accessKeys.has("s4_rd")) {
      ["general", "src", "lrr", "kalasag", "haribon", "uav_operator", "marksman", "combat_medic", "rto", "admin", "command", "s4_rd"].forEach(key => accessKeys.add(key));
    }

    const accessArray = Array.from(accessKeys);
    const editorKeys = accessArray.filter(key => ["admin", "command", "s4_rd"].includes(key));
    let mainBranch = "general";
    for (const branch of ["src", "lrr", "kalasag", "haribon"]) {
      if (accessKeys.has(branch)) { mainBranch = branch; break; }
    }

    const profilePayload = {
      id: user.id,
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      display_name: discordUsername,
      main_branch: mainBranch,
      is_active: true,
      last_role_sync: new Date().toISOString(),
      last_detected_roles: roleIds,
      last_detected_role_names: detectedRoleNames.length ? detectedRoleNames : [`SYNC_OK_NO_NAMED_ROLES:${memberLookup.source}`],
      last_detected_editor_keys: editorKeys,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await admin.from("profiles").upsert(profilePayload, { onConflict: "id" });
    if (profileError) return jsonResponse({ ok: false, error: "Failed to update profile role sync", details: profileError.message, profilePayload }, 200);

    const { error: deleteError } = await admin.from("user_access").delete().eq("user_id", user.id);
    if (deleteError) return jsonResponse({ ok: false, error: "Failed to refresh user access", details: deleteError.message, access_keys_attempted: accessArray }, 200);

    if (accessArray.length) {
      const rows = accessArray.map(access_key => ({ user_id: user.id, access_key }));
      const { error: insertError } = await admin.from("user_access").insert(rows);
      if (insertError) return jsonResponse({ ok: false, error: "Failed to write user access", details: insertError.message, access_keys_attempted: accessArray }, 200);
    }

    try {
      await admin.from("access_audit_logs").insert({
        user_id: user.id,
        action: "discord_role_sync",
        details: { discord_user_id: discordUserId, discord_username: discordUsername, source: memberLookup.source, roles: roleIds, detected_role_names: detectedRoleNames, matched_role_names: matchedRoleNames, access_keys: accessArray },
      });
    } catch (_) {}

    return jsonResponse({ ok: true, source: memberLookup.source, user_id: user.id, discord_user_id: discordUserId, discord_username: discordUsername, roles: roleIds, detected_role_names: detectedRoleNames, access_keys: accessArray, matched_role_names: matchedRoleNames, editor_access_granted: editorKeys.length > 0 }, 200);
  } catch (error) {
    console.error("sync-discord-roles fatal error", error);
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown server error", fatal: true }, 500);
  }
});
