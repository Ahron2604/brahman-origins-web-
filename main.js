/* ==========================================================================
   BRAHMAN ORIGINS — Player Portal & Admin Script (main.js)
   University of Batangas · Capstone Companion Site
   ========================================================================== */

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
  const navLinks = document.querySelector(".nav-links");

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
     2. DYNAMIC SCROLLSPY & ACTIVE NAVIGATION INDICATOR
     ========================================================================== */
  const navAnchors = document.querySelectorAll(".nav-links a");

  function updateActiveNav() {
    if (!navAnchors.length) return;

    const path = window.location.pathname;
    const currentPage = path.substring(path.lastIndexOf("/") + 1) || "index.html";

    const clearActive = () => {
      navAnchors.forEach((link) => {
        link.removeAttribute("aria-current");
        link.classList.remove("active");
      });
    };

    /* ----- Guidelines Page ----- */
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

    /* ----- Login Page ----- */
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

    /* ----- ScrollSpy for index.html Sections ----- */
    const aboutSection = document.querySelector("#about");
    const leaderboardSection = document.querySelector("#leaderboard");

    const scrollY = window.scrollY;
    const header = document.querySelector(".site-header");
    const headerOffset = header ? header.offsetHeight + 60 : 120;
    const currentScrollPos = scrollY + headerOffset;

    let activeKey = "home";
    const aboutTop = aboutSection ? aboutSection.offsetTop : Infinity;
    const leaderboardTop = leaderboardSection ? leaderboardSection.offsetTop : Infinity;

    if (leaderboardSection && currentScrollPos >= leaderboardTop) {
      activeKey = "leaderboard";
    } else if (aboutSection && currentScrollPos >= aboutTop) {
      activeKey = "about";
    }

    clearActive();
    navAnchors.forEach((link) => {
      const href = link.getAttribute("href") || "";
      let isMatch = false;

      if (activeKey === "about" && href.includes("#about")) {
        isMatch = true;
      } else if (activeKey === "leaderboard" && href.includes("#leaderboard")) {
        isMatch = true;
      } else if (
        activeKey === "home" &&
        (href === "index.html" || href === "#" || href === "/" || href.endsWith("index.html"))
      ) {
        isMatch = true;
      }

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
      const href = this.getAttribute("href");
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const targetId = href.substring(hashIndex);
      const targetEl = document.querySelector(targetId);

      if (targetEl) {
        e.preventDefault();
        const header = document.querySelector(".site-header");
        const headerOffset = header ? header.offsetHeight : 0;
        const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;

        window.scrollTo({
          top: elementPosition - headerOffset,
          behavior: "smooth"
        });
      }
    });
  });

  /* ==========================================================================
     4. TOAST NOTIFICATION SYSTEM
     ========================================================================== */
  let toastTimeout = null;

  function showToast(message) {
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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add("show"));
    });

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 3800);
  }

  /* ==========================================================================
     5. DYNAMIC LEADERBOARD RENDERER
     ========================================================================== */
  const mockLeaderboardData = [
    { rank: "#01", name: "Miguel Santos", initials: "MS", stage: "College (BSIT)", level: 42, xp: "18,940 XP" },
    { rank: "#02", name: "Alyssa Reyes", initials: "AR", stage: "College (BSCS)", level: 39, xp: "16,820 XP" },
    { rank: "#03", name: "Christian Cruz", initials: "CC", stage: "Senior High (STEM)", level: 35, xp: "14,500 XP" },
    { rank: "#04", name: "Kai Alvarado", initials: "KA", stage: "College (BSIT)", level: 24, xp: "12,420 XP" },
    { rank: "#05", name: "Bea Dimaculangan", initials: "BD", stage: "High School", level: 19, xp: "9,180 XP" }
  ];

  function renderLeaderboard() {
    const tbody = document.querySelector(".leaderboard-table tbody");
    if (!tbody) return;

    tbody.innerHTML = mockLeaderboardData
      .map(
        (row) => `
      <tr>
        <td class="lb-rank"><strong>${row.rank}</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="lb-avatar">${row.initials}</span>
            <strong>${row.name}</strong>
          </div>
        </td>
        <td><span class="stage-pill">${row.stage}</span></td>
        <td><strong>LVL ${row.level}</strong></td>
        <td class="lb-xp">${row.xp}</td>
      </tr>
    `
      )
      .join("");
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
     7. EMAIL & PASSWORD LOGIN HANDLER
     ========================================================================== */
  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    const emailInput = loginForm.querySelector("#email");
    const passwordInput = loginForm.querySelector("#password");
    const errorEl = loginForm.querySelector("#email-error, .field-error");

    if (emailInput) {
      emailInput.addEventListener("input", () => {
        if (errorEl) {
          errorEl.classList.remove("show");
          errorEl.style.display = "none";
        }
        emailInput.removeAttribute("aria-invalid");
      });
    }

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!emailInput) return;

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput ? passwordInput.value : "";
      const isUbEmail = /^[^\s@]+@ub\.edu\.ph$/i.test(email);

      if (!isUbEmail) {
        if (errorEl) {
          errorEl.textContent = "Please enter a valid University of Batangas email address (@ub.edu.ph).";
          errorEl.classList.add("show");
          errorEl.style.display = "block";
        }
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.focus();
        return;
      }

      if (!password) {
        showToast("Please enter your password, UBian.");
        if (passwordInput) passwordInput.focus();
        return;
      }

      if (errorEl) {
        errorEl.classList.remove("show");
        errorEl.style.display = "none";
      }
      emailInput.removeAttribute("aria-invalid");

      showToast("UB account accepted. Backend authentication will connect in Phase 2!");
    });
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

    function decodeJwtPayload(token) {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
          atob(base64)
            .split("")
            .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );

        return JSON.parse(json);
      } catch (error) {
        console.error("Unable to decode Google token:", error);
        return null;
      }
    }

    function handleGoogleLogin(response) {
      clearGoogleError();

      if (!response || !response.credential) {
        showGoogleError("Google sign-in did not return a valid credential.");
        return;
      }

      const payload = decodeJwtPayload(response.credential);
      if (!payload) {
        showGoogleError("Unable to process your Google account.");
        return;
      }

      const hostedDomain = (payload.hd || "").toLowerCase();
      const email = (payload.email || "").toLowerCase();
      const isUbAccount = hostedDomain === "ub.edu.ph" || email.endsWith("@ub.edu.ph");

      if (!isUbAccount) {
        showGoogleError("Please sign in using your official University of Batangas Google account (@ub.edu.ph).");
        return;
      }

      console.log("Google sign-in successful:", email);
      showToast("Google account verified. Welcome, UBian!");
    }

    window.handleGoogleLogin = handleGoogleLogin;

    function initializeGoogleSignIn() {
      if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
        setTimeout(initializeGoogleSignIn, 300);
        return;
      }

      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID")) {
        showGoogleError("Google Sign-In is not configured yet. Add your Google Client ID in main.js.");
        return;
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      google.accounts.id.renderButton(googleContainer, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 360
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeGoogleSignIn);
    } else {
      initializeGoogleSignIn();
    }
  }

  /* ==========================================================================
     9. ADMIN PANEL NAVIGATION
     Tab switching with aria-current update and smooth panel transition.
     ========================================================================== */
  function initAdminNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    const viewPanels = document.querySelectorAll(".admin-view-panel");

    if (!navItems.length || !viewPanels.length) return;

    navItems.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");

        // Update active state + aria-current on nav buttons
        navItems.forEach((btn) => {
          btn.classList.remove("active");
          btn.removeAttribute("aria-current");
        });
        button.classList.add("active");
        button.setAttribute("aria-current", "page");

        // Hide all panels, reveal the target
        viewPanels.forEach((panel) => panel.classList.add("hidden"));

        if (targetId) {
          const targetPanel = document.getElementById(targetId);
          if (targetPanel) {
            targetPanel.classList.remove("hidden");
            // Scroll the main container back to top on tab switch
            targetPanel.closest(".admin-main-container")?.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      });
    });
  }

  /* ==========================================================================
     10. ADMIN STUDENT DIRECTORY SEARCH & FILTER
     Filters by name/email text and optionally shows only non-UBmail rows.
     Updates the "showing X–Y" pagination info label live.
     ========================================================================== */
  function initStudentDirectoryFilter() {
    const searchInput   = document.querySelector("#student-search-input");
    const nonUbCheckbox = document.querySelector("#filter-non-ub-checkbox");
    const tableBody     = document.querySelector("#student-table-body");
    const paginationInfo = document.querySelector(".pagination-info");

    if (!tableBody || (!searchInput && !nonUbCheckbox)) return;

    const filterTable = () => {
      const query        = searchInput ? searchInput.value.toLowerCase().trim() : "";
      const showNonUbOnly = nonUbCheckbox ? nonUbCheckbox.checked : false;
      const rows         = tableBody.querySelectorAll("tr");
      let visibleCount   = 0;

      rows.forEach((row) => {
        const text      = row.textContent.toLowerCase();
        const emailCell = row.querySelector(".email-text");
        const email     = emailCell ? emailCell.textContent.toLowerCase() : "";
        const isNonUb   = !email.endsWith("@ub.edu.ph");

        const matchesQuery  = query === "" || text.includes(query);
        const matchesFilter = !showNonUbOnly || isNonUb;
        const visible       = matchesQuery && matchesFilter;

        row.style.display = visible ? "" : "none";
        if (visible) visibleCount++;
      });

      // Update the visible count label when a filter is active
      if (paginationInfo && (query || showNonUbOnly)) {
        paginationInfo.innerHTML = `Showing <strong>${visibleCount}</strong> filtered result${visibleCount !== 1 ? "s" : ""}`;
      } else if (paginationInfo) {
        paginationInfo.innerHTML = `Showing <strong>1–10</strong> of <strong>2,428</strong> students (Page <strong>1</strong> of <strong>243</strong>)`;
      }
    };

    if (searchInput)   searchInput.addEventListener("input",  filterTable);
    if (nonUbCheckbox) nonUbCheckbox.addEventListener("change", filterTable);
  }

  /* ==========================================================================
     11. ADMIN TICKET ACTIONS
     Resolve button removes the ticket card with a fade; View Ticket toasts.
     ========================================================================== */
  function initTicketActions() {
    const feed = document.querySelector(".reports-feed");
    if (!feed) return;

    feed.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const card = btn.closest(".report-ticket");

      if (btn.classList.contains("btn-gold-sm")) {
        // Resolve: fade out and remove
        if (card) {
          card.style.transition = "opacity 0.35s ease, transform 0.35s ease";
          card.style.opacity = "0";
          card.style.transform = "translateX(12px)";
          setTimeout(() => {
            card.remove();
            // If feed is now empty, insert the empty state
            if (feed.querySelectorAll(".report-ticket").length === 0) {
              feed.innerHTML = `
                <div class="admin-card-surface">
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <p class="empty-state-title">All tickets resolved</p>
                    <p class="empty-state-desc">There are no open game reports right now. Great work keeping the world healthy!</p>
                  </div>
                </div>`;
            }
          }, 380);
          showToast("Ticket marked as resolved.");
        }
      } else if (btn.classList.contains("btn-outline-dark-sm") && btn.textContent.trim() === "View Ticket") {
        showToast("Full ticket viewer coming in Phase 2.");
      }
    });
  }

  /* ==========================================================================
     12. EMPTY-STATE QUICK-ACTION BUTTONS
     Toasts for scaffold buttons in Inquiries and Access Control panels.
     ========================================================================== */
  function initEmptyStateActions() {
    const actions = {
      "btn-compose-inquiry": "Inquiry composer coming in Phase 2.",
      "btn-manage-roles":    "Role management panel coming in Phase 2.",
      "btn-view-tokens":     "API token manager coming in Phase 2.",
    };

    Object.entries(actions).forEach(([id, message]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => showToast(message));
      }
    });

    // Archive link in inquiries panel
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
      btn.addEventListener("click", () => showToast("Logged out successfully."));
    });
  }

  /* ==========================================================================
     DOM INITIALIZERS
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    updateActiveNav();
    renderLeaderboard();
    initAdminNavigation();
    initStudentDirectoryFilter();
    initTicketActions();
    initEmptyStateActions();
    initLogout();
  });
})();