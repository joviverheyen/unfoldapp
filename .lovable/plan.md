

# Add Progressive Web App (PWA) Support

The app currently has none of the required PWA infrastructure. Here's what needs to be added so it installs and runs correctly from the iOS home screen.

## Changes

### 1. Install vite-plugin-pwa
Add `vite-plugin-pwa` as a dependency. This handles manifest generation and service worker setup automatically.

### 2. Configure PWA in vite.config.ts
- Register `VitePWA()` plugin with:
  - App name: "Unfold"
  - Theme color and background color matching the app palette
  - A web app manifest with icons (192x192 and 512x512)
  - `display: "standalone"` for a native-like experience
  - Service worker with `navigateFallbackDenylist: [/^\/~oauth/]` so auth redirects always hit the network
  - `registerType: 'autoUpdate'` for seamless updates

### 3. Add mobile meta tags to index.html
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `<meta name="apple-mobile-web-app-title" content="Unfold">`
- `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">`
- `<meta name="theme-color" content="...">`
- Update `<title>` from "Lovable App" to "Unfold"

### 4. Create PWA icons
- Generate placeholder icons at `public/icons/`:
  - `icon-192x192.png`
  - `icon-512x512.png`
  - `apple-touch-icon-180x180.png`
- These can be replaced later with your final brand icons. For now, simple solid-color icons with an "U" will be generated as SVG-based PNGs.

### 5. Register the service worker in the app
- Import `registerSW` from `virtual:pwa-register` in `src/main.tsx`
- Call `registerSW({ immediate: true })` so the app caches assets for offline use

---

## Technical details

### Files to create
- `public/icons/icon-192x192.png` -- placeholder PWA icon
- `public/icons/icon-512x512.png` -- placeholder PWA icon
- `public/icons/apple-touch-icon-180x180.png` -- Apple touch icon

### Files to modify
- **`vite.config.ts`** -- add `VitePWA` plugin with manifest config and service worker settings
- **`index.html`** -- add Apple mobile web app meta tags, theme-color, apple-touch-icon link, update title
- **`src/main.tsx`** -- register the service worker

### Why this fixes the iOS home screen issue
iOS Safari requires:
1. A valid web app manifest (provided by vite-plugin-pwa)
2. `apple-mobile-web-app-capable` meta tag to run in standalone mode
3. An `apple-touch-icon` for the home screen icon
4. A service worker to handle offline caching and navigation fallback

Without these, iOS treats the bookmark as a regular Safari tab that may not load correctly or show a blank screen.
