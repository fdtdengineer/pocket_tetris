# Pocket Tetris

A responsive Tetris-style web game built for iPhone, Android, and desktop browsers. It is designed for GitHub Pages and requires no build process.

## Features

- Built with plain HTML, CSS, and JavaScript
- Responsive layout for phones, tablets, and desktop screens
- Touch controls for mobile devices
- Keyboard controls for desktop browsers
- Hard drop, hold, next-piece preview, and ghost piece
- Pause, scoring, line count, and level progression
- PWA support for adding the game to a home screen
- Offline caching with a Service Worker
- Extra bottom clearance for the iPhone Safari toolbar

## Play Online

https://fdtdengineer.github.io/pocket_tetris/

## Controls

### Desktop

- `←` / `→`: Move left or right
- `↓`: Soft drop
- `↑`: Rotate
- `Space`: Hard drop
- `C`: Hold
- `P` or `Esc`: Pause

### Mobile

Use the touch buttons below the game board. The left, right, and down buttons support press-and-hold input.

## Run Locally

Because the project uses a Service Worker, serve it through a local HTTP server instead of opening `index.html` directly.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow for GitHub Pages. In the repository settings, select:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Every push to the `main` branch will then deploy the latest version automatically.

## Project Structure

```text
.
├── index.html
├── style.css
├── mobile-fix.css
├── game.js
├── ui-english.js
├── manifest.webmanifest
├── service-worker.js
└── .github/workflows/pages.yml
```

## License

MIT License
