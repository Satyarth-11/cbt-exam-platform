# National Testing Engine — High-Consequence CBT Examination Platform

A bulletproof, high-consequence Computer-Based Testing (CBT) platform engineered to simulate JEE Main candidate workflows with ultra-low latency, live WebRTC proctoring, webcam snapshot feeds, background session schedulers, candidate rank percentile analytics, and an administrative management suite.

Built using **Spring Boot 3 (Java 21)**, **PostgreSQL 16**, **React 18 + TypeScript**, **Vite**, **Tailwind CSS**, **Redux Toolkit**, **WebRTC**, and **Docker Compose**.

---

## Technical Architecture

```
                                  +-----------------------+
                                  |    Nginx Reverse      |
                                  |    Proxy (:80)        |
                                  +-----------+-----------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
         +-----------v-----------+                         +-----------v-----------+
         | React 18 Frontend App |                         | Spring Boot REST API  |
         | (Nginx Container)     |                         | Backend (:8080)       |
         +-----------------------+                         +-----------+-----------+
                                                                       |
                                                      +----------------+----------------+
                                                      |                                 |
                                          +-----------v-----------+         +-----------v-----------+
                                          | PostgreSQL 16 DB      |         | WebRTC Live           |
                                          | (Flyway Migrations)   |         | Proctoring WS Server  |
                                          +-----------------------+         +-----------------------+
```

### Technology Stack

- **Backend**: Spring Boot 3.3, Java 21, Spring Security (JWT), Spring Data JPA, Hibernate, HikariCP, Flyway, Maven.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Redux Toolkit, React Router v6.
- **Proctoring**: WebRTC PeerConnection, WebSocket Signaling with JWT Handshake Interceptor, WebCam Capture.
- **Database**: PostgreSQL 16.
- **Reverse Proxy**: Nginx with Gzip Compression, Security Headers, and WebSocket Upgrade Proxying.
- **Orchestration**: Multi-stage Docker Dockerfiles & Docker Compose.

---

## Default Seed Credentials Matrix

The system includes pre-seeded demo accounts for testing all user roles:

| Role | Email Address | Default Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **STUDENT / CANDIDATE** | `student@exam.com` | `Student@123` | Can view student dashboard, take live JEE exams, view scorecards & percentile rank reports. |
| **EXAMINER** | `examiner@exam.com` | `Examiner@123` | Can monitor live candidate video streams, review proctor violations, create & edit exams. |
| **ADMINISTRATOR** | `admin@exam.com` | `Admin@123` | Full access to Exam Lifecycle Console, Question Bank Builder, User Management, Audit Trail & Telemetry. |

---

## Phase Feature Matrix (Completed Phases 0 – 8)

- **Phase 0 — Infrastructure & Skeleton**: Multi-container Docker Compose, Nginx reverse proxy, Spring Boot 3 + PostgreSQL baseline.
- **Phase 1 — Auth & Single-Active Session**: JWT authentication, BCrypt password hashing, Redis/DB single-active session enforcement (old session termination on new login), registration, email verification token simulation.
- **Phase 2 — Candidate & Admin Dashboards**: Student dashboard with active test schedule, past exam history; Admin dashboard with system metrics, quick action launcher, live activity feed.
- **Phase 3 — High-Throughput JEE Main Exam Engine**: Fullscreen NTA-compliant exam player, subject section tabs (Physics, Chemistry, Mathematics), Section A MCQ & Section B Numerical questions, palette status matrix (Answered, Not Answered, Marked for Review), periodic 5s background autosave, question order shuffling.
- **Phase 4 — Live Proctoring & Security Hardening**: WebRTC video stream signaling server, JWT query handshake authorization (`/ws/proctor?token=...`), full webcam snapshot storage, client anti-cheating detection (Tab switch, Fullscreen exit, DevTools attempt, Print attempt), 3-violation threshold auto-submission.
- **Phase 5 — Candidate Performance Scorecards & Analytics Reports**: Detailed candidate scorecard page, subject accuracy breakdown, step-by-step solution explanations, percentile rank distribution algorithm, admin exam analytics report with difficulty metrics.
- **Phase 6 — Admin Management Console & Question Bank Builder**: `/admin/exams` lifecycle management (Create, Edit, Schedule, Delete, max violation setting), `/admin/exams/:id/questions` question bank builder with MCQ/Numerical forms, passage question linking, `/admin/users` directory console with role management & password reset.
- **Phase 7 — System Resiliency & Background Jobs**: Spring `@Scheduled` background jobs (30s exam state transition, 60s stale candidate attempt auto-submission), `/admin/audit-logs` Audit Log Explorer console, `/admin/system-health` HikariCP DB pool gauge, JVM heap memory telemetry, and WebRTC session metrics.
- **Phase 8 — Production Nginx Hardening & Integration Delivery**: Nginx `client_max_body_size 15M`, security headers (`X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`), Gzip compression, multi-stage Docker builds.

