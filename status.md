# PMC Website Codebase Status

This document provides a high-level overview of the PMC (Photography and Movie Making Club) IIT Mandi website project structure, tech stack, and recent changes. Agents should read this to understand the project architecture and avoid redundant debugging.

## Tech Stack
*   **Frontend:** React, Vite, TypeScript, Tailwind CSS
*   **Animations:** GSAP (ScrollTrigger), Lenis (Smooth Scrolling)
*   **Backend:** Node.js (Stub for future Learning Fest Portal)
*   **Infrastructure:** Docker Compose, Multi-stage Nginx serving for Frontend, Nginx Reverse Proxy for routing.

## Project Structure
*   `frontend/` - Contains the React Vite application.
    *   `src/components/` - React components (`Home.tsx`, `Navbar.tsx`, `Team.tsx`, etc.)
    *   `src/App.tsx` - Main routing and Lenis initialization.
*   `backend/` - Node.js stub returning a basic health check.
*   `nginx/` - Reverse proxy config routing `/` to the frontend container and `/api` to the backend.
*   `docker-compose.yml` - Orchestrates the frontend, backend, and nginx containers.

## Critical Architectural Details & Quirk Notes

### 1. Docker Environment (CRITICAL)
The user is viewing the site via the Docker containers (`docker-compose up -d`), NOT a local Vite dev server on the host machine. 
**Important for Agents:** If you make changes to the source code, Vite's Hot Module Replacement (HMR) will NOT automatically reflect in the user's browser. You MUST run `docker compose build && docker compose up -d` to rebuild the images and restart the containers so the user can see your changes.

### 2. GSAP + Lenis + React Setup
*   `Lenis` is initialized globally in `App.tsx` and tied into `GSAP ScrollTrigger` via `lenis.on('scroll', ScrollTrigger.update)`.
*   Complex scroll animations are heavily used, especially in `Home.tsx`.

### 3. Navbar and Mix-Blend-Mode Bug
The `<nav>` element has `mix-blend-difference` applied.
*   **The Bug:** Applying `opacity` directly to an element with `mix-blend-difference` causes hardware acceleration/compositing bugs in some browsers, resulting in the child elements (text/buttons) remaining fully opaque and visible even when the parent opacity is 0.
*   **The Fix:** The `mix-blend-difference` class is kept on the outer `<nav>` tag, but all opacity and transform styles (and the `id="navbar-content"`) are applied to an inner wrapping `<div>`.
*   **Animation Sync:** The Navbar's visibility is animated by the GSAP timeline in `Home.tsx`. It uses an initial React inline style `style={{ opacity: 0 }}` to guarantee it is hidden on load without flashing, and then `Home.tsx` animates `#navbar-content` to `opacity: 1` as the user scrolls.

### 4. Z-Scroll Animation (Home Page)
The primary Z-scroll zoom effect in `Home.tsx` is achieved by scaling the text up massively while scrolling. 
*   **Recent Update:** The `scrub` value was set to `2` for a smoother follow effect. The media scaling was adjusted to scale cleanly to `1.0` so that it stays strictly within its container bounds without overflowing.

### 5. Side Text Positioning Fix
Previously, the edge text was anchored to the unscaled `max-w-7xl` container while the media container was scaled to `1.1`. This caused the photo card to expand outwards and slice the side texts ("CHOOSE PMC" and "CHOOSE PASSION") in half, creating visual artifacts and split blend modes.
*   **The Fix:** The side text layer is now vertically centered within the screen margins (`left-4 xl:left-8 2xl:left-12` and `right-4 xl:right-8 2xl:right-12`), hidden cleanly on viewports smaller than `lg`, and the media container scales to `1.0`. There is zero overlap on any screen resolution.

### 6. Lenis + GSAP RAF Stutter Fix
Previously, `lenis.raf()` was invoked twice every frame—once via `requestAnimationFrame` and once via `gsap.ticker.add`. The anonymous ticker callback could not be removed on unmount, causing scroll stuttering and memory leaks.
*   **The Fix:** Unified into a single GSAP ticker callback with clean removal on unmount. Exposed Lenis on `(window as any).__lenis` so `ScrollToTop.tsx` can immediately reset scroll position on route transitions.

### 7. Learning Fest Portal Implementation
The Learning Fest portal has been fully built according to `lf.md`:
*   **Navigation:** Added highlighted bordered `[ Learning Fest ]` tab placed to the left of `Home` in `Navbar.tsx`.
*   **Authentication:** Firebase Auth with Google Provider configured in `frontend/src/firebase.ts`. Restricted strictly to `@students.iitmandi.ac.in` and `@iitmandi.ac.in` accounts. Roll number extracted automatically from email prefix.
*   **Backend & Raw Storage:** Fully realized Node/Express backend (`backend/server.js`, `backend/db.js`, `backend/auth.js`) using raw SQLite storage on persistent Docker volumes (`/data/db/pmc_learning_fest.db`) and raw filesystem storage (`/data/uploads/slides`, `/data/uploads/submissions`).
*   **Competition Engine:** Multi-file submissions capped at 50 MB total, file type whitelisting, UUID-based file storage, and active window enforcement.
*   **Admin Portal:** Protected for `b25339@students.iitmandi.ac.in`. Event creation with slide uploads and start/end dates, submission tables with roll numbers, and one-click bulk ZIP archive downloading.
*   **Docker & Nginx:** Multi-container setup where ONLY `pmc-nginx` (port 8087) is exposed. Nginx configured with `client_max_body_size 60M`.

### 8. Learning Fest UI Alignment & Elimination of AI Slop
Based on user feedback:
*   **Authentication:** Exclusively uses Google Sign-In (`signInWithPopup`) restricted strictly to `@students.iitmandi.ac.in` and `@iitmandi.ac.in` email domains. Removed all manual input forms from the unauthenticated view.
*   **Aesthetic Alignment:** High-contrast, brutalist design (`rounded-sm`, `bg-surface` `#121212`, `border border-white/20`, bold Bebas Neue headings, monospace metadata).
*   **Home Page Photo Blending:** Removed `border border-white/5` and rounded card outline from the home hero team photo container. Added a radial gradient mask (`[mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_95%)]`) and subtle radial vignette overlay (`bg-[radial-gradient(ellipse_at_center,transparent_45%,#030303_95%)]`), allowing the photo's studio backdrop to blend into the `#030303` page background with zero visible boundaries.

### 9. Mobile Phone UI & In-Place Photo Viewer
*   **In-Place Photo Viewer (Lightbox):** Allows both participants and admins to click any uploaded image (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`) to view it in place inside an editorial lightbox modal with roll number, file metadata, timestamp, and a download action. Supported on the backend via `/api/submissions/files/:fileId/view`.
*   **Submission Timestamps:** Prominently rendered in the Admin Portal table with initial submission timestamp and updated timestamp if edited.
*   **Mobile UI Optimization:**
    *   **Navbar:** Responsive padding and font sizing with `whitespace-nowrap` to prevent awkward link wrapping.
    *   **Event Selector Tabs:** Horizontally swipeable on smartphones (`flex lg:flex-col overflow-x-auto pb-2`), keeping event details visible without endless vertical scrolling.
    *   **Admin Submissions on Mobile:** Dedicated card view for smartphones displaying roll number, submission timestamp, and files with in-place photo preview triggers.

## Current State
All home page fixes, seamless photo blending, mobile-responsive UI, in-place photo viewer lightbox, and the Learning Fest portal featuring exclusive Google Sign-In are active and verified live inside the Docker environment.
