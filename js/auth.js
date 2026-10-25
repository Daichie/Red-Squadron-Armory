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

    const isLocalHost =
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost";

    if (accessToken && refreshToken) {
      const { data, error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (!error && data && data.session) {
        await rsEnsureProfile(data.session);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.replace("dashboard.html");
        return;
      }

      if (isLocalHost) {
        console.warn("Local Supabase session fallback activated:", error ? error.message : "No session returned.");
        localStorage.setItem("rsArmoryDiscordAuth", "authorized");
        localStorage.setItem("rsArmoryDiscordTokenTime", String(Date.now()));
        localStorage.setItem("rsArmoryDiscordLocalToken", accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.replace("dashboard.html");
        return;
      }
    } else if (accessToken && isLocalHost) {
      localStorage.setItem("rsArmoryDiscordAuth", "authorized");
      localStorage.setItem("rsArmoryDiscordTokenTime", String(Date.now()));
      localStorage.setItem("rsArmoryDiscordLocalToken", accessToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.replace("dashboard.html");
      return;
    }

    // If no hash token exists, try normal Supabase session detection.
    await new Promise(resolve => setTimeout(resolve, 500));

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
  const client = rsGetClient();
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

  if (!session || !session.access_token) return null;

  const { data, error } = await client.functions.invoke("sync-discord-roles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`
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

  const client = rsGetClient();
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
