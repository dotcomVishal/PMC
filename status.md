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
*   **Recent Update:** The `scrub` value was increased to `2` for a smoother, slightly delayed follow effect, and the target scale was increased to `60` so the text zooms fully past the camera lens instead of disappearing abruptly.

## Current State
The core infrastructure, Docker orchestration, and initial cinematic home page animations are in place. The project is ready for further development on the Shutterbugs, Perception, and Team pages.
