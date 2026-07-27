# Events

Create one folder per event. Each event folder should contain an `event.json`
and an image (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, or `.avif`):

```text
events/
└── fall-2026-workshop/
    ├── event.json
    └── poster.png
```

Example `event.json`:

```json
{
  "title": "SIGARCH Fall Workshop",
  "date": "October 10, 2026 · 10:00 AM",
  "description": "Build a small pipelined processor.",
  "luma": "https://lu.ma/your-event"
}
```

The deployment workflow automatically finds the first image in each event
folder and generates the site index. The image can also be selected explicitly
with an `image` field containing its filename.

Events appear under Upcoming or Past events based on `date`. Expanding an
event chip reveals links to its own mini page and its generic “Event details &
RSVP” destination.
