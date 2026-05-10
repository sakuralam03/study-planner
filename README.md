# SUTD Study Planner

A full-stack web application that helps SUTD students plan their academic terms, validate course prerequisites, track pillar/minor requirements, and export their plans.

---

## Table of Contents
- [External Parts](#external)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Architecture Notes](#architecture-notes)

---
## External 
-**Excel Sheet** https://docs.google.com/spreadsheets/d/1eTv6mdqeubvtrqeVE5hxUTjyoQDkACYD8RC4EajF2wo/edit?usp=sharing
-**Gmail Account** studyplannersutd@gmail.com
For Passwords, env file, private info unless asked 

## Features
- **Term Planner** — Drag courses into term slots across up to 20 terms
- **Prerequisite Validation** — Checks both pre-requisites and co-requisites against your term ordering
- **Track & Minor Fulfillment** — Automatically detects which tracks and minors your plan satisfies
- **Credit Tracking** — Monitors HASS, elective, and core credit progress
- **Excel Export** — Downloads your plan and validation results as a formatted `.xlsx` file
- **User Accounts** — Register, log in, save/load plans, and reset passwords via email
- **Auto-fill Freshmore Courses** — Grid 1 and Grid 2 Freshmore courses are pre-placed on load
- **Debounced Auto-validation** — Plan is re-validated 600 ms after each change, minimising API calls

---

## Project Structure

```
root/
├── backend/
│   ├── index.js          # Express app, all API routes
│   ├── db.js             # MongoDB connection helper
│   ├── sheets.js         # Google Sheets read helper
│   ├── mailer.js         # Nodemailer email helper
│   ├── testprereqs.js    # Prerequisite test script
│   ├── .env              # Environment variables (not committed)
│   ├── service_account.json  # Google service account key (not committed)
│   ├── vercel.json       # Vercel serverless config
│   └── package.json
└── frontend/
    └── vite-project/
        ├── src/
        │   ├── components/
        │   │   ├── LoginPage.jsx
        │   │   ├── Plans.jsx
        │   │   ├── TermsModal.jsx
        │   │   ├── CourseDropdown.jsx
        │   │   ├── ValidationAlerts.jsx
        │   │   ├── ResultsDownload.jsx
        │   │   └── ResetPasswordPage.jsx
        │   ├── services/
        │   │   └── api.js        # All fetch calls to the backend
        │   ├── App.jsx           # Root component and state management
        │   ├── PlannerUI.css
        │   └── assets/
        │       └── sutd_logo.jpg
        ├── index.html
        └── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Course data | Google Sheets API (via service account) |
| Auth | JWT (`jsonwebtoken`), `bcrypt` |
| Email | Nodemailer |
| Excel export | ExcelJS |
| Deployment | Vercel (both frontend and backend) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A Google Cloud service account with Sheets API access
- A Gmail account (or SMTP provider) for password-reset emails

### Environment Variables

Create a `.env` file inside `backend/`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PORT=3000
```

Create a `.env.local` file inside `frontend/vite-project/`:

```env
VITE_API_URL=http://localhost:3000
```

Place your Google service account JSON file at `backend/service_account.json`. The account must have read access to the target Google Sheet.

### Backend Setup

```bash
cd backend
npm install
node index.js
```

The server starts at `http://localhost:3000`. On startup it warms the Google Sheets cache for all five ranges in parallel.

### Frontend Setup

```bash
cd frontend/vite-project
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

---

## API Reference

All endpoints are served from the Express backend.

| Method | Path | Description |
|---|---|---|
| `GET` | `/ping` | Health check |
| `GET` | `/courses` | All courses (optional `?term=N` filter) |
| `GET` | `/prerequisites` | Raw prerequisites data |
| `GET` | `/tracks` | Track definitions |
| `GET` | `/minors` | Minor definitions |
| `GET` | `/term-template` | Default term structure |
| `POST` | `/validate-selection` | Validate a plan; returns unmet prereqs, fulfilled tracks/minors, credit status |
| `POST` | `/download-excel` | Generate and stream an `.xlsx` file |
| `POST` | `/save-plan` | Save a plan to MongoDB |
| `GET` | `/load-plan/:studentId` | Load saved plans for a student |
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and receive a JWT |
| `POST` | `/request-password-reset` | Send a password-reset email |
| `POST` | `/reset-password` | Set a new password using a reset token |

### `/validate-selection` Request Body

```json
{
  "selection": {
    "1": { "header": "Term 1", "courses": [{ "code": "10.001", "passed": true }] },
    "2": { "header": "Term 2", "courses": [{ "code": "10.002", "passed": true }] }
  }
}
```

### `/validate-selection` Response

```json
{
  "unmet": ["10.002 requires 10.001 before enrollment"],
  "validSelected": ["10.001"],
  "fulfilledTracks": ["AI Track"],
  "fulfilledMinors": ["Humanities Minor"],
  "creditStatus": {
    "hassMet": false, "hassCredits": 12,
    "electiveMet": false, "electiveCredits": 24,
    "coreMet": true, "coreCredits": 60,
    "allElectiveCreditsMet": false, "allElectiveCredits": 48
  }
}
```

---

## Deployment

Both the backend and frontend are deployed to **Vercel**.

**Backend (`backend/vercel.json`)** — The Express app is exported as a serverless function. On the first cold-start invocation the cache is warmed automatically:

```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "index.js" }]
}
```

**Frontend** — A standard Vite/React project. Set `VITE_API_URL` to your deployed backend URL in the Vercel environment variables dashboard.

**CORS** — The backend allows requests from `http://localhost:5173` and the production frontend URL. Update the `origin` array in `index.js` if your frontend URL changes.

---

## Architecture Notes

**Google Sheets as a data source** — Course, prerequisite, track, and minor data live in a single Google Sheet. The backend reads it via a service account and caches each range for 5 minutes (`CACHE_TTL_MS`). All sheet fetches inside `/validate-selection` run in parallel with `Promise.all`.

**In-memory cache on Vercel** — Vercel serverless functions share memory within the same function instance but not across instances. The cache trades a small amount of potential staleness (up to 5 min) for significantly faster response times after the first request.

**JWT auth flow** — Login returns a short-lived JWT (1 hour). The token is stored in `localStorage` and sent as an `Authorization` header. The user object (studentId, pillar) is also persisted to `localStorage` so the session survives page refreshes.

**Debounced validation** — `App.jsx` runs `/validate-selection` 600 ms after any change to `selection`. The timer is cleared and restarted on each change, so rapid edits produce only one network call.

**Freshmore auto-placement** — On load, courses with `type === "FRESHMORE"` are automatically placed into Term 1 (Grid 1) or Term 2 (Grid 2) and marked as passed, reflecting the fixed Freshmore curriculum.