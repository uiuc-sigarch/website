(function () {
  const mount = document.querySelector("[data-site-nav]");
  if (!mount) {
    return;
  }

  mount.outerHTML = `
    <nav class="site-nav" aria-label="Main navigation">
      <div class="nav-inner">
        <a class="brand" href="index.html">
          <img src="assets/logo-small.png" alt="SIGARCH logo">
          <span>SIGARCH @ UIUC</span>
        </a>
        <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="siteNavLinks" aria-label="Open navigation">☰</button>
        <div class="nav-links" id="siteNavLinks" data-nav-links>
          <a href="meetings.html" data-page="meetings.html">Meetings</a>
          <a href="events.html" data-page="events.html">Events</a>
          <a href="workshops.html" data-page="workshops.html">Workshops</a>
          <a href="https://discord.gg/Cf4FMZVUBR" target="_blank" rel="noopener">Discord</a>
          <a href="faq.html" data-page="faq.html">FAQ</a>
          <button class="theme-toggle" type="button" data-theme-toggle>🌙</button>
        </div>
      </div>
    </nav>`;

  const body = document.body;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const activePage = currentPage === "event.html" ? "events.html" : currentPage;
  navLinks.querySelectorAll("[data-page]").forEach(function (link) {
    if (link.dataset.page === activePage) {
      link.setAttribute("aria-current", "page");
    }
  });

  function preferredTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme) {
    body.dataset.theme = theme;
    const isDark = theme === "dark";
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", isDark ? "Use light theme" : "Use dark theme");
    themeToggle.setAttribute("title", isDark ? "Use light theme" : "Use dark theme");
  }

  setTheme(preferredTheme());

  themeToggle.addEventListener("click", function () {
    const nextTheme = body.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  });

  menuToggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
})();