---

## REST API & WebSocket Reference

### Authentication Endpoints
- `POST /api/v1/auth/register` — Candidate registration
- `POST /api/v1/auth/login` — Authenticate & obtain JWT + Session ID
- `GET /api/v1/auth/me` — Fetch current user profile & roles
- `POST /api/v1/auth/logout` — Logout session
- `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password` — Password reset flow

### Student Exam Engine Endpoints
- `GET /api/v1/student/dashboard` — Student dashboard data
- `GET /api/v1/student/attempts/:attemptId/session` — Fetch active exam session & questions
- `POST /api/v1/student/attempts/:attemptId/answers` — Save candidate question answer
- `POST /api/v1/student/attempts/:attemptId/violations` — Log proctoring security violation
- `POST /api/v1/student/attempts/:attemptId/submit` — Submit exam attempt
- `GET /api/v1/student/attempts/:attemptId/scorecard` — Detailed scorecard & rank percentile

### Live Proctoring & WebRTC
- `WebSocket /ws/proctor?token=JWT_TOKEN` — Live WebRTC signaling upgrade
- `POST /api/v1/proctor/snapshots` — Upload webcam snapshot frame
- `GET /api/v1/proctor/snapshots/:attemptId` — Retrieve snapshot image gallery

### Admin & Examiner Management Endpoints
- `GET/POST/PUT/DELETE /api/v1/admin/exams` — Exam lifecycle management
- `GET/POST/PUT/DELETE /api/v1/admin/exams/:id/questions` — Question bank builder
- `GET/PUT/POST /api/v1/admin/users` — User directory & role management
- `GET /api/v1/admin/audit-logs` — Security audit trail explorer
- `GET /api/v1/admin/system-health` — Live HikariCP DB pool & memory telemetry

---

## Deployment & Running with Docker

### 1. Launch Platform Containers
Run from project root directory:
```powershell
cd C:\Users\satya\.gemini\antigravity-ide\scratch\cbt-exam-platform
docker compose up --build -d
```

### 2. Verify Container Status
```powershell
docker compose ps
```
You should see 4 active healthy services:
- `cbt_postgres` (PostgreSQL 16)
- `cbt_backend` (Spring Boot API)
- `cbt_frontend` (React + Vite)
- `cbt_nginx_proxy` (Nginx Proxy on port 80)

### 3. Application Access
- **Main Platform Application**: [http://localhost](http://localhost) (or [http://localhost:3000](http://localhost:3000))
- **Backend Health Endpoint**: [http://localhost/api/v1/health](http://localhost/api/v1/health)

---

## Troubleshooting & Database Reset

### Resetting Database Volume & Flyway Migrations
If you need a fresh database environment:
```powershell
docker compose down -v
docker compose up --build -d
```

---

## License & Copyright

National Testing Engine Platform &copy; 2026. Built for Enterprise High-Consequence CBT Delivery.
