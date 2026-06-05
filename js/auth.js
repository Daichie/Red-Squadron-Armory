const RS_AUTH_VERSION = "V34_HARD_CALLBACK_FIX";
// Red Squadron Armory Auth Helper
// Uses Supabase Auth with Discord OAuth.
// V15: dedicated callback.html OAuth flow.

let rsSupabaseClient = null;

function rsConfigReady() {
  return Boolean(
    window.RS_SUPABASE_CONFIG &&
    RS_SUPABASE_CONFIG.url &&
    RS_SUPABASE_CONFIG.publishableKey &&
    !RS_SUPABASE_CONFIG.publishableKey.includes("PASTE_YOUR")
  );
}

function rsGetClient() {
  if (!rsConfigReady()) return null;

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase JS library is not loaded.");
    return null;
  }

  if (!rsSupabaseClient) {
    rsSupabaseClient = window.supabase.createClient(
      RS_SUPABASE_CONFIG.url,
      RS_SUPABASE_CONFIG.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          flowType: "implicit"
        }
      }
    );
  }

  return rsSupabaseClient;
}

function rsDashboardUrl() {
  return `${window.location.origin}${window.location.pathname.replace(/callback\.html$/, "dashboard.html").replace(/login\.html$/, "dashboard.html")}`;
}

function rsLoginUrl() {
  return `${window.location.origin}${window.location.pathname.replace(/callback\.html$/, "login.html").replace(/dashboard\.html$/, "login.html").replace(/armory\.html$/, "login.html")}`;
}



function rsDecodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");
    return JSON.parse(atob(padded));
  } catch (error) {
    console.warn("JWT decode warning:", error);
    return null;
  }
}

function rsUserFromTokenPayload(accessToken) {
  const payload = rsDecodeJwtPayload(accessToken);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email || "discord@redsquadron.local",
    user_metadata: payload.user_metadata || payload.app_metadata || {},
    identities: []
  };
}


function rsStoredAccessToken() {
  const token = localStorage.getItem("rsArmorySupabaseAccessToken");
  const expiresAt = Number(localStorage.getItem("rsArmorySupabaseAccessTokenExpiresAt") || "0");

  if (!token) return null;
  if (expiresAt && Date.now() > expiresAt) {
    localStorage.removeItem("rsArmorySupabaseAccessToken");
    localStorage.removeItem("rsArmorySupabaseAccessTokenExpiresAt");
    localStorage.removeItem("rsArmorySupabaseUser");
    localStorage.removeItem("rsArmoryAccessKeys");
    return null;
  }

  return token;
}

function rsStoreAccessToken(accessToken, expiresIn, expiresAt) {
  if (!accessToken) return;

  let finalExpiresAt = 0;
  if (expiresAt) {
    finalExpiresAt = Number(expiresAt) * 1000;
  } else if (expiresIn) {
    finalExpiresAt = Date.now() + (Number(expiresIn) * 1000);
  }

  localStorage.setItem("rsArmorySupabaseAccessToken", accessToken);
  if (finalExpiresAt) {
    localStorage.setItem("rsArmorySupabaseAccessTokenExpiresAt", String(finalExpiresAt));
  }
}

