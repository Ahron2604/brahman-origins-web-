/* ==========================================================================
   BRAHMAN ORIGINS — Player Portal & Admin Script (main.js)
   University of Batangas · Capstone Companion Site
   ========================================================================== */

/* --------------------------------------------------------------------------
   SUPABASE INIT (TASK 1)
   Guard: only initialise if the CDN global is available on this page.
   All async helpers call getSupabase() so they fail gracefully on pages
   that don't load the Supabase CDN (e.g. guidelines.html, index without CDN).
   -------------------------------------------------------------------------- */
const SUPABASE_URL = 'https://xbnjmtmmclrippwoblew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibmptdG1tY2xyaXBwd29ibGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3OTMyNjMsImV4cCI6MjEwNTM2OTI2M30.GPZ9q_1vtpF6SbbAHPzsL_OMUJrhxmF3JpK0kMQtTjo';

let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

(function () {
  "use strict";

  /* ==========================================================================
     CONFIGURATIONS
     ========================================================================== */
  const GAME_URL = null; // Set to Unity WebGL build URL when deployed
  const GOOGLE_CLIENT_ID = "964623719325-98f01kp5ooeeftst9hulhsou4oftukfs.apps.googleusercontent.com";

  /* ==========================================================================
     1. MOBILE NAVIGATION
     ========================================================================== */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks  = document.querySelector(".nav-links");

  if (navToggle) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !document.body.classList.contains("nav-open");
      document.body.classList.toggle("nav-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    };

    navToggle.addEventListener("click", () => toggleMenu());

    if (navLinks) {
      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => toggleMenu(false));
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        toggleMenu(false);
        navToggle.focus();
      }
    });

    document.addEventListener("click", (e) => {
      const header = document.querySelector(".site-header");
      if (document.body.classList.contains("nav-open") && header && !header.contains(e.target)) {
        toggleMenu(false);
      }
    });
  }

  /* ==========================================================================
     2. SCROLLSPY & ACTIVE NAVIGATION
     ========================================================================== */
  const navAnchors = document.querySelectorAll(".nav-links a");

  function updateActiveNav() {
    if (!navAnchors.length) return;

    const path        = window.location.pathname;
    const currentPage = path.substring(path.lastIndexOf("/") + 1) || "index.html";

    const clearActive = () => {
      navAnchors.forEach((link) => {
        link.removeAttribute("aria-current");
        link.classList.remove("active");
      });
    };

    if (currentPage.includes("guidelines.html")) {
      clearActive();
      navAnchors.forEach((link) => {
        if ((link.getAttribute("href") || "").includes("guidelines.html")) {
          link.setAttribute("aria-current", "page");
          link.classList.add("active");
        }
      });
      return;
    }

    if (currentPage.includes("login.html")) {
      clearActive();
      navAnchors.forEach((link) => {
        if ((link.getAttribute("href") || "").includes("login.html")) {
          link.setAttribute("aria-current", "page");
          link.classList.add("active");
        }
      });
      return;
    }

    const aboutSection       = document.querySelector("#about");
    const leaderboardSection = document.querySelector("#leaderboard");
    const scrollY            = window.scrollY;
    const header             = document.querySelector(".site-header");
    const headerOffset       = header ? header.offsetHeight + 60 : 120;
    const currentScrollPos   = scrollY + headerOffset;

    let activeKey = "home";
    const aboutTop       = aboutSection       ? aboutSection.offsetTop       : Infinity;
    const leaderboardTop = leaderboardSection ? leaderboardSection.offsetTop : Infinity;

    if (leaderboardSection && currentScrollPos >= leaderboardTop) {
      activeKey = "leaderboard";
    } else if (aboutSection && currentScrollPos >= aboutTop) {
      activeKey = "about";
    }

    clearActive();
    navAnchors.forEach((link) => {
      const href    = link.getAttribute("href") || "";
      let isMatch   = false;
      if      (activeKey === "about"       && href.includes("#about"))       isMatch = true;
      else if (activeKey === "leaderboard" && href.includes("#leaderboard")) isMatch = true;
      else if (activeKey === "home" &&
               (href === "index.html" || href === "#" || href === "/" || href.endsWith("index.html")))
        isMatch = true;
      if (isMatch) {
        link.setAttribute("aria-current", "page");
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  window.addEventListener("resize", updateActiveNav, { passive: true });

  /* ==========================================================================
     3. SMOOTH ANCHOR SCROLLING
     ========================================================================== */
  document.querySelectorAll('a[href*="#"]:not([href="#"])').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href      = this.getAttribute("href");
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const targetEl = document.querySelector(href.substring(hashIndex));
      if (targetEl) {
        e.preventDefault();
        const header       = document.querySelector(".site-header");
        const headerOffset = header ? header.offsetHeight : 0;
        window.scrollTo({
          top:      targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset,
          behavior: "smooth"
        });
      }
    });
  });

  /* ==========================================================================
     4. TOAST NOTIFICATION SYSTEM
     ========================================================================== */
  let toastTimeout = null;

  function showToast(message, type = "info") {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="toast-msg"></span>';
      document.body.appendChild(toast);
    }

    const msgEl = toast.querySelector(".toast-msg");
    if (msgEl) msgEl.textContent = message;

    const dot = toast.querySelector(".dot");
    if (dot) dot.style.background = type === "error" ? "#dc2626" : "";

    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("show")));
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 3800);
  }

  /* ==========================================================================
     5. DYNAMIC LEADERBOARD RENDERER
     ========================================================================== */
  const mockLeaderboardData = [
    { rank: "#01", name: "Miguel Santos",    initials: "MS", stage: "College (BSIT)",     level: 42, xp: "18,940 XP" },
    { rank: "#02", name: "Alyssa Reyes",     initials: "AR", stage: "College (BSCS)",     level: 39, xp: "16,820 XP" },
    { rank: "#03", name: "Christian Cruz",   initials: "CC", stage: "Senior High (STEM)", level: 35, xp: "14,500 XP" },
    { rank: "#04", name: "Kai Alvarado",     initials: "KA", stage: "College (BSIT)",     level: 24, xp: "12,420 XP" },
    { rank: "#05", name: "Bea Dimaculangan", initials: "BD", stage: "High School",        level: 19, xp: "9,180 XP"  }
  ];

  function renderLeaderboard(rows) {
    const tbody = document.querySelector(".leaderboard-table tbody");
    if (!tbody) return;

    const data = rows || mockLeaderboardData;
    tbody.innerHTML = data.map((row) => `
      <tr>
        <td class="lb-rank"><strong>${row.rank || ("#" + String(row.rank_num || 0).padStart(2,"0"))}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="lb-avatar">${row.initials || (row.name || "?").split(" ").map(n => n[0]).join("").toUpperCase().substring(0,2)}</span>
            <strong>${row.name}</strong>
          </div>
        </td>
        <td><span class="stage-pill">${row.stage || row.course || "—"}</span></td>
        <td><strong>LVL ${row.level || 0}</strong></td>
        <td class="lb-xp">${row.xp || ((row.xp_total || 0).toLocaleString() + " XP")}</td>
      </tr>`).join("");
  }

  async function loadLeaderboard() {
    const sb = getSupabase();
    if (!sb) { renderLeaderboard(); return; }
    try {
      // UPDATED FROM "players" TO "profiles" (filtered for students)
      const { data, error } = await sb
        .from("profiles")
        .select("name, course, level, xp_total")
        .neq("role", "admin")
        .order("xp_total", { ascending: false })
        .limit(10);
      if (error || !data || !data.length) { renderLeaderboard(); return; }
      renderLeaderboard(data.map((p, i) => ({
        rank:     "#" + String(i + 1).padStart(2, "0"),
        name:     p.name || "Unknown",
        initials: (p.name || "?").split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2),
        stage:    p.course || "—",
        level:    p.level || 0,
        xp:       (p.xp_total || 0).toLocaleString() + " XP"
      })));
    } catch { renderLeaderboard(); }
  }

  /* ==========================================================================
     6. PLAY GAME BUTTON HANDLER
     ========================================================================== */
  document.querySelectorAll("[data-play-game]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!GAME_URL) {
        showToast("The Unity WebGL build isn't deployed yet — check back soon, UBian!");
      } else {
        window.open(GAME_URL, "_blank", "noopener,noreferrer");
      }
    });
  });

  /* ==========================================================================
     7. EMAIL & PASSWORD LOGIN
     ========================================================================== */
  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    const emailInput    = loginForm.querySelector("#email");
    const passwordInput = loginForm.querySelector("#password");
    const errorEl       = loginForm.querySelector("#email-error, .field-error");
    const submitBtn     = loginForm.querySelector("[type=submit]");

    if (emailInput) {
      emailInput.addEventListener("input", () => {
        if (errorEl) { errorEl.classList.remove("show"); errorEl.style.display = "none"; }
        emailInput.removeAttribute("aria-invalid");
      });
    }

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!emailInput) return;

      const email    = emailInput.value.trim().toLowerCase();
      const password = passwordInput ? passwordInput.value : "";

      if (!email) {
        showFieldError(errorEl, emailInput, "Please enter your email address.");
        return;
      }
      if (!password) {
        showToast("Please enter your password, UBian.");
        if (passwordInput) passwordInput.focus();
        return;
      }

      const sb = getSupabase();
      if (!sb) {
        showToast("Authentication service unavailable. Please reload.", "error");
        return;
      }

      setLoading(submitBtn, true, "Signing in…");
      const { data: authData, error } = await sb.auth.signInWithPassword({ email, password });
      setLoading(submitBtn, false, "Log In");

      if (error) {
        showFieldError(errorEl, emailInput, "Incorrect email or password. Please try again.");
        return;
      }

      await redirectAfterLogin(authData.user);
    });
  }

  function showFieldError(errorEl, inputEl, msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add("show");
      errorEl.style.display = "block";
    }
    if (inputEl) {
      inputEl.setAttribute("aria-invalid", "true");
      inputEl.focus();
    }
  }

  function setLoading(btn, loading, label) {
    if (!btn) return;
    btn.disabled   = loading;
    btn.textContent = label;
  }

  /* ==========================================================================
     8. GOOGLE SIGN-IN INTEGRATION
     ========================================================================== */
  const googleContainer = document.querySelector("#google-signin");

  if (googleContainer) {
    function showGoogleError(message) {
      const error = document.querySelector("#google-login-error, .google-error");
      if (!error) return;
      error.textContent = message;
      error.style.display = "block";
      error.classList.add("show");
    }

    function clearGoogleError() {
      const error = document.querySelector("#google-login-error, .google-error");
      if (!error) return;
      error.textContent = "";
      error.style.display = "none";
      error.classList.remove("show");
    }

    async function handleGoogleLogin(response) {
      clearGoogleError();

      if (!response || !response.credential) {
        showGoogleError("Google sign-in did not return a valid credential.");
        return;
      }

      let payload = null;
      try {
        const base64 = response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        payload = JSON.parse(decodeURIComponent(
          atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
        ));
      } catch {
        showGoogleError("Unable to process your Google account.");
        return;
      }

      const email = (payload.email || "").toLowerCase();
      if (!email) {
        showGoogleError("Could not read your email from the Google account.");
        return;
      }

      const sb = getSupabase();
      if (!sb) {
        showToast("Authentication service unavailable. Please reload.", "error");
        return;
      }

      showToast("Verifying your UB account…");

      const { data: authData, error } = await sb.auth.signInWithIdToken({
        provider:    "google",
        token:       response.credential,
        nonce:       undefined
      });

      if (error) {
        console.error("Supabase Google auth error:", error);
        showGoogleError("Sign-in failed: " + (error.message || "please try again."));
        return;
      }

      await redirectAfterLogin(authData.user);
    }

    window.handleGoogleLogin = handleGoogleLogin;

    function initializeGoogleSignIn() {
      if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
        setTimeout(initializeGoogleSignIn, 300);
        return;
      }

      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID")) {
        console.warn("Google Client ID not configured.");
        return;
      }

      google.accounts.id.initialize({
        client_id:           GOOGLE_CLIENT_ID,
        callback:            handleGoogleLogin,
        auto_select:         false,
        cancel_on_tap_outside: true
      });

      google.accounts.id.renderButton(googleContainer, {
        type:           "standard",
        theme:          "outline",
        size:           "large",
        text:           "signin_with",
        shape:          "rectangular",
        logo_alignment: "left",
        width:          360
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeGoogleSignIn);
    } else {
      initializeGoogleSignIn();
    }
  }

  async function redirectAfterLogin(user) {
    if (!user) { window.location.href = "student.html"; return; }

    const metaRole = user.user_metadata?.role;

    const sb = getSupabase();
    let dbRole = null;
    if (sb) {
      try {
        const { data: profile } = await sb
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        dbRole = profile?.role ?? null;
      } catch { /* ignore */ }
    }

    const finalRole = dbRole || metaRole || "student";

    if (finalRole === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "student.html";
    }
  }

  /* ==========================================================================
     9. ADMIN PANEL NAVIGATION
     ========================================================================== */
  function initAdminNavigation() {
    const navItems   = document.querySelectorAll(".sidebar-nav .nav-item");
    const viewPanels = document.querySelectorAll(".admin-view-panel");
    if (!navItems.length || !viewPanels.length) return;

    navItems.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");

        navItems.forEach((btn) => {
          btn.classList.remove("active");
          btn.removeAttribute("aria-current");
        });
        button.classList.add("active");
        button.setAttribute("aria-current", "page");

        viewPanels.forEach((panel) => panel.classList.add("hidden"));

        if (targetId) {
          const targetPanel = document.getElementById(targetId);
          if (targetPanel) {
            targetPanel.classList.remove("hidden");
            targetPanel.closest(".admin-main-container")
              ?.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      });
    });
  }

  /* ==========================================================================
     10. ADMIN STUDENT DIRECTORY SEARCH & FILTER
     ========================================================================== */
  function initStudentDirectoryFilter() {
    const searchInput    = document.querySelector("#student-search-input");
    const nonUbCheckbox  = document.querySelector("#filter-non-ub-checkbox");
    if (!searchInput && !nonUbCheckbox) return;

    let debounceTimer = null;

    const triggerLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query      = searchInput    ? searchInput.value.trim()  : "";
        const nonUbOnly  = nonUbCheckbox  ? nonUbCheckbox.checked     : false;
        loadSupabaseStudents(query, nonUbOnly);
      }, 280);
    };

    if (searchInput)  searchInput.addEventListener("input",  triggerLoad);
    if (nonUbCheckbox) nonUbCheckbox.addEventListener("change", triggerLoad);
  }

  /* ==========================================================================
     11. ADMIN TICKET ACTIONS
     ========================================================================== */
  function initTicketActions() {
    const feed = document.querySelector(".reports-feed");
    if (!feed) return;

    feed.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const card     = btn.closest(".report-ticket");
      const ticketId = btn.getAttribute("data-ticket-id");

      if (btn.classList.contains("btn-gold-sm")) {
        if (ticketId) {
          const sb = getSupabase();
          if (sb) {
            const { error } = await sb
              .from("tickets")
              .update({ status: "resolved" })
              .eq("id", ticketId);
            if (error) {
              showToast("Failed to resolve ticket — please try again.", "error");
              return;
            }
          }
        }

        if (card) {
          card.style.transition = "opacity 0.35s ease, transform 0.35s ease";
          card.style.opacity    = "0";
          card.style.transform  = "translateX(12px)";
          setTimeout(() => {
            card.remove();
            if (!feed.querySelector(".report-ticket")) {
              feed.innerHTML = `
                <div class="admin-card-surface">
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <p class="empty-state-title">All tickets resolved</p>
                    <p class="empty-state-desc">There are no open game reports right now. Great work!</p>
                  </div>
                </div>`;
            }
          }, 380);
          showToast("Ticket marked as resolved.");
          loadSupabaseOverview();
        }
      } else if (btn.classList.contains("btn-outline-dark-sm")) {
        showToast("Full ticket viewer coming in Phase 2.");
      }
    });
  }

  /* ==========================================================================
     12. EMPTY-STATE QUICK ACTIONS
     ========================================================================== */
  function initEmptyStateActions() {
    const toastMap = {
      "btn-compose-inquiry": "Inquiry composer coming in Phase 2.",
      "btn-manage-roles":    "Role management panel coming in Phase 2.",
      "btn-view-tokens":     "API token manager coming in Phase 2.",
    };
    Object.entries(toastMap).forEach(([id, msg]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", () => showToast(msg));
    });

    const archiveLink = document.querySelector("#view-inquiries .empty-state-action-ghost");
    if (archiveLink) {
      archiveLink.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("Inquiry archive coming in Phase 2.");
      });
    }
  }

  /* ==========================================================================
     13. LOGOUT HANDLER
     ========================================================================== */
  function initLogout() {
    document.querySelectorAll("#logout-btn, #admin-logout-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const sb = getSupabase();
        if (sb) {
          try { await sb.auth.signOut(); } catch { /* best-effort */ }
        }
        window.location.href = "login.html";
      });
    });
  }

  /* ==========================================================================
     13a. ADMIN ACCOUNT UPDATE HELPER
     ========================================================================== */
  window.updateAdminAccount = async function(newEmail, newPassword, currentPassword) {
    const sb = getSupabase();
    if (!sb) {
      console.error("Supabase not initialized");
      return false;
    }

    try {
      const { data: currentSession } = await sb.auth.signInWithPassword({
        email: "brahmanorigins@gmail.com",
        password: "brahmmy123"
      });

      if (!currentSession?.user) {
        console.error("Failed to authenticate with current credentials");
        return false;
      }

      if (newEmail) {
        const { error: emailError } = await sb.auth.updateUser({ email: newEmail });
        if (emailError) {
          console.error("Email update error:", emailError);
          return false;
        }
      }

      if (newPassword) {
        const { error: passwordError } = await sb.auth.updateUser({ password: newPassword });
        if (passwordError) {
          console.error("Password update error:", passwordError);
          return false;
        }
      }

      console.log("Admin account updated successfully!");
      return true;
    } catch (err) {
      console.error("Account update error:", err);
      return false;
    }
  };

  /* ==========================================================================
     14. SUPABASE LIVE DATA — OVERVIEW, STUDENTS, TICKETS
     ========================================================================== */

  async function loadSupabaseOverview() {
    const sb = getSupabase();
    if (!sb) {
      console.warn("Supabase not initialized");
      return;
    }

    try {
      console.log("🔍 Loading overview stats...");
      
      // Fetch all student profiles to count locally
      const { data: allProfiles, error: profilesError } = await sb
        .from("profiles")
        .select("id, email, active, role");
      
      if (profilesError) {
        console.error("❌ Profiles error:", profilesError);
        return;
      }

      // Count students (exclude admins)
      const students = allProfiles?.filter(p => p.role !== 'admin') || [];
      const activeCount = students.filter(p => p.active === true).length;
      const nonUbCount = students.filter(p => !p.email?.includes('@ub.edu.ph')).length;

      console.log("✅ Counts:", { activeCount, nonUbCount, totalStudents: students.length });

      // Get tickets count
      const { count: ticketCount, error: ticketError } = await sb
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      if (ticketError) {
        console.error("❌ Tickets error:", ticketError);
      }

      // Update UI
      const statValues = document.querySelectorAll(".admin-metrics-row .stat-value");
      if (statValues.length >= 3) {
        statValues[0].textContent = Number(activeCount).toLocaleString();
        statValues[1].textContent = Number(nonUbCount).toLocaleString();
        if (ticketCount !== null) statValues[2].textContent = Number(ticketCount).toLocaleString();
      }
    } catch (err) {
      console.error("❌ Overview fetch error:", err);
    }
  }

  async function loadSupabaseStudents(searchQuery = "", nonUbOnly = false) {
    const sb        = getSupabase();
    const tableBody = document.querySelector("#student-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">
        Loading students…
      </td></tr>`;

    const paginationInfo = document.querySelector(".pagination-info");

    if (!sb) {
      console.warn("Supabase not initialized");
      tableBody.innerHTML = "";
      return;
    }

    try {
      console.log("🔍 Loading students...");
      
      // Get all student profiles
      const { data: allProfiles, error } = await sb
        .from("profiles")
        .select("*")
        .neq("role", "admin")
        .order("name", { ascending: true });

      if (error) {
        console.error("❌ Students fetch error:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--error-color);">
          Error: ${error.message || "Unknown error"}</td></tr>`;
        return;
      }

      let players = allProfiles || [];

      // Apply filters
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        players = players.filter(p => 
          (p.name?.toLowerCase().includes(query)) || 
          (p.email?.toLowerCase().includes(query))
        );
      }
      if (nonUbOnly) {
        players = players.filter(p => !p.email?.includes('@ub.edu.ph'));
      }

      const total = allProfiles?.length || 0;
      const count = players.length;

      console.log("✅ Students loaded:", { total, count, filtered: searchQuery || nonUbOnly });

      const paginationInfo = document.querySelector(".pagination-info");
      if (paginationInfo) {
        if (searchQuery || nonUbOnly) {
          paginationInfo.innerHTML = `Showing <strong>${count}</strong> filtered result${count !== 1 ? "s" : ""}`;
        } else {
          paginationInfo.innerHTML = `Showing <strong>${count}</strong> of <strong>${total.toLocaleString()}</strong> students`;
        }
      }

      if (!players || players.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">
          No students found matching your criteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = players.map(player => {
        const isUBMail    = player.email && player.email.toLowerCase().endsWith("@ub.edu.ph");
        const emailBadge  = isUBMail
          ? '<span class="badge-verified-ub">UB Mail</span>'
          : '<span class="badge-warning-ext">External Email</span>';
        const statusClass = player.active ? "active" : "inactive";
        const statusText  = player.active ? "Active" : "Inactive";
        const initials    = (player.name || "P")
          .split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

        return `
          <tr>
            <td>
              <div class="player-col">
                <div class="avatar-sm-gold">${initials}</div>
                <span class="player-name">${player.name || player.username || "—"}</span>
              </div>
            </td>
            <td>
              <div class="email-col">
                <span class="email-text">${player.email || "—"}</span>
                ${emailBadge}
              </div>
            </td>
            <td><span class="badge-course">${player.course || "N/A"}</span></td>
            <td>
              <span class="status-dot ${statusClass}" aria-hidden="true"></span>
              ${statusText}
            </td>
            <td class="text-right"><a href="#" class="link-action">View details &rarr;</a></td>
          </tr>`;
      }).join("");

    } catch (err) {
      console.error("Students query error:", err);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--error-color);">
        Unexpected error. Please refresh.</td></tr>`;
    }
  }

  async function loadSupabaseTickets() {
    const sb   = getSupabase();
    const feed = document.querySelector(".reports-feed");
    if (!feed) return;
    if (!sb)   return;

    try {
      const { data: tickets, error } = await sb
        .from("tickets")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Tickets fetch error:", error);
        return;
      }

      if (!tickets || tickets.length === 0) {
        feed.innerHTML = `
          <div class="admin-card-surface">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p class="empty-state-title">All tickets resolved</p>
              <p class="empty-state-desc">There are no open game reports right now. Great work!</p>
            </div>
          </div>`;
        return;
      }

      feed.innerHTML = "";
      tickets.forEach(ticket => {
        const timeStr   = ticket.created_at
          ? timeSince(new Date(ticket.created_at))
          : "Recently";
        const tag       = ticket.tag || "Technical Issue";
        const isAmber   = tag.toLowerCase().includes("feedback");
        const tagStyle  = isAmber
          ? 'style="background:rgba(245,158,11,0.1);color:#b45309;border-color:rgba(245,158,11,0.3);"'
          : "";
        const borderCol = isAmber ? "#b45309" : "#dc2626";

        const card = document.createElement("div");
        card.className = "admin-card-surface report-ticket";
        card.style.cssText = `border-left:4px solid ${borderCol};padding:22px;margin-bottom:15px;`;
        card.innerHTML = `
          <div class="ticket-header">
            <span class="badge-ticket-tech" ${tagStyle}>${tag}</span>
            <span class="ticket-time meta-timestamp">${timeStr}</span>
          </div>
          <h3 class="ticket-title" style="margin-top:12px;margin-bottom:14px;">${ticket.title || "Untitled ticket"}</h3>
          <div class="ticket-footer">
            <p class="ticket-reporter">Reported by <strong>${ticket.user_name || "Unknown"}</strong></p>
            <div class="ticket-actions">
              <button class="btn-outline-dark-sm">View Ticket</button>
              <button class="btn-gold-sm" data-ticket-id="${ticket.id}">Resolve</button>
            </div>
          </div>`;
        feed.appendChild(card);
      });

    } catch (err) {
      console.error("Tickets query error:", err);
    }
  }

  function timeSince(date) {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60)   return "just now";
    if (secs < 3600) return Math.floor(secs / 60) + " mins ago";
    if (secs < 86400) return Math.floor(secs / 3600) + " hrs ago";
    return Math.floor(secs / 86400) + " days ago";
  }

  /* ==========================================================================
     15. SESSION GUARD + ROLE-BASED PAGE PROTECTION
     ========================================================================== */
  async function checkSessionGuard() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    const isAdmin   = page === "admin.html";
    const isStudent = page === "student.html";
    if (!isAdmin && !isStudent) return;

    document.body.style.visibility = "hidden";

    const sb = getSupabase();
    if (!sb) { document.body.style.visibility = ""; return; }

    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    let role = "student";
    const email = (session.user.email || "").toLowerCase();

    const metaRole = session.user.user_metadata?.role;
    if (metaRole === "admin") role = "admin";

    try {
      const { data: profile } = await sb
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (profile?.role) role = profile.role;
    } catch { /* ignore */ }

    if (isAdmin && role !== "admin") {
      window.location.href = "student.html";
      return;
    }
    if (isStudent && role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    document.body.style.visibility = "";
  }

  /* ==========================================================================
     16. STUDENT — COMPOSE INQUIRY
     ========================================================================== */
  function initComposeInquiry() {
    const modal      = document.getElementById("modal-inquiry");
    const openBtn    = document.getElementById("btn-open-inquiry");
    const closeBtn   = document.getElementById("btn-close-inquiry");
    const form       = document.getElementById("form-inquiry");
    if (!modal || !form) return;

    const openModal  = () => { modal.style.display = "flex"; modal.setAttribute("aria-hidden","false"); };
    const closeModal = () => { modal.style.display = "none"; modal.setAttribute("aria-hidden","true");  form.reset(); };

    if (openBtn)  openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const sb        = getSupabase();
      const submitBtn = form.querySelector("[type=submit]");
      setLoading(submitBtn, true, "Sending…");

      const name    = form.querySelector("#inq-name")?.value.trim()    || "";
      const email   = form.querySelector("#inq-email")?.value.trim()   || "";
      const message = form.querySelector("#inq-message")?.value.trim() || "";

      let success = false;

      if (sb) {
        const { error } = await sb.from("inquiries").insert({ name, email, message });
        success = !error;
        if (error) console.error("Inquiry insert error:", error);
      }

      if (!success) {
        try {
          const res = await fetch("api/submit-inquiry.php", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ name, email, message })
          });
          success = res.ok;
        } catch (err) { console.error("PHP fallback error:", err); }
      }

      setLoading(submitBtn, false, "Send Inquiry");
      if (success) {
        showToast("Inquiry sent! We'll get back to you soon.");
        closeModal();
      } else {
        showToast("Failed to send inquiry — please try again.", "error");
      }
    });
  }

  /* ==========================================================================
     17. STUDENT — REPORT BUG / FEEDBACK
     ========================================================================== */
  function initReportBug() {
    const modal    = document.getElementById("modal-report");
    const openBtn  = document.getElementById("btn-open-report");
    const closeBtn = document.getElementById("btn-close-report");
    const form     = document.getElementById("form-report");
    if (!modal || !form) return;

    const openModal  = () => { modal.style.display = "flex"; modal.setAttribute("aria-hidden","false"); };
    const closeModal = () => { modal.style.display = "none"; modal.setAttribute("aria-hidden","true");  form.reset(); };

    if (openBtn)  openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const sb        = getSupabase();
      const submitBtn = form.querySelector("[type=submit]");
      setLoading(submitBtn, true, "Submitting…");

      const title       = form.querySelector("#rep-title")?.value.trim()       || "";
      const description = form.querySelector("#rep-desc")?.value.trim()        || "";
      const tag         = form.querySelector("#rep-tag")?.value                || "Technical Issue";

      let player_id = null;
      if (sb) {
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
          // UPDATED FROM "players" TO "profiles"
          const { data: p } = await sb
            .from("profiles").select("id").eq("user_id", session.user.id).single();
          if (p) player_id = p.id;
        }
      }

      let success = false;

      if (sb) {
        const payload = { title, description, tag, status: "open" };
        if (player_id) payload.player_id = player_id;
        const { error } = await sb.from("tickets").insert(payload);
        success = !error;
        if (error) console.error("Ticket insert error:", error);
      }

      if (!success) {
        try {
          const res = await fetch("api/submit-ticket.php", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ title, description, tag, player_id })
          });
          success = res.ok;
        } catch (err) { console.error("PHP fallback error:", err); }
      }

      setLoading(submitBtn, false, "Submit Report");
      if (success) {
        showToast("Report submitted! Our team will review it.");
        closeModal();
      } else {
        showToast("Failed to submit report — please try again.", "error");
      }
    });
  }

  /* ==========================================================================
     18. ADMIN — SCHOOL INQUIRIES PANEL
     ========================================================================== */
  async function loadSupabaseInquiries() {
    const container = document.querySelector("#view-inquiries .inquiries-feed");
    if (!container) return;
    const sb = getSupabase();
    if (!sb) return;

    container.innerHTML = `<div style="padding:24px;color:var(--text-muted);text-align:center;">Loading inquiries…</div>`;

    try {
      const { data: inquiries, error } = await sb
        .from("tickets")
        .select("*")
        .eq("tag", "Inquiry")
        .order("created_at", { ascending: false });

      if (error) { console.error("Inquiries fetch:", error); return; }

      if (!inquiries || inquiries.length === 0) {
        container.innerHTML = `
          <div class="admin-card-surface">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p class="empty-state-title">No new inquiries</p>
              <p class="empty-state-desc">When students submit inquiries they'll appear here.</p>
            </div>
          </div>`;
        return;
      }

      container.innerHTML = inquiries.map(inq => {
        const time    = inq.created_at ? timeSince(new Date(inq.created_at)) : "Recently";
        const statusClass = inq.status === "resolved" ? "positive" : "warning";
        const statusLabel = inq.status === "resolved" ? "Resolved" : "Open";
        return `
          <div class="admin-card-surface report-ticket" style="border-left:4px solid var(--gold-400);padding:22px;margin-bottom:14px;" data-inq-id="${inq.id}">
            <div class="ticket-header">
              <span class="badge-ticket-tech" style="background:rgba(212,175,55,0.1);color:var(--gold-500);border-color:rgba(212,175,55,0.3);">School Inquiry</span>
              <span class="ticket-time meta-timestamp">${time}</span>
            </div>
            <p style="margin:10px 0 4px;font-weight:700;color:var(--text-primary);">${inq.user_name || inq.name || "Anonymous"}</p>
            <p style="margin:0 0 12px;font-size:0.85rem;color:var(--text-muted);">${inq.email || ""}</p>
            <p style="font-size:0.93rem;color:var(--text-secondary);margin-bottom:16px;">${inq.description || inq.message || ""}</p>
            <div class="ticket-footer">
              <span class="stat-trend ${statusClass}" style="font-size:0.75rem;">${statusLabel}</span>
              <div class="ticket-actions">
                ${inq.status !== "resolved"
                  ? `<button class="btn-gold-sm" data-resolve-inq="${inq.id}">Mark Resolved</button>`
                  : `<span style="font-size:0.82rem;color:var(--text-muted);">✓ Resolved</span>`
                }
              </div>
            </div>
          </div>`;
      }).join("");

      container.addEventListener("click", async e => {
        const btn = e.target.closest("[data-resolve-inq]");
        if (!btn) return;
        const inqId = btn.getAttribute("data-resolve-inq");
        const { error } = await sb.from("tickets").update({ status: "resolved" }).eq("id", inqId);
        if (!error) {
          showToast("Inquiry marked as resolved.");
          loadSupabaseInquiries();
          loadSupabaseOverview();
        } else {
          showToast("Failed to update inquiry.", "error");
        }
      });

    } catch (err) { console.error("Inquiries query error:", err); }
  }

  /* ==========================================================================
     19. STUDENT PORTAL — LIVE PROFILE LOADER
     ========================================================================== */
  async function loadStudentProfile() {
    const sb = getSupabase();
    if (!sb) return;

    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const email  = (session.user.email || "").toLowerCase();

    let player = null;
    try {
      // UPDATED FROM "players" TO "profiles"
      let { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        const res = await sb
          .from("profiles")
          .select("*")
          .eq("email", email)
          .single();
        data = res.data;
      }
      player = data;
    } catch { /* no player row yet */ }

    let rank = "—";
    if (player) {
      try {
        // UPDATED FROM "players" TO "profiles"
        const { count } = await sb
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .neq("role", "admin")
          .gt("xp_total", player.xp_total ?? 0);
        rank = "#" + ((count ?? 0) + 1);
      } catch { /* ignore */ }
    }

    const level   = player?.level    ?? 1;
    const xpTotal = player?.xp_total ?? 0;
    const xpForCurrentLevel = (level - 1) * 500;
    const xpForNextLevel    = level * 500;
    const xpIntoLevel       = Math.max(0, xpTotal - xpForCurrentLevel);
    const xpNeeded          = xpForNextLevel - xpForCurrentLevel;
    const xpPercent         = Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));

    function getLevelTitle(lvl) {
      if (lvl < 5)  return "New Recruit";
      if (lvl < 10) return "Campus Explorer";
      if (lvl < 20) return "Quest Seeker";
      if (lvl < 30) return "Campus Guardian";
      if (lvl < 40) return "Elite Scholar";
      return "Brahman Legend";
    }

    const fullName   = player?.name  || session.user.user_metadata?.full_name || email;
    const firstName  = fullName.split(" ")[0];
    const initials   = fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    const playerEmail = player?.email || email;
    const points     = (player?.xp_total ?? 0).toLocaleString();
    const questCount = player?.quests_completed ?? 0;
    const title      = getLevelTitle(level);
    const course     = player?.course || "";

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set("student-first-name",  firstName);
    set("student-full-name",   fullName);
    set("student-email",       playerEmail);
    set("student-level-badge", `LEVEL ${level} · ${title.toUpperCase()}${course ? " · " + course : ""}`);
    set("student-xp-value",    `${xpIntoLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`);
    set("student-rank",        rank);
    set("student-points",      points);
    set("student-quests",      questCount.toString());

    ["student-avatar-header", "student-avatar-card"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = initials;
    });

    const bar = document.getElementById("student-xp-bar");
    if (bar) bar.style.width = xpPercent + "%";

    const questList = document.getElementById("student-quest-list");
    if (questList) {
      let quests = [];
      try {
        const { data } = await sb
          .from("quests")
          .select("title, description, progress")
          .eq("player_id", player?.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(4);
        quests = data || [];
      } catch { /* quests table may not exist yet */ }

      if (quests.length > 0) {
        questList.innerHTML = quests.map(q => `
          <li class="quest-item">
            <div class="quest-info">
              <span class="quest-title">${q.title}</span>
              <span class="quest-desc">${q.description || ""}</span>
            </div>
            <span class="badge-gold-pill">${q.progress ?? 0}%</span>
          </li>`).join("");
      } else {
        const dynamicQuests = [];
        if (xpPercent < 100) {
          dynamicQuests.push({
            title: "Level Up",
            desc:  `Earn ${(xpNeeded - xpIntoLevel).toLocaleString()} more XP to reach Level ${level + 1}`,
            pct:   xpPercent
          });
        }
        dynamicQuests.push({
          title: "Climb the Leaderboard",
          desc:  `You are currently ranked ${rank}`,
          pct:   Math.min(99, Math.round((xpTotal / 20000) * 100))
        });

        questList.innerHTML = dynamicQuests.map(q => `
          <li class="quest-item">
            <div class="quest-info">
              <span class="quest-title">${q.title}</span>
              <span class="quest-desc">${q.desc}</span>
            </div>
            <span class="badge-gold-pill">${q.pct}%</span>
          </li>`).join("");
      }
    }

    const activityFeed = document.getElementById("student-activity-feed");
    if (activityFeed) {
      let activity = [];
      try {
        const { data } = await sb
          .from("activity_log")
          .select("title, meta, xp_gain, created_at")
          .eq("player_id", player?.id)
          .order("created_at", { ascending: false })
          .limit(5);
        activity = data || [];
      } catch { /* activity_log table may not exist yet */ }

      if (activity.length > 0) {
        activityFeed.innerHTML = activity.map(a => `
          <li class="activity-item">
            <div class="activity-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="activity-details">
              <span class="activity-title">${a.title}</span>
              <span class="activity-meta">${a.meta || ""} · ${timeSince(new Date(a.created_at))}</span>
            </div>
            ${a.xp_gain ? `<span class="xp-gain-badge">+${a.xp_gain} XP</span>` : ""}
          </li>`).join("");
      } else {
        activityFeed.innerHTML = `
          <li class="activity-item" style="justify-content:center;">
            <span style="color:var(--text-muted);font-size:0.9rem;">No recent activity yet — start playing to earn XP!</span>
          </li>`;
      }
    }

    const inqName  = document.getElementById("inq-name");
    const inqEmail = document.getElementById("inq-email");
    if (inqName  && !inqName.value)  inqName.value  = fullName;
    if (inqEmail && !inqEmail.value) inqEmail.value = playerEmail;
  }

  /* ==========================================================================
     DOM INITIALIZERS
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", async () => {
    console.log("📍 Page loaded:", window.location.pathname);
    
    await checkSessionGuard();

    updateActiveNav();

    if (document.querySelector(".leaderboard-table tbody")) {
      console.log("📍 Loading leaderboard...");
      await loadLeaderboard();
    }

    if (document.querySelector(".admin-layout")) {
      console.log("📍 Admin panel detected - loading data...");
      initAdminNavigation();
      initTicketActions();
      initEmptyStateActions();
      
      try {
        await Promise.all([
          loadSupabaseOverview(),
          loadSupabaseStudents(),
          loadSupabaseTickets(),
          loadSupabaseInquiries()
        ]);
        console.log("✅ All admin data loaded!");
      } catch (err) {
        console.error("❌ Error loading admin data:", err);
      }
      
      initStudentDirectoryFilter();
    }

    if (document.querySelector(".student-canvas")) {
      console.log("📍 Student page detected - loading profile...");
      initComposeInquiry();
      initReportBug();
      await loadStudentProfile();
    }

    initLogout();
  });
})();

  /* ==========================================================================
     DEBUG HELPER: Check admin auth and RLS access
     ========================================================================== */
  window.debugSupabaseAccess = async function() {
    const sb = getSupabase();
    if (!sb) {
      console.log("❌ Supabase not initialized");
      return;
    }

    console.log("📋 Checking Supabase access...\n");

    // Check session
    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    console.log("Session:", { 
      user_id: session?.user?.id, 
      email: session?.user?.email,
    });

    // Direct query - no filters
    console.log("\n🔍 Test 1: Direct profiles query (no filters)...");
    const { data: test1, error: err1 } = await sb
      .from("profiles")
      .select("id, name, role, email")
      .limit(5);
    
    if (err1) {
      console.error("❌ Error:", err1.message);
    } else {
      console.log("✅ Success! Got", test1?.length || 0, "records");
      if (test1) console.log("Sample:", test1[0]);
    }

    // Query with neq filter
    console.log("\n🔍 Test 2: Profiles query with .neq('role', 'admin')...");
    const { data: test2, error: err2 } = await sb
      .from("profiles")
      .select("id, name, role, email")
      .neq("role", "admin")
      .limit(5);
    
    if (err2) {
      console.error("❌ Error:", err2.message);
    } else {
      console.log("✅ Success! Got", test2?.length || 0, "records");
    }

    // Count query
    console.log("\n🔍 Test 3: Count active students...");
    const { count, error: err3 } = await sb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("active", true)
      .neq("role", "admin");
    
    if (err3) {
      console.error("❌ Error:", err3.message);
    } else {
      console.log("✅ Success! Active students:", count);
    }

    // Tickets
    console.log("\n🔍 Test 4: Open tickets...");
    const { data: tickets, count: ticketCount, error: err4 } = await sb
      .from("tickets")
      .select("*", { count: "exact" })
      .eq("status", "open");
    
    if (err4) {
      console.error("❌ Error:", err4.message);
    } else {
      console.log("✅ Success! Open tickets:", ticketCount);
    }

    console.log("\n✅ All tests completed!");
  };
