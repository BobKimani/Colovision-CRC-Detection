# ColoVision – Project Overview

## What is this project?
ColoVision is a demo web application that showcases an AI-assisted workflow for colorectal cancer screening. It provides a polished UI for:
- Authentication (email/password and Google) with a guided two‑factor authentication (2FA) flow
- Uploading colonoscopy images
- Simulated, local-only analysis that returns risk scoring, explainable AI artifacts (mock Grad‑CAM heatmaps and LIME-style feature importance), and clinical-style recommendations

This bundle focuses on frontend UX and flows. All auth and analysis are mocked and run in the browser; no server or data storage beyond `localStorage` is used.

## Tech stack
- Vite + React 18 (SWC) – app scaffold and dev server
- TypeScript – type safety
- Radix UI primitives and custom UI components (in `src/components/ui`) + Tailwind-like utility classes (via `src/styles/globals.css`)
- Lucide icons for visuals
- Hash-based custom router (no `react-router`): see `src/components/Router.tsx`

## Key capabilities
- Landing page marketing surface (`LandingPage`)
- Auth flows (`LoginPage`, `SignupPage`) using `AuthService` (mock; uses `localStorage`)
- 2FA setup and verification (`TwoFactorAuth`) using `TwoFactorService` (mock; QR via public QR API)
- Image upload and analysis experience (`DetectionPage`, `ImageUpload`, `AnalysisResults`)
  - Local-only “model inference” simulation, progress UI, and result visualization (risk bands, confidence, heatmap overlay, LIME-style features, recommendations)
  - Privacy notice: images are processed in-browser; nothing is uploaded

## How routing works
- Routes are defined in `src/routes/index.tsx` and rendered by `src/components/Router.tsx`
- Navigation uses URL hash (e.g., `#/login`); simple auth guards redirect to `/login` for protected routes
- Public routes: `/`, `/login`, `/signup`; Protected: `/detection`; 2FA intermediates: `/2fa-setup`, `/2fa-verify`

## Project structure (high level)
- `src/App.tsx` – mounts the custom router with route config
- `src/main.tsx` – Vite entry, mounts React root
- `src/components/` – pages and UI blocks
  - `LandingPage.tsx` – marketing/overview
  - `LoginPage.tsx`, `SignupPage.tsx` – auth forms
  - `TwoFactorAuth.tsx` – 2FA setup/verify screen
  - `DetectionPage.tsx` – upload, process, summarize results
  - `AnalysisResults.tsx` – detailed results visualization
  - `ImageUpload.tsx` – drag-and-drop file intake (referenced by detection flow)
  - `ui/` – reusable UI primitives (button, card, input, tabs, etc.)
- `src/backend/` – mock services and types
  - `auth.ts` – `AuthService` and session types, `localStorage`-backed session
  - `twoFactor.ts` – `TwoFactorService`, QR URL generation, mock verification and backup codes
  - `index.ts` – service exports
- `src/routes/` – route maps (lazy-loaded pages)
- `src/styles/globals.css` – design tokens, themes, and base styles

## Data and security model (demo)
- Sessions and 2FA state are stored in `localStorage` under namespaced keys
- 2FA uses a mock secret and accepts any 6‑digit code (plus demo codes `123456`/`000000`)
- Image analysis is simulated in-browser; heatmaps are generated via `<canvas>`
- No real networking, encryption, HIPAA/FDA compliance or persistence is provided; texts mention these as part of the UX copy only

## Getting started
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open the app (Vite opens on port 3000 by default per `vite.config.ts`)

Login notes (demo):
- Any email/password passes basic client-side validation; new emails go through 2FA setup, existing ones to 2FA verification.
- “Google” path returns a canned user (`google@user.com`).

## Extending or integrating
- Replace mock services in `src/backend/` with real API calls and a proper auth/2FA provider.
- Swap the analysis simulator with real TensorFlow.js or a backend inference endpoint.
- Consider replacing the custom router with `react-router` for more complex navigation.

## Attribution
- Original design reference: see `README.md` for the Figma link.
