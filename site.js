(function () {
  const body = document.body;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  function preferredTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme) {
    body.dataset.theme = theme;
    if (!themeToggle) {
      return;
    }
    const isDark = theme === "dark";
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", isDark ? "Use light theme" : "Use dark theme");
    themeToggle.setAttribute("title", isDark ? "Use light theme" : "Use dark theme");
  }

  setTheme(preferredTheme());

  themeToggle?.addEventListener("click", function () {
    const nextTheme = body.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  });

  menuToggle?.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks?.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function renderMeetings(container, meetings) {
    if (!Array.isArray(meetings) || meetings.length === 0) {
      container.replaceChildren(makeElement("p", "empty-state", "No meeting PDFs are available yet."));
      return;
    }

    meetings.forEach(function (meeting, meetingIndex) {
      const details = makeElement("details", "meeting-card content-card");
      if (meetingIndex === 0) {
        details.open = true;
      }

      const summary = makeElement("summary");
      const title = makeElement("span", null, meeting.title || "SIGARCH meeting");
      const date = makeElement("span", "meeting-date", meeting.date || "");
      summary.append(title, date);
      details.append(summary);

      const files = makeElement("div", "meeting-files");
      (meeting.files || []).forEach(function (file) {
        const pdfCard = makeElement("article", "pdf-card");
        const header = makeElement("header");
        const heading = makeElement("h3", null, file.title || "Meeting PDF");
        const link = makeElement("a", "button-link", "Open PDF");
        link.href = file.path;
        link.target = "_blank";
        link.rel = "noopener";
        header.append(heading, link);

        const frame = document.createElement("iframe");
        frame.src = file.path;
        frame.title = (file.title || "Meeting PDF") + " — " + (meeting.date || "SIGARCH meeting");
        frame.loading = "lazy";

        pdfCard.append(header, frame);
        files.append(pdfCard);
      });
      details.append(files);
      container.append(details);
    });
  }

  const meetingContainer = document.querySelector("[data-meetings-index]");
  if (meetingContainer) {
    fetch(meetingContainer.dataset.meetingsIndex)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load the meeting index");
        }
        return response.json();
      })
      .then(function (meetings) {
        renderMeetings(meetingContainer, meetings);
      })
      .catch(function () {
        meetingContainer.replaceChildren(
          makeElement("p", "empty-state", "Meeting PDFs are unavailable right now. Please initialize the meetings submodule or try again later.")
        );
      });
  }
})();