async function rsFetchUserFromAccessToken(accessToken) {
  if (!accessToken || !rsConfigReady()) return null;

  const response = await fetch(`${RS_SUPABASE_CONFIG.url}/auth/v1/user`, {
    headers: {
      apikey: RS_SUPABASE_CONFIG.publishableKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    console.warn("Could not fetch Supabase user from access token:", response.status);
    return null;
  }

  return await response.json();
}

function rsClientWithAccessToken(accessToken) {
  if (!accessToken || !window.supabase || !window.supabase.createClient) return rsGetClient();

  return window.supabase.createClient(
    RS_SUPABASE_CONFIG.url,
    RS_SUPABASE_CONFIG.publishableKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}


async function rsSignInWithDiscord() {
  if (RS_SUPABASE_CONFIG.enableLocalPreview) {
    localStorage.setItem("rsArmoryPreviewSession", "authorized");
    window.location.href = "dashboard.html";
    return;
  }

  const client = rsGetClient();

  if (!client) {
    alert("Supabase is not configured yet. Open config.js and paste your Supabase publishable key.");
    return;
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: RS_SUPABASE_CONFIG.redirectTo,
      scopes: "identify email"
    }
  });

  if (error) {
    console.error(error);
    alert("Discord login failed. Check Supabase Discord Provider and Redirect URLs.");
  }
}

async function rsCompleteOAuthCallback() {
  const status = document.getElementById("callbackStatus");

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  if (RS_SUPABASE_CONFIG.enableLocalPreview) {
    localStorage.setItem("rsArmoryPreviewSession", "authorized");
    window.location.href = "dashboard.html";
    return;
  }

  const client = rsGetClient();
  if (!client) {
    setStatus("Login is not configured yet. Please contact Command Staff.");
    return;
  }

  const url = new URL(window.location.href);

  if (url.searchParams.has("error") || url.searchParams.has("error_description")) {
    setStatus("Discord sign-in was not completed. Please return to login and try again.");
    console.error("OAuth error:", url.searchParams.get("error"), url.searchParams.get("error_description"));
    return;
  }

  try {
    setStatus("Verifying Discord access...");

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const expiresIn = hash.get("expires_in");
    const expiresAt = hash.get("expires_at");

    const isLocalHost =
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost";

    if (accessToken && refreshToken) {
      const { data, error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (!error && data && data.session) {
        localStorage.removeItem("rsArmoryDiscordAuth");
        localStorage.removeItem("rsArmoryDiscordLocalToken");
        rsStoreAccessToken(accessToken, expiresIn, expiresAt);
        await rsEnsureProfile(data.session);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.replace("dashboard.html");
        return;
      }
    }

    if (accessToken) {
      rsStoreAccessToken(accessToken, expiresIn, expiresAt);
      const user = await rsFetchUserFromAccessToken(accessToken);

      if (user && user.id) {
        localStorage.removeItem("rsArmoryDiscordAuth");
        localStorage.removeItem("rsArmoryDiscordLocalToken");
        localStorage.setItem("rsArmorySupabaseUser", JSON.stringify(user));

        await rsEnsureProfile({
          access_token: accessToken,
          user
        });

        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.replace("dashboard.html");
        return;
      }

      if (isLocalHost) {
        console.warn("Local Supabase token fallback activated.");
        localStorage.setItem("rsArmoryDiscordAuth", "authorized");
        localStorage.setItem("rsArmoryDiscordTokenTime", String(Date.now()));
        localStorage.setItem("rsArmoryDiscordLocalToken", accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.replace("dashboard.html");
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    const { data, error } = await client.auth.getSession();
    if (error) throw error;

    if (data && data.session) {
      await rsEnsureProfile(data.session);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.replace("dashboard.html");
      return;
    }

    setStatus("Session verification failed. Please return to login and try again.");
  } catch (error) {
    console.error("OAuth callback failed:", error);
    setStatus("Session verification failed. Please return to login and try again.");
  }
}


async function rsGetSession() {
  if (RS_SUPABASE_CONFIG.enableLocalPreview) {
    return { preview: true, user: { id: "preview", email: "preview@redsquadron.local" } };
  }

  const localOAuth = localStorage.getItem("rsArmoryDiscordAuth");
  if (localOAuth === "authorized") {
    return { preview: true, user: { id: "discord-local", email: "discord@redsquadron.local" } };
  }

  const token = rsStoredAccessToken();
  if (token) {
    let user = null;

    try {
      const cached = localStorage.getItem("rsArmorySupabaseUser");
      user = cached ? JSON.parse(cached) : null;
    } catch {
      user = null;
    }

    if (!user || !user.id) {
      user = await rsFetchUserFromAccessToken(token);
      if (!user || !user.id) {
        user = rsUserFromTokenPayload(token);
      }
      if (user && user.id) {
        localStorage.setItem("rsArmorySupabaseUser", JSON.stringify(user));
      }
    }

    if (user && user.id) {
      return {
        access_token: token,
        user
      };
    }
  }

  const client = rsGetClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error(error);
    return null;
  }

  return data.session;
}


async function rsRequireAuth() {
  const session = await rsGetSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  if (!session.preview) {
    await rsEnsureProfile(session);
  }

  return session;
}

async function rsEnsureProfile(session) {
  const accessToken = session.access_token || rsStoredAccessToken();
  const client = accessToken ? rsClientWithAccessToken(accessToken) : rsGetClient();
  if (!client || !session || !session.user) return;

  const user = session.user;
  const metadata = user.user_metadata || {};
  const identity = Array.isArray(user.identities)
    ? user.identities.find(item => item.provider === "discord")
    : null;

  const identityData = identity && identity.identity_data ? identity.identity_data : {};

  const discordUserId =
    metadata.provider_id ||
    metadata.sub ||
    metadata.user_id ||
    metadata.id ||
    identityData.provider_id ||
    identityData.sub ||
    identityData.id;

  const discordUsername =
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    metadata.preferred_username ||
    identityData.full_name ||
    identityData.name ||
    identityData.user_name ||
    identityData.preferred_username ||
    metadata.email ||
    user.email ||
    "Discord User";

  const profile = {
    id: user.id,
    discord_user_id: discordUserId ? String(discordUserId) : null,
    discord_username: discordUsername,
    display_name: discordUsername,
    updated_at: new Date().toISOString()
  };

  const { error } = await client
    .from("profiles")
    .upsert(profile, { onConflict: "id" });

  if (error) {
    console.warn("Profile sync warning:", error.message);
  }
}

async function rsSignOut() {
  localStorage.removeItem("rsArmoryPreviewSession");
  localStorage.removeItem("rsArmoryDiscordAuth");
  localStorage.removeItem("rsArmoryDiscordTokenTime");
  localStorage.removeItem("rsArmoryDiscordLocalToken");
  localStorage.removeItem("rsArmorySupabaseAccessToken");
  localStorage.removeItem("rsArmorySupabaseAccessTokenExpiresAt");
  localStorage.removeItem("rsArmorySupabaseUser");
  localStorage.removeItem("rsArmoryAccessKeys");

  const client = rsGetClient();
  if (client) {
    await client.auth.signOut();
  }

  window.location.href = "index.html";
}


async function rsSyncDiscordRoles() {
  const localOAuth = localStorage.getItem("rsArmoryDiscordAuth");
  if (localOAuth === "authorized" || RS_SUPABASE_CONFIG.enableLocalPreview) {
    return null; // local testing fallback: show all
  }

  const client = rsGetClient();
  if (!client) return null;

  const { data: sessionData } = await client.auth.getSession();
  const session = sessionData && sessionData.session ? sessionData.session : null;
  const accessToken = session && session.access_token ? session.access_token : rsStoredAccessToken();

  if (!accessToken) return null;

  const { data, error } = await client.functions.invoke("sync-discord-roles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (error) {
    console.warn("Discord role sync failed:", error.message);
    return null;
  }

  if (data && Array.isArray(data.access_keys)) {
    localStorage.setItem("rsArmoryAccessKeys", JSON.stringify(data.access_keys));
  }

  return data;
}

function rsReadCachedAccessKeys() {
  try {
    const raw = localStorage.getItem("rsArmoryAccessKeys");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function rsGetAllowedSections() {
  if (RS_SUPABASE_CONFIG.enableLocalPreview) {
    return null;
  }

  const localOAuth = localStorage.getItem("rsArmoryDiscordAuth");
  if (localOAuth === "authorized") {
    return null; // local testing fallback: show all
  }

  const cached = rsReadCachedAccessKeys();
  if (cached) return cached.map(access_key => ({ access_key }));

  const token = rsStoredAccessToken();
  const client = token ? rsClientWithAccessToken(token) : rsGetClient();
  if (!client) return null;

  const { data, error } = await client
    .from("armory_sections")
    .select("slug, access_key, name");

  if (error) {
    console.warn("Could not load allowed armory sections:", error.message);
    return null;
  }

  return data || [];
}
