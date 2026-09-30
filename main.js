/* ==========================================================================
   BRAHMAN ORIGINS — Player Portal & Admin Script (main.js)
   University of Batangas · Capstone Companion Site
   ========================================================================== */

(function () {
  "use strict";

  // Configuration
  const GAME_URL = null; // Set to Unity WebGL build URL when deployed

  /* ---------- 1. Mobile Navigation Toggle ---------- */
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

  /* ---------- 2. Dynamic ScrollSpy & Nav Highlighting ---------- */
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

    // ScrollSpy for index.html sections
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

      if (activeKey === "about" && href.includes("#about")) isMatch = true;
      else if (activeKey === "leaderboard" && href.includes("#leaderboard")) isMatch = true;
      else if (activeKey === "home" && (href === "index.html" || href === "#" || href === "/" || href.endsWith("index.html"))) {
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
  document.addEventListener("DOMContentLoaded", updateActiveNav);

  /* ---------- 3. Smooth Anchor Scrolling ---------- */
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

  /* ---------- 4. Toast Notification System ---------- */
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

  /* ---------- 5. Populate Dynamic Leaderboard Table ---------- */
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

  document.addEventListener("DOMContentLoaded", renderLeaderboard);

  /* ---------- 6. Play Game Button & Modal Handler ---------- */
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

  /* ---------- 7. Login Form UB Email Handler ---------- */
  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    const emailInput = loginForm.querySelector("#email");
    const errorEl = loginForm.querySelector(".field-error");

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
      const isUbEmail = /@ub\.edu\.ph$/.test(email);

      if (!isUbEmail) {
        if (errorEl) {
          errorEl.textContent = "Please use your official University of Batangas email address (@ub.edu.ph).";
          errorEl.classList.add("show");
          errorEl.style.display = "block";
        }
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.focus();
        return;
      }

      if (errorEl) {
        errorEl.classList.remove("show");
        errorEl.style.display = "none";
      }
      emailInput.removeAttribute("aria-invalid");
      showToast("Authentication isn't connected yet — this arrives in Phase 2.");
    });
  }

  /* ---------- 8. Admin Panel View Navigation ---------- */
  function initAdminNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    const viewPanels = document.querySelectorAll(".admin-view-panel");

    if (!navItems.length || !viewPanels.length) return;

    navItems.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");

        // Toggle active status on sidebar buttons
        navItems.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        // Hide all admin view panels
        viewPanels.forEach((panel) => panel.classList.add("hidden"));

        // Reveal targeted view panel
        if (targetId) {
          const targetPanel = document.getElementById(targetId);
          if (targetPanel) {
            targetPanel.classList.remove("hidden");
          }
        }
      });
    });
  }

  /* ---------- 9. Admin Student Directory Search & Filter ---------- */
  function initStudentDirectoryFilter() {
    const searchInput = document.querySelector("#student-search-input");
    const nonUbCheckbox = document.querySelector("#filter-non-ub-checkbox");
    const tableBody = document.querySelector("#student-table-body");

    if (!tableBody || (!searchInput && !nonUbCheckbox)) return;

    const filterTable = () => {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
      const showNonUbOnly = nonUbCheckbox ? nonUbCheckbox.checked : false;
      const rows = tableBody.querySelectorAll("tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        const emailCell = row.querySelector(".email-text");
        const email = emailCell ? emailCell.textContent.toLowerCase() : "";
        const isNonUb = !email.endsWith("@ub.edu.ph");

        const matchesQuery = query === "" || text.includes(query);
        const matchesNonUb = !showNonUbOnly || isNonUb;

        if (matchesQuery && matchesNonUb) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    };

    if (searchInput) {
      searchInput.addEventListener("input", filterTable);
    }
    if (nonUbCheckbox) {
      nonUbCheckbox.addEventListener("change", filterTable);
    }
  }

  /* ---------- 10. Logout Button Handler ---------- */
  function initLogout() {
    const logoutBtns = document.querySelectorAll("#logout-btn, #admin-logout-btn");
    logoutBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        showToast("Logged out successfully.");
      });
    });
  }

  // Initialize admin components when DOM content is ready
  document.addEventListener("DOMContentLoaded", () => {
    initAdminNavigation();
    initStudentDirectoryFilter();
    initLogout();
  });
})();