# PM Internship Scheme — Frontend

> **Smart Allocation Engine** · Ministry of Corporate Affairs, Govt. of India  
> React 18 · Vite 5 · TailwindCSS 3 · React Router 6 · Recharts

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Available Scripts](#available-scripts)
7. [Routing](#routing)
8. [State Management & Context](#state-management--context)
9. [Pages](#pages)
10. [Components](#components)
11. [API Utility](#api-utility)
12. [Styling & Design System](#styling--design-system)
13. [Proxy Configuration](#proxy-configuration)

---

## Overview

The **PM Internship Scheme Frontend** is the client-facing React application for the government-grade internship smart allocation engine. It serves three distinct user roles — **Candidates**, **Companies**, and **Administrators** — each with their own authentication flows, dashboards, and feature sets.

Key capabilities include:

- Candidate registration with Aadhaar verification and resume upload
- AI-powered internship match scoring with explainability modal
- Quota-aware allocation status tracking (SC/ST/OBC/EWS/General)
- Company internship posting and applicant management
- Admin dashboard with real-time system analytics and bias auditing

---

## Tech Stack

| Layer            | Technology                         | Version  |
|------------------|------------------------------------|----------|
| UI Framework     | React                              | ^18.2.0  |
| Build Tool       | Vite                               | ^5.3.1   |
| Styling          | TailwindCSS                        | ^3.4.4   |
| Routing          | React Router DOM                   | ^6.20.1  |
| HTTP Client      | Axios                              | ^1.6.2   |
| Charts           | Recharts                           | ^2.15.4  |
| Icons            | React Icons                        | ^4.12.0  |
| PostCSS          | Autoprefixer                       | ^10.4.19 |
| Font             | IBM Plex Sans (Google Fonts)       | —        |

---

## Project Structure

```
frontend/
├── index.html                  # HTML entry point with SEO meta tags
├── vite.config.js              # Vite config (port, proxy, path alias)
├── tailwind.config.js          # Custom design tokens (gov palette, animations)
├── postcss.config.js           # PostCSS with Autoprefixer
├── .env                        # Local environment variables (git-ignored)
├── .env.example                # Template for environment variables
├── package.json                # Dependencies and npm scripts
└── src/
    ├── main.jsx                # React root mount point
    ├── App.jsx                 # BrowserRouter, context providers, all routes
    ├── index.css               # Global styles, CSS resets, custom utilities
    │
    ├── pages/                  # Full-page route components
    │   ├── AdminDashboard.jsx  # Admin control panel with analytics
    │   ├── AdminLogin.jsx      # Admin authentication page
    │   ├── CompanyDashboard.jsx# Company internship & applicant management
    │   ├── CompanyLogin.jsx    # Company login page
    │   ├── CompanyRegister.jsx # Company registration form
    │   ├── InternshipDetail.jsx# Single internship detail view with apply CTA
    │   └── InternshipListing.jsx # Filterable internship browse page
    │
    ├── components/
    │   ├── auth/
    │   │   ├── LoginPage.jsx       # Candidate login form
    │   │   └── RegisterPage.jsx    # Full multi-step candidate registration
    │   │
    │   ├── candidate/
    │   │   ├── LandingPage.jsx     # Public-facing hero/landing page
    │   │   └── Navbar.jsx          # Responsive top navigation bar
    │   │
    │   ├── dashboard/
    │   │   ├── Dashboard.jsx       # Candidate dashboard (main hub)
    │   │   ├── MatchResults.jsx    # AI match score results view
    │   │   ├── AllocationStatus.jsx# Application allocation tracker
    │   │   ├── QuotaDashboard.jsx  # Candidate quota eligibility summary
    │   │   ├── BiasAudit.jsx       # Fairness/bias audit visualization
    │   │   ├── RunAllocation.jsx   # Trigger smart allocation engine
    │   │   └── EditProfileModal.jsx# Slide-over modal for profile editing
    │   │
    │   ├── AadhaarVerify.jsx       # Aadhaar OTP verification widget
    │   ├── ExplainModal.jsx        # AI explainability detail modal
    │   ├── PostInternshipModal.jsx # Company: post new internship modal
    │   └── QuotaPills.jsx          # Reusable quota category badge pills
    │
    ├── context/
    │   ├── AuthContext.jsx     # Candidate auth state (token, profile, login/logout)
    │   ├── CompanyContext.jsx  # Company auth state and internship data
    │   ├── AdminContext.jsx    # Admin session state
    │   └── MatchContext.jsx    # Match result state for candidate dashboard
    │
    └── utils/
        └── api.jsx             # Centralized axios API calls (candidateAPI)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Backend server running on `http://localhost:5001` (see `../backend/README.md`)

### Installation

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:5173**.

> All `/api/*` requests are automatically proxied to the backend at `http://localhost:5001` — no CORS configuration needed in development.

---

## Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable        | Description                        | Default                     |
|-----------------|------------------------------------|-----------------------------|
| `VITE_API_URL`  | Backend API base URL               | `http://localhost:5001`     |

> **Important:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the browser. They are accessed via `import.meta.env.VITE_*`.

---..

## Available Scripts

| Command            | Description                                  |
|--------------------|----------------------------------------------|
| `npm run dev`      | Start Vite development server with HMR       |
| `npm run build`    | Build optimized production bundle to `dist/` |
| `npm run preview`  | Locally preview the production build         |

---

## Routing.

All routes are defined in `src/App.jsx` using `react-router-dom` v6 with `BrowserRouter`.

| Path                  | Component             | Access         | Description                          |
|-----------------------|-----------------------|----------------|--------------------------------------|
| `/`                   | `LandingPage`         | Public         | Hero page with scheme overview       |
| `/register`           | `RegisterPage`        | Public (guest) | Multi-step candidate registration    |
| `/login`              | `LoginPage`           | Public (guest) | Candidate login                      |
| `/dashboard`          | `Dashboard`           | 🔒 Protected   | Candidate main dashboard             |
| `/internships`        | `InternshipListing`   | Public         | Browse and filter internships        |
| `/internships/:id`    | `InternshipDetail`    | Public         | Single internship details            |
| `/company/register`   | `CompanyRegister`     | Public         | Company registration form            |
| `/company/login`      | `CompanyLogin`        | Public         | Company login                        |
| `/company/dashboard`  | `CompanyDashboard`    | Public*        | Company internship management        |
| `/admin/login`        | `AdminLogin`          | Public         | Admin authentication                 |
| `/admin/dashboard`    | `AdminDashboard`      | Public*        | System-wide admin control panel      |
| `*`                   | Redirect to `/`       | —              | 404 catch-all redirect               |

> `🔒 Protected` routes redirect unauthenticated users to `/login` via the `<ProtectedRoute>` wrapper component.  
> `*` Company and Admin routes rely on localStorage-backed session checks within their respective contexts.

---

## State Management & Context

The app uses **React Context API** for global state, with four isolated providers wrapping the app in `App.jsx`:

```
<AdminProvider>
  <AuthProvider>
    <CompanyProvider>
      <MatchProvider>
        <AppRoutes />
      </MatchProvider>
    </CompanyProvider>
  </AuthProvider>
</AdminProvider>
```

### `AuthContext` (`src/context/AuthContext.jsx`)

Manages **candidate** authentication state.

| Export           | Type       | Description                                  |
|------------------|------------|----------------------------------------------|
| `candidate`      | `object`   | Currently authenticated candidate profile    |
| `token`          | `string`   | JWT bearer token                             |
| `isAuthenticated`| `boolean`  | Derived from presence of `token`             |
| `loading`        | `boolean`  | True while restoring session from storage    |
| `login()`        | `function` | Saves token + candidate to state + storage   |
| `logout()`       | `function` | Clears all auth state and storage            |
| `updateCandidate()`| `function` | Merges profile updates into current state  |

Session persistence: token and profile are stored in `localStorage` under keys `pm_token` and `pm_candidate`.

### `CompanyContext` (`src/context/CompanyContext.jsx`)

Manages company authentication and internship data state for company-facing routes.

### `AdminContext` (`src/context/AdminContext.jsx`)

Manages admin session state used by the `AdminDashboard` and `AdminLogin` pages.

### `MatchContext` (`src/context/MatchContext.jsx`)

Holds the latest AI match result data surfaced on the candidate `Dashboard` via the `MatchResults` component.

---

## Pages

### Candidate Pages

#### `RegisterPage` (`components/auth/RegisterPage.jsx`)
Full multi-step registration form. Collects personal info, educational background, skills, quota category (SC/ST/OBC/EWS/General), and triggers Aadhaar verification. Largest component at ~31KB.

#### `LoginPage` (`components/auth/LoginPage.jsx`)
Email + password login form for candidates. On success, calls `login()` from `AuthContext` and redirects to `/dashboard`.

#### `LandingPage` (`components/candidate/LandingPage.jsx`)
Public hero page showcasing the PM Internship Scheme. Links to registration and internship browsing.

#### `Dashboard` (`components/dashboard/Dashboard.jsx`)
Protected candidate hub. Renders tabbed sub-sections:
- **Match Results** — AI-generated internship matches with scores
- **Allocation Status** — Track application and allocation lifecycle
- **Quota Dashboard** — Visualize quota eligibility and utilization
- **Bias Audit** — Fairness metrics on match algorithm outputs
- **Run Allocation** — Manually trigger or view allocation engine status

### Company Pages

#### `CompanyRegister` (`pages/CompanyRegister.jsx`)
Company sign-up form with fields for company name, sector, CIN, and contact details.

#### `CompanyLogin` (`pages/CompanyLogin.jsx`)
Company authentication page.

#### `CompanyDashboard` (`pages/CompanyDashboard.jsx`)
Company management panel for viewing posted internships, reviewing applicants, and taking allocation actions.

### Internship Pages

#### `InternshipListing` (`pages/InternshipListing.jsx`)
Filterable and searchable browse page for all available internships. Supports filtering by sector, location, and stipend range.

#### `InternshipDetail` (`pages/InternshipDetail.jsx`)
Detailed view for a single internship position including requirements, timeline, stipend, and an apply CTA.

### Admin Pages

#### `AdminLogin` (`pages/AdminLogin.jsx`)
Secure admin authentication form.

#### `AdminDashboard` (`pages/AdminDashboard.jsx`)
Comprehensive system-wide admin panel (~27KB). Features:
- Real-time system statistics using **Recharts** (area charts, bar charts, pie charts)
- Quota utilization monitoring across SC/ST/OBC/EWS/General categories
- Allocation management and override controls
- Candidate and company overview tables

---

## Components

### Shared / Reusable

| Component              | Description                                                   |
|------------------------|---------------------------------------------------------------|
| `Navbar.jsx`           | Responsive top nav with role-aware links and logout           |
| `AadhaarVerify.jsx`    | Aadhaar number input + OTP verification step widget           |
| `ExplainModal.jsx`     | Modal overlay explaining AI match score factors               |
| `PostInternshipModal.jsx` | Form modal for companies to post new internship listings   |
| `QuotaPills.jsx`       | Badge component displaying quota categories (SC/ST/OBC/etc.) |

### Dashboard Sub-Components

| Component              | Description                                                   |
|------------------------|---------------------------------------------------------------|
| `MatchResults.jsx`     | Renders ranked internship match cards with percentage scores   |
| `AllocationStatus.jsx` | Visual timeline/tracker for application allocation states      |
| `QuotaDashboard.jsx`   | Quota category breakdown with progress bars                   |
| `BiasAudit.jsx`        | Explainability panel showing fairness metrics of allocations   |
| `RunAllocation.jsx`    | Trigger panel for executing the allocation algorithm           |
| `EditProfileModal.jsx` | Slide-over modal with form for updating candidate profile data |

---

## API Utility

Located at `src/utils/api.jsx`, this module provides a centralized set of axios calls for the **candidate module**.

```js
import candidateAPI from '@/utils/api';

// Register
await candidateAPI.register(formData);

// Login
await candidateAPI.login(email, password);

// Get profile
await candidateAPI.getProfile(candidateId);

// Update profile
await candidateAPI.updateProfile(candidateId, updatedData);

// Upload resume (PDF)
await candidateAPI.uploadResume(candidateId, fileObject);
```

> All requests are relative to `/api/candidates` and leverage the Vite dev proxy. The `axios.defaults.baseURL` is set to `VITE_API_URL` in `AuthContext.jsx` for production builds.

---

## Styling & Design System

Styling is done entirely with **TailwindCSS v3**, extended with a government-grade design token set in `tailwind.config.js`.

### Color Palette

| Token            | Value      | Usage                               |
|------------------|------------|-------------------------------------|
| `gov-50` to `gov-900` | Blue shades | Primary UI palette (buttons, cards, borders) |
| `saffron`        | `#FF9933`  | Indian flag accent color            |
| `ashoka`         | `#000080`  | Navy accent for official elements   |

### Typography

- **Font Family:** `IBM Plex Sans` (loaded via Google Fonts preconnect in `index.html`)
- Applied via Tailwind's `fontFamily.sans` and `fontFamily.display` tokens

### Custom Animations

| Animation Class    | Description                                      |
|--------------------|--------------------------------------------------|
| `animate-fade-in`  | Opacity fade from 0 → 1 over 400ms               |
| `animate-slide-up` | Slide up + fade in from Y+16px over 400ms        |
| `animate-progress` | Width fill animation for progress bars           |

### Path Alias

The `@` alias maps to `src/` and is configured in both `vite.config.js` and available for imports:

```js
import Dashboard from '@/components/dashboard/Dashboard';
```

---

## Proxy Configuration

In development, Vite proxies all `/api` requests to the backend to avoid CORS issues:

```js
// vite.config.js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
    },
  },
},
```

This means any `axios.get('/api/candidates/...')` in the frontend is transparently forwarded to `http://localhost:5001/api/candidates/...` during development.

---

> *PM Internship Scheme — Smart Allocation Engine*  
> *Ministry of Corporate Affairs, Government of India*
