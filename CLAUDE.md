# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

HackOps Echelon is a KYC (Know Your Customer) fraud-detection system with three components that all talk to each other over HTTP:

1. **`frontend/`** — Next.js 16 (App Router, JS not TS) web app. Owns the primary business logic, auth, and database (MongoDB via Mongoose). This is the "backend" for the mobile app too.
2. **`backend/`** — Python FastAPI service that hosts the ML/CV models (OCR, face biometrics, deepfake/manipulation detection, behavioral bot-detection). Stateless — it receives image URLs, runs inference, returns JSON. It does not touch the database.
3. **`hackops_echelon_app/`** — Flutter mobile client that mirrors the Next.js web app's screens and calls the same two backends (see `lib/config/api_config.dart`).

There is no root-level build tool; each of the three directories is developed and run independently.

## Common commands

### Frontend (`frontend/`)
```bash
npm run dev             # Next.js dev server, http://localhost:3000
npm run build
npm run start
npm run check-backend   # node check-backend.js — pings the FastAPI backend health check
```
No test runner or linter is currently configured in `package.json`.

### Backend (`backend/`)
```bash
cd backend
pip install -r models/requirements.txt
uvicorn main:app --reload --port 8000   # http://localhost:8000, docs at /docs
```
No test suite exists in `backend/`.

### Flutter app (`hackops_echelon_app/`)
```bash
cd hackops_echelon_app
flutter pub get
flutter run
flutter test          # runs test/widget_test.dart
```

### Running everything together
`start.bat` (Windows only) starts the backend on :8000 and frontend on :3000 in separate terminals. On macOS/Linux, start each manually as shown above — the Flutter app expects the Next.js API at `localhost:3000` (or `10.0.2.2:3000` from the Android emulator) and the FastAPI service at `:8000`/`10.0.2.2:8000`.

## Architecture

### End-to-end verification pipeline
This is the core flow and spans all three components:

1. User fills the KYC form in the frontend (`frontend/src/app/verification/form`) or Flutter app, uploading Aadhaar + PAN card images and 4-angle selfies (front/left/right/up), while client-side behavioral tracking (`use-behavior-tracking.js`) records keystroke/mouse/paste telemetry to detect bots.
2. `POST /api/verification/submit` (`frontend/src/app/api/verification/submit/route.js`):
   - Authenticates via `Authorization: Bearer <JWT>`.
   - Uploads documents/selfies to Cloudinary.
   - Writes a `verifications` document (status `submitted`) and a separate `behavioralanalyses` document, then links them.
   - Fires `POST /api/verification/ai-process` asynchronously (`setTimeout`, not awaited) to kick off ML processing without blocking the response.
3. `POST /api/verification/ai-process` (`frontend/src/app/api/verification/ai-process/route.js`) orchestrates calls to the FastAPI backend, one stage at a time, each wrapped in its own try/catch so one failing model doesn't abort the rest:
   - `POST {BACKEND_URL}/aadhar/verify` — Aadhaar OCR field extraction
   - `POST {BACKEND_URL}/pan/verify` — PAN OCR field extraction
   - `POST {BACKEND_URL}/face/verify` — deepfake/liveness check across the 4 selfie angles
   - `POST {BACKEND_URL}/manipulation/check` — called twice (once per document) for image tampering detection (ELA + CNN)
   - Results are written into a `VerificationResults` document (`frontend/src/models/result.js`), which computes `overallAssessment` / `verificationStatus` / `isHighRisk` via its own methods (`calculateOverallAssessment()`, `getVerificationStatus()`, `checkIsHighRisk()`).
   - The parent `verifications` document status advances to `under_officer_review` (or stays under automated verification/fails through to review on error).
4. An officer reviews flagged/pending applications under `frontend/src/app/officer/*` and `frontend/src/app/api/officer/*`, ultimately setting status to `approved`/`rejected`.

Verification status lifecycle: `draft → submitted → under_automated_verification → under_officer_review → approved | rejected`.

