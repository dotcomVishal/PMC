# PMC IIT Mandi - Production Website Architecture & Build Instructions

## 1. Core Objective & Setup
Act as an expert full-stack architect and UI/UX developer. Initialize and build a production-grade website for the Photography and Movie Making Club (PMC) at IIT Mandi.
*   **Version Control:** Immediately initialize a Git repository (`git init`) and create a robust `.gitignore` for Node, Vite, and Docker environments.
*   **Tech Stack:** React + Vite (TypeScript), Tailwind CSS.
*   **Animations:** Implement Lenis for smooth scrolling, Framer Motion for micro-interactions, and GSAP (ScrollTrigger) for complex, high-performance scroll animations. 

## 2. Aesthetic & Design System
*   **Theme:** Deep cinematic dark mode (using deep blacks like `#0a0a0a` or `#0d0d0d`). The design must be clean, editorial, and minimalist. Strictly avoid glowing neon effects or generic AI aesthetics.
*   **Typography:** Use a high-contrast pairing—a sharp, bold display font for headings and a clean, highly legible sans-serif for body text. 
*   **Animations:** The homepage must feature aggressive but professional scroll animations. Implement parallax effects on hero images, lens-focus blur transitions on scroll, and horizontal film-strip style scrubs.

## 3. Page Structure & Content
*   **Hero Section:** A highly animated, full-screen cinematic intro utilizing GSAP pinning and timeline reveals to introduce the club.
*   **Shutterbugs (Photography):** This section represents the division focused on capturing moments and visual artistry. Build a high-performance masonry gallery for high-res images, placeholder zones for the Shutterbugs logo, and a prominent link to the Instagram handle.
*   **Perception (Videography):** This division focuses on visual storytelling and documentary filmmaking. Design a cinematic video showcase section. Feature dedicated architectural spots for Inter-IIT medal-winning movies (such as the award-winning short films "Blink" or "Sapne"). Include links to the Perception YouTube channel and Instagram handle.
*   **Team Section:** Refer verbatim to the file `image_98823b.jpg` for the layout baseline. Implement this clean, filtered card structure for the club members, but elevate it with staggering GSAP reveal animations as the user scrolls into view.
*   **Footer:** Refer verbatim to the file `image_98d495.jpg`. Replicate this precise, minimalist layout, including the club address, statistics, subtle divider lines, and clean navigation links.

## 4. Docker & Nginx Infrastructure (Production Grade)
*   **Docker Compose:** Create a single `docker-compose.yml` to orchestrate the entire environment.
*   **Internal Network:** Define a custom Docker bridge network to isolate all services. 
*   **Frontend Container:** Use a multi-stage Dockerfile (build the React/Vite app with Node, then serve the static files via a lightweight Nginx image).
*   **Backend Stub (Learning Fest Portal):** Scaffold a basic Node/Express or Python container to act as a placeholder for the future Learning Fest Portal. It should simply return a 200 OK health check for now.
*   **Nginx Reverse Proxy:** Configure a primary API gateway Nginx container. It must be the *only* container exposing a port to the host (expose Port 80, prepare for 443). 
*   **Routing Rules:** 
    *   Route `/` to the internal frontend React container.
    *   Route `/api` to the internal backend container. 
    *   Ensure absolutely no backend or database ports are directly exposed to the host machine.