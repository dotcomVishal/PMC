# Learning Fest Portal — Architecture & Implementation Plan (`lf.md`)

## 1. Overview & Objectives

The **Learning Fest Portal** is a secure, high-performance event and competition platform embedded into the Photography and Movie-Making Club (PMC) IIT Mandi website. It enables IIT Mandi students to explore Learning Fest events, review session slides, and participate in competitions by submitting multimedia projects under strict file size and safety guidelines. An integrated Admin Portal provides authorized organizers with tools to publish events, manage slides, configure submission windows, and review student submissions mapped directly to their institute roll numbers.

---

## 2. Navigation & UI/UX Design System

### 2.1 Navigation Bar Placement & Highlighting
- **Placement:** The "Learning Fest" tab will be positioned immediately to the **left** of the "Home" link in the global navigation bar:
  ```
  [ LEARNING FEST ]    HOME    SHUTTERBUGS    PERCEPTION    TEAM
  ```
- **Visual Styling:**
  - A refined, subtle border box around the tab: `border border-white/30 rounded-md px-3.5 py-1.5 bg-white/5 hover:bg-white/10 hover:border-white transition-all duration-300 font-medium`.
  - Maintains `mix-blend-difference` compatibility on the hero section and crisp visibility across all pages.
  - Active state: Highlighted border `border-white` with a discreet glow or solid indicator badge.

### 2.2 Aesthetic Consistency
- Deep cinematic dark theme adhering to PMC design guidelines (`#0a0a0a` background, `#121212` surface cards, `#ffffff` primary text, `#a1a1aa` secondary text).
- Typography: High-contrast pairings using **Bebas Neue** (`font-display`) for headings/tabs and **Inter** (`font-sans`) for body copy and timestamps.

### 2.3 Learning Fest Page Layout
- **Hero / Header:** Title ("LEARNING FEST"), subtitle, user status badge displaying student roll number and email, and a sign-out button.
- **Event Tabs:** Rectangular horizontal/vertical tabs showcasing the name and date badge of each event. Clicking a tab smoothly switches active event details.
- **Active Event Pane:**
  - **Header:** Event Title, Event Date, Category, and Description.
  - **Slide Showcase:** Download / View button for event presentation slides (PDF/PPTX) uploaded by the admin.
  - **Competition & Submission Card:**
    - **Status Badge:** "Upcoming", "Submissions Open", or "Submissions Closed".
    - **Submission Window:** Displays formatted start and end dates/times.
    - **Upload Zone (When Open):** Drag-and-drop multiple file selector with live total file size calculator (capped at 50 MB), upload progress indicator, and file preview pills with remove buttons.
    - **Submission Status:** Displays current user submission details (files submitted, timestamp, and option to resubmit/update before the deadline).

---

## 3. Authentication & Authorization

### 3.1 Institute Email Restriction (`iitmandi.ac.in`)
- **Provider:** Firebase Authentication with Google Sign-In (`signInWithPopup` / `signInWithRedirect`).
- **Domain Whitelist:** Only email addresses ending with `@students.iitmandi.ac.in` or `@iitmandi.ac.in` are permitted.
- **Client-Side Enforcement:**
  - Upon receiving the `UserCredential`, the domain is verified:
    ```typescript
    const email = user.email || '';
    if (!email.endsWith('@students.iitmandi.ac.in') && !email.endsWith('@iitmandi.ac.in')) {
      await auth.signOut();
      throw new Error('Access Restricted: Only IIT Mandi student and institute emails are allowed.');
    }
    ```
- **Server-Side Enforcement (Middleware):**
  - All protected backend routes verify the Firebase ID token using the **Firebase Admin SDK**.
  - Requests with non-whitelisted email domains are rejected with `403 Forbidden`.

### 3.2 Roll Number Extraction
- Students at IIT Mandi have emails structured with their roll number at the start (e.g., `b25339@students.iitmandi.ac.in`).
- The backend parses the prefix prior to `@` into an uppercase roll number:
  ```javascript
  const rollNumber = email.split('@')[0].toUpperCase(); // e.g. "B25339"
  ```
