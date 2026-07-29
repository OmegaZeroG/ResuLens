# ResuLens

AI Resume Analyzer & JD-Based ATS Optimizer, with a custom rate-limited AI gateway.

Full plan: see `../ResuLens-Project-Plan.docx` and `../TASKS.md` / `../PROGRESS.md` in the parent folder.

## Stack

React (Vite) + Tailwind · Node/Express · MongoDB Atlas · Redis (Upstash) · Gemini API · ImageKit · JWT

## Structure

```
ResuLens/
├── client/     React (Vite) frontend
└── server/     Express API
```

## Local setup

### Server
```
cd server
cp .env.example .env   # fill in your own MongoDB URI, JWT secret, API keys
npm install
npm run dev
```

### Client
```
cd client
npm install
npm run dev
```

Client runs on http://localhost:5173, API on http://localhost:5000.
