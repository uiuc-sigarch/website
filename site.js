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

  function titleize(value) {
    return value
      .replace(/\.pdf$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function folderLabel(folder) {
    const folderName = folder.split("/").pop();
    const match = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(\d{1,2})-(\d{4})$/i.exec(folderName);
    if (!match) {
      return titleize(folderName);
    }

    const months = {
      jan: "January", feb: "February", mar: "March", apr: "April",
      may: "May", jun: "June", jul: "July", aug: "August",
      sep: "September", oct: "October", nov: "November", dec: "December"
    };
    return months[match[1].toLowerCase()] + " " + match[2] + ", " + match[3];
  }

  function folderSortValue(folder) {
    const folderName = folder.split("/").pop();
    const match = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(\d{1,2})-(\d{4})$/i.exec(folderName);
    if (!match) {
      return 0;
    }
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    return Date.UTC(Number(match[3]), months[match[1].toLowerCase()], Number(match[2]));
  }

  function meetingsFromTree(repo, branch, tree) {
    const groups = new Map();
    tree
      .filter(function (entry) {
        return entry.type === "blob" && entry.path.toLowerCase().endsWith(".pdf");
      })
      .forEach(function (entry) {
        const pathParts = entry.path.split("/");
        const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "root";
        const encodedPath = entry.path.split("/").map(encodeURIComponent).join("/");
        const file = {
          title: titleize(pathParts[pathParts.length - 1]),
          url: "https://raw.githubusercontent.com/" + repo + "/" + branch + "/" + encodedPath
        };
        if (!groups.has(folder)) {
          groups.set(folder, []);
        }
        groups.get(folder).push(file);
      });

    return Array.from(groups.entries())
      .map(function (entry) {
        return {
          title: folderLabel(entry[0]),
          date: entry[0],
          files: entry[1].sort(function (a, b) { return a.title.localeCompare(b.title); })
        };
      })
      .sort(function (a, b) {
        return folderSortValue(b.date) - folderSortValue(a.date) || b.date.localeCompare(a.date);
      });
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
        const viewerUrl = "https://mozilla.github.io/pdf.js/web/viewer.html?file=" + encodeURIComponent(file.url);
        link.href = viewerUrl;
        link.target = "_blank";
        link.rel = "noopener";
        header.append(heading, link);

        const frame = document.createElement("iframe");
        // GitHub serves these files as application/octet-stream, which makes
        // a direct iframe URL download in some browsers. PDF.js reads the
        // public PDF URL and renders it inline inside this frame.
        frame.src = viewerUrl;
        frame.title = (file.title || "Meeting PDF") + " — " + (meeting.date || "SIGARCH meeting");
        frame.loading = "lazy";
        frame.referrerPolicy = "no-referrer";
        frame.setAttribute("allowfullscreen", "true");
        frame.setAttribute("allow", "fullscreen");

        pdfCard.append(header, frame);
        files.append(pdfCard);
      });
      details.append(files);
      container.append(details);
    });
  }

  const meetingContainer = document.querySelector("[data-meetings-repo]");
  if (meetingContainer) {
    const repo = meetingContainer.dataset.meetingsRepo;
    const branch = meetingContainer.dataset.meetingsBranch || "main";
    const apiUrl = "https://api.github.com/repos/" + repo + "/git/trees/" + encodeURIComponent(branch) + "?recursive=1";

    fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load the meetings repository");
        }
        return response.json();
      })
      .then(function (repositoryTree) {
        if (!Array.isArray(repositoryTree.tree)) {
          throw new Error("The meetings repository returned no file tree");
        }
        const meetings = meetingsFromTree(repo, branch, repositoryTree.tree);
        renderMeetings(meetingContainer, meetings);
      })
      .catch(function () {
        meetingContainer.replaceChildren(
          makeElement("p", "empty-state", "Meeting PDFs are unavailable right now. The archive is discovered directly from GitHub, so please try again later.")
        );
      });
  }
})();