- Every competition submission is linked directly to this extracted `rollNumber`.

### 3.3 Admin Access Control
- **Designated Admin Email:** `b25339@students.iitmandi.ac.in` (configurable via `ADMIN_EMAILS` environment variable in the backend).
- **Admin Verification Middleware:**
  ```javascript
  function requireAdmin(req, res, next) {
    if (!req.user || !ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  }
  ```
- **Admin Portal UI:** When an authenticated admin visits the Learning Fest page, an "Admin Portal" toggle appears allowing them to create events, manage submissions, and export data.

---

## 4. Raw Storage & Database Architecture

All state and files will be stored **raw and locally** within the container environment—no external cloud databases (S3, Cloudinary, AWS RDS) are used. Data persistence is guaranteed through Docker volumes.

### 4.1 Database Engine (Raw SQLite / SQLite3)
- Embedded SQLite engine via `better-sqlite3` or `sqlite3` driver.
- Data stored in a single raw database file: `/data/db/pmc_learning_fest.db`.
- Database schema:
  ```sql
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TEXT NOT NULL,
    slides_filename TEXT,
    slides_original_name TEXT,
    submission_start TEXT NOT NULL,
    submission_end TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    user_email TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(event_id, roll_number)
  );

  CREATE TABLE IF NOT EXISTS submission_files (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE
  );
  ```

### 4.2 Raw Filesystem Storage
- Stored on host-mounted volume `/data/uploads/`:
  - `/data/uploads/slides/`: Stores slides uploaded by admins, organized by `event_id`.
  - `/data/uploads/submissions/{event_id}/{roll_number}/`: Stores multi-file submissions.
- Stored filenames use UUID prefixes to eliminate collision risks and prevent directory traversal exploits.

---

## 5. Competition Submission Engine & Safety Controls

### 5.1 Multi-File Upload Constraints
- Total upload payload cap: **50 MB** per submission.
- Multiple file selection enabled in the UI and supported by Multer multipart parsing.
- If a participant submits again for the same event before the deadline, old files are cleanly cleaned up and replaced with the updated submission.

### 5.2 Security & Safety Measures
1. **Size Limits:**
   - Client-side validation: Evaluates `file.size` summation before upload starts.
   - Nginx gateway: Configured with `client_max_body_size 60M;`.
   - Multer backend: Configured with `{ limits: { fileSize: 50 * 1024 * 1024 } }`.
2. **File Extension & MIME Type Whitelisting:**
   - Whitelist of permitted formats: Images (`.jpg`, `.jpeg`, `.png`, `.webp`, `.raw`, `.cr2`, `.nef`), Videos (`.mp4`, `.mov`, `.mkv`), Documents (`.pdf`, `.pptx`), and Archives (`.zip`).
   - Rejection of executable/script extensions (`.exe`, `.sh`, `.php`, `.js`, `.py`, `.bat`).