### Frontend data layer
- **MongoDB access is direct, not through a REST layer**: API routes under `frontend/src/app/api/**` connect straight to Mongoose (`frontend/src/lib/mongodb.js`, caches the connection on `global.mongoose` to survive Next.js hot reload) and query models in `frontend/src/models/`. Note `verification/submit/route.js` also has its own inline mongoose connect/JWT-verify helpers rather than reusing `lib/mongodb.js` / `lib/jwt.js` — be aware both paths exist when editing auth or DB logic there.
- Auth is custom JWT (not NextAuth despite the `NEXTAUTH_URL` env var name floating around) — `frontend/src/lib/jwt.js` signs/verifies, `frontend/src/lib/auth-middleware.js` provides `requireAuth()`/`authenticate()` for route handlers, `frontend/src/lib/auth-context.js` provides the client-side React context. Tokens are stored in `localStorage` and attached by the axios interceptor in `frontend/src/lib/axios.js`.
- `User.role` is one of `user | admin | officer` — officer-only pages live under `frontend/src/app/officer/` and are gated by `frontend/src/app/officer/layout.js`.
- Client data fetching goes through TanStack Query wrappers in `frontend/src/hooks/use-api.js` (`useGet`/`usePost`/`usePut`/`useDelete`), backed by the shared `api` axios instance — prefer these over ad hoc `fetch`/`axios` calls in components.
- File storage is Cloudinary (`frontend/src/lib/cloudinary.js` and inline config in the submit/signature routes), not local disk or S3.
- UI components are shadcn/ui (`components.json`, style "new-york", JS not TSX) under `frontend/src/components/ui/`; path alias `@/*` → `frontend/src/*` (`jsconfig.json`).
- i18n is `next-intl`, locale read from the `NEXT_LOCALE` cookie (`frontend/src/i18n/request.js`, `frontend/src/proxy.js`), messages in `frontend/messages/{en,hi}.json`. Note the middleware file is named `proxy.js` and exports `proxy()` (Next.js 15+ convention here), not the usual `middleware.js`/`middleware()`.

### Backend (FastAPI) structure
- `backend/main.py` wires up CORS (only `localhost:3000` allowed) and mounts routers from both `backend/routes/` and — unusually — `backend/models/` (`face_biometrics.py`, `manipulation_detector.py`, `ocrpan.py`, `ocraadhar.py` each define their own `APIRouter` alongside the model-loading/inference code, they aren't just Pydantic schemas).
- `backend/services/behavioral_analyzer.py` contains the bot-detection scoring logic (`BehavioralTrustAnalyzer`) consumed by `backend/routes/behavioral_analysis.py`; this duplicates/parallels client-side scoring already done in the frontend's `use-behavior-tracking.js` before submission.
- Model weights are checked into the repo (`backend/models_data/`, `backend/yolov8n.pt`, `backend/models/trained_model.h5`) — large binary files, be careful about re-downloading or committing new ones casually.
- Endpoints take Cloudinary **URLs**, not file uploads — the backend fetches images itself rather than receiving multipart data.

### Flutter app
- Mirrors the Next.js frontend's screens 1:1 (see `lib/screens/`) and calls the *same* Next.js API routes for auth/verification/officer flows, plus the FastAPI backend directly for `behavioral/analyze`. `lib/config/api_config.dart` is the single source of truth for both base URLs and endpoint paths — update it there if routes change, and note the Android-emulator-specific `10.0.2.2` host substitution.
- State management is `provider` (`lib/providers/auth_provider.dart`, `lib/providers/verification_provider.dart`).

## Working across the stack

When changing a verification field or ML result shape, updates typically need to happen in multiple places kept in sync manually (no shared schema/codegen exists):
- `frontend/src/models/Verification.js` and/or `frontend/src/models/result.js` (Mongoose schema)
- `frontend/src/app/api/verification/submit/route.js` and `ai-process/route.js` (where the shape is constructed)
- The corresponding FastAPI model/router in `backend/models/*.py` or `backend/routes/*.py` (response shape)
- `hackops_echelon_app/lib/models/verification_model.dart` if the mobile client also needs the field

## Environment variables

No `.env.example` is checked in; based on usage in code, the frontend expects at least: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_BACKEND_URL` (FastAPI base URL, defaults to `http://localhost:8000`), `NEXT_PUBLIC_APP_URL`/`NEXTAUTH_URL` (used interchangeably as the frontend's own base URL for server-to-server calls).
