(function () {
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
        // PDFs are copied into this site during deployment, so the browser
        // receives application/pdf and can render them in its native viewer.
        frame.src = file.path;
        frame.title = (file.title || "Meeting PDF") + " — " + (meeting.date || "SIGARCH meeting");
        frame.loading = "lazy";
        frame.setAttribute("allowfullscreen", "true");
        frame.setAttribute("allow", "fullscreen");

        pdfCard.append(header, frame);
        files.append(pdfCard);
      });
      details.append(files);
      container.append(details);
    });
  }

  function eventTime(event) {
    const time = Date.parse(event.date || "");
    return Number.isNaN(time) ? null : time;
  }

  function eventPageUrl(event) {
    return "event.html?event=" + encodeURIComponent(event.slug || "");
  }

  function renderEventCards(list, events) {
    list.replaceChildren();
    events.forEach(function (event) {
      const card = makeElement("details", "event-card content-card");
      const summary = makeElement("summary", "event-summary");
      if (event.image) {
        const image = document.createElement("img");
        image.className = "event-image";
        image.src = event.image;
        image.alt = event.title || "SIGARCH event";
        image.loading = "lazy";
        summary.append(image);
      } else {
        summary.append(makeElement("div", "event-image-placeholder"));
      }

      const summaryInfo = makeElement("div", "event-summary-info");
      summaryInfo.append(makeElement("h2", null, event.title || "SIGARCH event"));
      if (event.date) {
        summaryInfo.append(makeElement("p", "event-meta", event.date));
      }
      summary.append(summaryInfo);
      card.append(summary);

      const content = makeElement("div", "event-content");
      if (event.description) {
        content.append(makeElement("p", "event-description", event.description));
      }

      const actions = makeElement("div", "event-actions");
      const pageLink = makeElement("a", "button-link", "View event page");
      pageLink.href = eventPageUrl(event);
      actions.append(pageLink);
      if (event.luma) {
        const lumaLink = makeElement("a", "button-link", "Event details & RSVP");
        lumaLink.href = event.luma;
        lumaLink.target = "_blank";
        lumaLink.rel = "noopener noreferrer";
        actions.append(lumaLink);
      }
      content.append(actions);
      card.append(content);
      list.append(card);
    });
  }

  function renderEvents(container, events) {
    const futureList = container.querySelector('[data-event-group="future"] [data-event-list]');
    const pastList = container.querySelector('[data-event-group="past"] [data-event-list]');
    if (!futureList || !pastList) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureEvents = events.filter(function (event) {
      const time = eventTime(event);
      return time === null || time >= today.getTime();
    });
    const pastEvents = events.filter(function (event) {
      const time = eventTime(event);
      return time !== null && time < today.getTime();
    });

    futureEvents.sort(function (a, b) {
      return (eventTime(a) ?? Number.MAX_SAFE_INTEGER) - (eventTime(b) ?? Number.MAX_SAFE_INTEGER);
    });
    pastEvents.sort(function (a, b) {
      return (eventTime(b) ?? 0) - (eventTime(a) ?? 0);
    });

    renderEventCards(futureList, futureEvents);
    renderEventCards(pastList, pastEvents);
    [futureList, pastList].forEach(function (list) {
      const empty = list.parentElement.querySelector("[data-event-empty]");
      empty.hidden = list.children.length > 0;
      if (!empty.hidden) {
        empty.textContent = "No events in this section.";
      }
    });
  }

  function renderEventDetail(container, event) {
    if (!event) {
      container.replaceChildren(makeElement("p", "empty-state", "That event could not be found."));
      return;
    }

    document.title = event.title + " | SIGARCH @ UIUC";
    const card = makeElement("article", "event-detail-card content-card");
    if (event.image) {
      const image = document.createElement("img");
      image.className = "event-detail-image";
      image.src = event.image;
      image.alt = event.title || "SIGARCH event";
      card.append(image);
    } else {
      card.append(makeElement("div", "event-image-placeholder"));
    }
    card.append(makeElement("h1", null, event.title || "SIGARCH event"));
    if (event.date) {
      card.append(makeElement("p", "event-meta", event.date));
    }
    if (event.description) {
      card.append(makeElement("p", "event-description", event.description));
    }
    if (event.luma) {
      const actions = makeElement("div", "event-actions");
      const link = makeElement("a", "button-link", "Event details & RSVP");
      link.href = event.luma;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      actions.append(link);
      card.append(actions);
    }
    container.replaceChildren(card);
  }

  const meetingContainer = document.querySelector("[data-meetings-index]");
  if (meetingContainer) {
    fetch(meetingContainer.dataset.meetingsIndex)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load the generated meeting index");
        }
        return response.json();
      })
      .then(function (meetings) {
        renderMeetings(meetingContainer, meetings);
      })
      .catch(function () {
        meetingContainer.replaceChildren(
          makeElement("p", "empty-state", "Meeting PDFs are not available in this deployment yet. The next site sync will add them.")
        );
      });
  }

  const eventContainer = document.querySelector("[data-events-index]");
  if (eventContainer) {
    fetch(eventContainer.dataset.eventsIndex)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load the generated event index");
        }
        return response.json();
      })
      .then(function (events) {
        renderEvents(eventContainer, events);
      })
      .catch(function () {
        eventContainer.replaceChildren(
          makeElement("p", "empty-state", "Events are not available in this deployment yet.")
        );
      });
  }

  const eventDetailContainer = document.querySelector("[data-event-detail]");
  if (eventDetailContainer) {
    const requestedSlug = new URLSearchParams(window.location.search).get("event");
    fetch("events.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load the generated event index");
        }
        return response.json();
      })
      .then(function (events) {
        renderEventDetail(eventDetailContainer, events.find(function (event) {
          return event.slug === requestedSlug;
        }));
      })
      .catch(function () {
        eventDetailContainer.replaceChildren(
          makeElement("p", "empty-state", "Event details are not available in this deployment yet.")
        );
      });
  }
})();
