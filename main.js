/* ==========================================================================
   BRAHMAN ORIGINS — Player Portal Script (main.js)
   University of Batangas · Capstone Companion Site
   ========================================================================== */

(function () {

  "use strict";


  /* ==========================================================================
     MOBILE NAVIGATION
     ========================================================================== */

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle) {

    const toggleMenu = (open) => {

      const isOpen =
        open !== undefined
          ? open
          : !document.body.classList.contains("nav-open");

      document.body.classList.toggle("nav-open", isOpen);

      navToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      document.body.style.overflow =
        isOpen ? "hidden" : "";
    };


    navToggle.addEventListener("click", () => {
      toggleMenu();
    });


    if (navLinks) {

      navLinks
        .querySelectorAll("a")
        .forEach((link) => {

          link.addEventListener("click", () => {
            toggleMenu(false);
          });

        });

    }


    document.addEventListener("keydown", (e) => {

      if (
        e.key === "Escape" &&
        document.body.classList.contains("nav-open")
      ) {

        toggleMenu(false);
        navToggle.focus();

      }

    });


    document.addEventListener("click", (e) => {

      const header =
        document.querySelector(".site-header");

      if (
        document.body.classList.contains("nav-open") &&
        header &&
        !header.contains(e.target)
      ) {

        toggleMenu(false);

      }

    });

  }


  /* ==========================================================================
     ACTIVE NAVIGATION INDICATOR
     ========================================================================== */

  const navAnchors =
    document.querySelectorAll(".nav-links a");


  function updateActiveNav() {

    if (!navAnchors.length) return;


    const path =
      window.location.pathname;

    const currentPage =
      path.substring(
        path.lastIndexOf("/") + 1
      ) || "index.html";


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

        const href =
          link.getAttribute("href") || "";

        if (href.includes("guidelines.html")) {

          link.setAttribute(
            "aria-current",
            "page"
          );

          link.classList.add("active");

        }

      });

      return;
    }


    /* ----- Login Page ----- */

    if (currentPage.includes("login.html")) {

      clearActive();

      navAnchors.forEach((link) => {

        const href =
          link.getAttribute("href") || "";

        if (href.includes("login.html")) {

          link.setAttribute(
            "aria-current",
            "page"
          );

          link.classList.add("active");

        }

      });

      return;
    }


    /* ----- Homepage Scroll Spy ----- */

    const aboutSection =
      document.querySelector("#about");

    const leaderboardSection =
      document.querySelector("#leaderboard");

    const scrollY =
      window.scrollY;

    const header =
      document.querySelector(".site-header");

    const headerOffset =
      header
        ? header.offsetHeight + 60
        : 120;

    const currentScrollPos =
      scrollY + headerOffset;


    let activeKey = "home";


    const aboutTop =
      aboutSection
        ? aboutSection.offsetTop
        : Infinity;

    const leaderboardTop =
      leaderboardSection
        ? leaderboardSection.offsetTop
        : Infinity;


    if (
      leaderboardSection &&
      currentScrollPos >= leaderboardTop
    ) {

      activeKey = "leaderboard";

    } else if (
      aboutSection &&
      currentScrollPos >= aboutTop
    ) {

      activeKey = "about";

    } else {

      activeKey = "home";

    }


    clearActive();


    navAnchors.forEach((link) => {

      const href =
        link.getAttribute("href") || "";

      let isMatch = false;


      if (
        activeKey === "about" &&
        href.includes("#about")
      ) {

        isMatch = true;

      } else if (
        activeKey === "leaderboard" &&
        href.includes("#leaderboard")
      ) {

        isMatch = true;

      } else if (
        activeKey === "home" &&
        (
          href === "index.html" ||
          href === "#" ||
          href === "/" ||
          href.endsWith("index.html")
        )
      ) {

        isMatch = true;

      }


      if (isMatch) {

        link.setAttribute(
          "aria-current",
          "page"
        );

        link.classList.add("active");

      }

    });

  }


  window.addEventListener(
    "scroll",
    updateActiveNav,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    updateActiveNav,
    { passive: true }
  );

  document.addEventListener(
    "DOMContentLoaded",
    updateActiveNav
  );


  /* ==========================================================================
     SMOOTH ANCHOR SCROLLING
     ========================================================================== */

  document
    .querySelectorAll(
      'a[href*="#"]:not([href="#"])'
    )
    .forEach((anchor) => {

      anchor.addEventListener(
        "click",
        function (e) {

          const href =
            this.getAttribute("href");

          const hashIndex =
            href.indexOf("#");

          if (hashIndex === -1) return;


          const targetId =
            href.substring(hashIndex);

          const targetEl =
            document.querySelector(targetId);


          if (targetEl) {

            e.preventDefault();


            const header =
              document.querySelector(
                ".site-header"
              );

            const headerOffset =
              header
                ? header.offsetHeight
                : 0;


            const elementPosition =
              targetEl.getBoundingClientRect().top +
              window.pageYOffset;


            const offsetPosition =
              elementPosition -
              headerOffset;


            window.scrollTo({

              top: offsetPosition,
              behavior: "smooth"

            });

          }

        }
      );

    });


  /* ==========================================================================
     TOAST NOTIFICATION SYSTEM
     ========================================================================== */

  const GAME_URL = null;

  let toastTimeout = null;


  function showToast(message) {

    let toast =
      document.querySelector(".toast");


    if (!toast) {

      toast =
        document.createElement("div");

      toast.className = "toast";

      toast.setAttribute(
        "role",
        "status"
      );

      toast.setAttribute(
        "aria-live",
        "polite"
      );


      toast.innerHTML =
        '<span class="dot" aria-hidden="true"></span>' +
        '<span class="toast-msg"></span>';


      document.body.appendChild(toast);

    }


    const msgEl =
      toast.querySelector(".toast-msg");


    if (msgEl) {
      msgEl.textContent = message;
    }


    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        toast.classList.add("show");

      });

    });


    if (toastTimeout) {

      clearTimeout(toastTimeout);

    }


    toastTimeout =
      setTimeout(() => {

        toast.classList.remove("show");

      }, 3800);

  }


  /* ==========================================================================
     PLAY THE GAME
     ========================================================================== */

  document
    .querySelectorAll("[data-play-game]")
    .forEach((btn) => {

      btn.addEventListener(
        "click",
        (e) => {

          if (!GAME_URL) {

            e.preventDefault();

            showToast(
              "The Unity WebGL build isn't deployed yet — check back soon, UBian!"
            );

          } else {

            btn.setAttribute(
              "href",
              GAME_URL
            );

            btn.setAttribute(
              "target",
              "_blank"
            );

            btn.setAttribute(
              "rel",
              "noopener noreferrer"
            );

          }

        }
      );

    });


  /* ==========================================================================
     NORMAL EMAIL LOGIN
     ========================================================================== */

  const loginForm =
    document.querySelector("#login-form");


  if (loginForm) {

    const emailInput =
      loginForm.querySelector("#email");

    const passwordInput =
      loginForm.querySelector("#password");

    const errorEl =
      loginForm.querySelector("#email-error");


    /* ----- Remove Error While Typing ----- */

    if (emailInput) {

      emailInput.addEventListener(
        "input",
        () => {

          if (errorEl) {

            errorEl.classList.remove("show");
            errorEl.style.display = "none";

          }

          emailInput.removeAttribute(
            "aria-invalid"
          );

        }
      );

    }


    /* ----- Email Login ----- */

    loginForm.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();


        if (!emailInput) return;


        const email =
          emailInput.value
            .trim()
            .toLowerCase();


        const password =
          passwordInput
            ? passwordInput.value
            : "";


        /* Correct UB email validation */
        const isUbEmail =
          /^[^\s@]+@ub\.edu\.ph$/i.test(email);


        /* ----- Check Email ----- */

        if (!isUbEmail) {

          if (errorEl) {

            errorEl.textContent =
              "Please enter a valid University of Batangas email address or Gmail account.";

            errorEl.classList.add("show");

            errorEl.style.display =
              "block";

          }


          emailInput.setAttribute(
            "aria-invalid",
            "true"
          );

          emailInput.focus();

          return;

        }


        /* ----- Check Password ----- */

        if (!password) {

          showToast(
            "Please enter your password, UBian."
          );

          if (passwordInput) {
            passwordInput.focus();
          }

          return;

        }


        /* ----- Valid Email ----- */

        if (errorEl) {

          errorEl.classList.remove("show");

          errorEl.style.display =
            "none";

        }


        emailInput.removeAttribute(
          "aria-invalid"
        );


        /*
         * TEMPORARY LOGIN
         *
         * This is only a frontend demo.
         * Connect this form to PHP/MySQL
         * when the backend authentication
         * is ready.
         */

        showToast(
          "UB account accepted. Backend authentication is not connected yet."
        );

      }
    );

  }


  /* ==========================================================================
     GOOGLE SIGN-IN
     ========================================================================== */

  const googleContainer =
    document.querySelector("#google-signin");


  if (googleContainer) {

    /*
     * IMPORTANT:
     *
     * Replace this with the Client ID
     * you create in Google Cloud.
     *
     * Example:
     *
     * 1234567890-abc123.apps.googleusercontent.com
     */

    const GOOGLE_CLIENT_ID =
      "964623719325-98f01kp5ooeeftst9hulhsou4oftukfs.apps.googleusercontent.com";


    function showGoogleError(message) {

      const error =
        document.querySelector(
          "#google-login-error"
        );


      if (!error) return;


      error.textContent =
        message;

      error.style.display =
        "block";

      error.classList.add("show");

    }


    function clearGoogleError() {

      const error =
        document.querySelector(
          "#google-login-error"
        );


      if (!error) return;


      error.textContent = "";

      error.style.display =
        "none";

      error.classList.remove("show");

    }


    /*
     * Decode the Google ID token only
     * for frontend display/validation.
     *
     * IMPORTANT:
     * This is NOT secure authentication.
     * Real authentication must verify the
     * Google ID token on the PHP server.
     */

    function decodeJwtPayload(token) {

      try {

        const parts =
          token.split(".");


        if (parts.length !== 3) {
          return null;
        }


        const base64 =
          parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");


        const json =
          decodeURIComponent(
            atob(base64)
              .split("")
              .map((char) => {

                return "%" +
                  ("00" +
                    char.charCodeAt(0)
                      .toString(16)
                  ).slice(-2);

              })
              .join("")
          );


        return JSON.parse(json);

      } catch (error) {

        console.error(
          "Unable to decode Google token:",
          error
        );

        return null;

      }

    }


    function handleGoogleLogin(response) {

      clearGoogleError();


      if (
        !response ||
        !response.credential
      ) {

        showGoogleError(
          "Google sign-in did not return a valid credential."
        );

        return;

      }


      const payload =
        decodeJwtPayload(
          response.credential
        );


      if (!payload) {

        showGoogleError(
          "Unable to process your Google account."
        );

        return;

      }


      /*
       * Google provides the hosted domain
       * in the ID token when applicable.
       *
       * We use this for the frontend check.
       */

      const hostedDomain =
        (
          payload.hd ||
          ""
        ).toLowerCase();


      const email =
        (
          payload.email ||
          ""
        ).toLowerCase();


      const isUbAccount =
        hostedDomain === "ub.edu.ph" ||
        email.endsWith("@ub.edu.ph");


      if (!isUbAccount) {

        showGoogleError(
          "Please sign in using your official University of Batangas Google account (@ub.edu.ph)."
        );

        return;

      }


      /*
       * Successful Google sign-in
       *
       * For now this is a frontend demo.
       *
       * Later, send response.credential
       * to your PHP backend for secure
       * verification and session creation.
       */

      console.log(
        "Google sign-in successful"
      );

      console.log(
        "Google account:",
        email
      );


      showToast(
        "Google account verified. Welcome, UBian!"
      );


      /*
       * Example future backend request:
       *
       * fetch("google-login.php", {
       *   method: "POST",
       *   headers: {
       *     "Content-Type": "application/json"
       *   },
       *   body: JSON.stringify({
       *     credential: response.credential
       *   })
       * });
       *
       */


    }


    /*
     * Google calls this callback after
     * successful sign-in.
     */

    window.handleGoogleLogin =
      handleGoogleLogin;


    /*
     * Initialize Google Identity Services
     * after the Google script is available.
     */

    function initializeGoogleSignIn() {

      if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.id
      ) {

        /*
         * Google script may still be loading.
         * Try again shortly.
         */

        setTimeout(
          initializeGoogleSignIn,
          300
        );

        return;

      }


      if (
        GOOGLE_CLIENT_ID.includes(
          "YOUR_GOOGLE_CLIENT_ID"
        )
      ) {

        showGoogleError(
          "Google Sign-In is not configured yet. Add your Google Client ID in main.js."
        );

        console.warn(
          "BRAHMAN ORIGINS: Google Client ID has not been configured."
        );

        return;

      }


      /*
       * Initialize Google Identity Services.
       */

      google.accounts.id.initialize({

        client_id:
          GOOGLE_CLIENT_ID,

        callback:
          handleGoogleLogin,

        auto_select:
          false,

        cancel_on_tap_outside:
          true

      });


      /*
       * Render Google's official button.
       */

      google.accounts.id.renderButton(

        googleContainer,

        {

          type: "standard",

          theme: "outline",

          size: "large",

          text: "signin_with",

          shape: "rectangular",

          logo_alignment: "left",

          width: 360

        }

      );

    }


    /*
     * Start Google Sign-In after
     * the page has loaded.
     */

    if (
      document.readyState === "loading"
    ) {

      document.addEventListener(
        "DOMContentLoaded",
        initializeGoogleSignIn
      );

    } else {

      initializeGoogleSignIn();

    }

  }


})();
