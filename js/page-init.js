// Red Squadron Armory - Page Initializer
// Keeps HTML files clean by placing page-specific JavaScript here.

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;

  try {
    if (page === "login") {
      const loginButton = document.getElementById("discordLoginBtn");
      if (loginButton) {
        loginButton.addEventListener("click", rsSignInWithDiscord);
      }
      return;
    }

    if (page === "callback") {
      await rsCompleteOAuthCallback();
      return;
    }

    if (page === "dashboard") {
      await requirePreviewSession();
      renderSidebar("dashboard");
      await renderDashboard();
      return;
    }

    if (page === "armory") {
      await requirePreviewSession();
      renderSidebar(getCurrentSlug());
      await renderArmoryPage();
      return;
    }

    if (page === "admin") {
      await requirePreviewSession();
      renderSidebar("dashboard");

      const isAdmin = await rsUserHasAdminAccess();
      if (!isAdmin) {
        document.querySelector(".app-main").innerHTML = `
          <header class="topbar">
            <div>
              <p class="eyebrow">Restricted Access</p>
              <h1>Admin Panel Locked</h1>
            </div>
            <a class="topbar-btn" href="dashboard.html">Back to Dashboard</a>
          </header>
          <section class="content-panel">
            <div class="locked-panel">
              <h2>Command/Admin Access Required</h2>
              <p>This panel is only available to authorized Command/Admin Discord roles.</p>
            </div>
          </section>
        `;
      }
      return;
    }
  } catch (error) {
    console.error("Page initialization failed:", error);
  }
});
