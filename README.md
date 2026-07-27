# SIGARCH @ UIUC Website Source

The site is a static GitHub Pages site. Every view uses [[file:style.css][style.css]],
[[file:nav.js][nav.js]] for the shared navigation/theme toggle, and [[file:site.js][site.js]]
for page behavior.

## Meetings archive

Meeting materials live in the public [[https://github.com/uiuc-sigarch/meetings][meetings repository]].
On every push to this website's ``main`` branch, GitHub Actions clones that
repository, copies its PDFs into ``meetings/``, generates [[file:meetings.json][meetings.json]],
and commits any changes back to this repository.

```bash
git clone https://github.com/uiuc-sigarch/website.git
```

Adding a new PDF requires only pushing it to the meetings repository in the
existing folder format. The next website push or manual ``Sync meeting PDFs``
workflow run copies it into the website automatically.

The archive embeds the copied local PDFs, so the deployed site does not depend
on GitHub raw URLs, API requests, or third-party PDF viewers.

## Events

The [[file:events.html][events page]] reads event cards from [[file:events.json][events.json]]. Add an event by
creating a folder under [[file:events/][events/]] with an image and an ``event.json``
containing its title, date, description, and Luma URL. The push workflow
regenerates the index automatically.
