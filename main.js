/* ==========================================================================
   BRAHMAN ORIGINS — Player Portal Script (main.js)
   University of Batangas · Capstone Companion Site
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Mobile Navigation ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !document.body.classList.contains("nav-open");
      document.body.classList.toggle("nav-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      
      // Prevent background scrolling while mobile navigation is open
      document.body.style.overflow = isOpen ? "hidden" : "";
    };

    navToggle.addEventListener("click", () => toggleMenu());

    // Close mobile menu when clicking navigation links
    if (navLinks) {
      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => toggleMenu(false));
      });
    }

    // Close menu on Escape key press
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        toggleMenu(false);
        navToggle.focus();
      }
    });

    // Close menu when clicking outside header
    document.addEventListener("click", (e) => {
      const header = document.querySelector(".site-header");
      if (document.body.classList.contains("nav-open") && header && !header.contains(e.target)) {
        toggleMenu(false);
      }
    });
  }

  /* ---------- Smooth Anchor Scrolling with Header Offset ---------- */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      const targetEl = document.querySelector(targetId);

      if (targetEl) {
        e.preventDefault();
        const header = document.querySelector(".site-header");
        const headerOffset = header ? header.offsetHeight : 0;
        const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });

  /* ---------- Toast Notification System ---------- */
  // Unity WebGL build placeholder & UI notification feedback system
  const GAME_URL = null; // Replace with e.g. "https://play.brahmanorigins.ub.edu.ph" when deployed

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
    if (msgEl) {
      msgEl.textContent = message;
    }

    // Double-frame delay ensures CSS transitions animate smoothly on fresh elements
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add("show");
      });
    });

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3800);
  }

  // Intercept "Play the Game" buttons when WebGL build is offline
  document.querySelectorAll("[data-play-game]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (!GAME_URL) {
        e.preventDefault();
        showToast("The Unity WebGL build isn't deployed yet — check back soon, UBian!");
      } else {
        btn.setAttribute("href", GAME_URL);
        btn.setAttribute("target", "_blank");
        btn.setAttribute("rel", "noopener noreferrer");
      }
    });
  });

  /* ---------- Login Form Demo Handler ---------- */
  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    const emailInput = loginForm.querySelector("#email");
    const errorEl = loginForm.querySelector(".field-error");

    if (emailInput) {
      // Clear error state dynamically as user types
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
})();