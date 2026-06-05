// Red Squadron Armory Supabase Configuration
// Project URL is already added from your Supabase Data API page.
// Paste your Publishable Key below. It starts with: sb_publishable_
//
// IMPORTANT:
// - Do NOT paste your secret key here.
// - Do NOT paste your service_role key here.
// - Do NOT paste your database password here.

window.RS_SUPABASE_CONFIG = {
  url: "https://gcvmszkvdphsidcfkwuq.supabase.co",
  publishableKey: "sb_publishable_-kJerOmhKwUuXw9cvEdjxA_Hd55jZGA",

  // Keep this false for real login.
  // Set to true only if you want to bypass Discord login while testing layout offline.
  enableLocalPreview: false,

  // For local Live Server testing, this will redirect back to dashboard.html.
  redirectTo: `${window.location.origin}${window.location.pathname.replace(/login\.html$/, "callback.html")}`
};