3. **Path Traversal Protection:**
   - File names sanitized to remove `..`, `/`, `\`, and null bytes.
   - Files saved with cryptographically random UUIDs (`crypto.randomUUID()`).
4. **Rate Limiting:**
   - Applied via `express-rate-limit` on submission routes (max 10 submissions per 15 minutes per IP/user) to prevent flooding.
5. **Direct Script Execution Disabled:**
   - The upload storage directory is not exposed as a public executable folder. Files are downloaded only through authenticated, stream-based controller endpoints.

---

## 6. Admin Portal Features

When logged in as `b25339@students.iitmandi.ac.in`:

1. **Event Creation & Management:**
   - Form inputs: Event Name, Description, Event Date, Submission Start Date & Time, Submission End Date & Time.
   - Slide Uploader: Upload presentation slides (PDF/PPTX) attached directly to the event record.
   - Action controls: Edit event parameters, update slides, or delete events.
2. **Submissions Dashboard:**
   - Select any event to view the full submissions roster.
   - Table columns:
     - **Roll Number** (e.g., `B25339`)
     - **Email** (`b25339@students.iitmandi.ac.in`)
     - **Submission Timestamp**
     - **Files Attached** (count and individual file download links)
     - **Download All (ZIP)**: Generates a compressed `.zip` archive on the fly containing all participant submissions structured as `{RollNumber}/files...`.

---

## 7. Docker & Nginx Infrastructure Architecture

### 7.1 Port Exposure & Network Isolation
- **Rule:** **No backend or database port is exposed to the host machine.**
- Only `pmc-nginx` binds to the host port (`8087:80`).
- Frontend and backend communicate entirely over the internal bridge network (`pmc-network`).

```
                    HOST MACHINE
                         │
                    Port 8087
                         ▼
        ┌──────────────────────────────────┐
        │       pmc-nginx (Port 80)        │
        └────────────────┬─────────────────┘
                         │ pmc-network (internal)
            ┌────────────┴────────────┐
            ▼                         ▼
   ┌──────────────────┐      ┌──────────────────┐
   │   pmc-frontend   │      │   pmc-backend    │
   │  (React / Nginx) │      │  (Node.js:3000)  │
   │  Internal: 80    │      │  Internal: 3000  │
   └──────────────────┘      └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │ Raw SQLite & FS  │
                             │ (/data/pmc.db,   │
                             │  /data/uploads)  │
                             └──────────────────┘
```

### 7.2 Updated `docker-compose.yml` Specification
```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: pmc-nginx
    ports:
      - "8087:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - pmc-network
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: pmc-frontend
    networks:
      - pmc-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: pmc-backend
    environment:
      - PORT=3000
      - ADMIN_EMAILS=b25339@students.iitmandi.ac.in
      - FIREBASE_SERVICE_ACCOUNT_PATH=/app/serviceAccountKey.json
      - DATA_PATH=/data
    volumes:
      - ./backend/data:/data
      - ./backend/serviceAccountKey.json:/app/serviceAccountKey.json:ro
    networks:
      - pmc-network
    restart: unless-stopped

networks:
  pmc-network:
    driver: bridge
```

### 7.3 Nginx Configuration Updates (`nginx/nginx.conf`)
- Add `client_max_body_size 60M;` to support 50 MB submissions.
- Ensure API routes under `/api/` cleanly pass through headers including authorization tokens:
```nginx
location /api/ {
    client_max_body_size 60M;
    proxy_pass http://backend:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 8. Implementation Steps & Milestones

1. **Phase 1: Backend Foundation & Raw Storage Setup**
   - Initialize SQLite schema in `backend/db.js`.
   - Configure Multer with storage destination in `/data/uploads/` and 50MB file size limits.
   - Mount `serviceAccountKey.json` and initialize `firebase-admin`.
   - Implement Firebase authentication token verification middleware.
   - Implement CRUD endpoints for Events and Slides.
   - Implement Multi-File Submission endpoint with date-window validation and roll number association.
   - Implement Admin endpoints for viewing submissions and streaming `.zip` downloads.

2. **Phase 2: Frontend Client & Firebase Auth Integration**
   - Configure Firebase Client SDK in `frontend/src/firebase.ts`.
   - Create Authentication context/hook ensuring `@students.iitmandi.ac.in` domain lock.
   - Update `Navbar.tsx`: Insert `[ Learning Fest ]` tab with border highlight to the left of `Home`.
   - Create `LearningFest.tsx` component with rectangular event selector tabs and clean dark editorial UI.
   - Implement slide viewer/download button.
   - Implement competition submission form (drag-and-drop, 50MB counter, file list).

3. **Phase 3: Admin Portal UI**
   - Create Admin modal/view for `b25339@students.iitmandi.ac.in`.
   - Event creation form with slide upload and submission start/end datetime pickers.
   - Submissions table grouped by event displaying roll numbers, timestamp, and download links.

4. **Phase 4: Docker & Reverse Proxy Verification**
   - Update `docker-compose.yml` with persistent storage volumes (`./backend/data`).
   - Update `nginx.conf` with `client_max_body_size 60M`.
   - Rebuild containers (`docker compose build && docker compose up -d`).
   - Validate end-to-end functionality, file uploads, and security controls.
