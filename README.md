# 🚀 JobHunter AI — LinkedIn Job Copilot & ATS CV Tailoring Platform

A platform designed to discover jobs on LinkedIn, consolidate multiple career CVs into a single Master Profile, dynamically tailor ATS-friendly resumes for specific roles, and assist with job applications (both LinkedIn Easy Apply and external portals).

---

## 🏗️ Architecture & Workflow

1. **Master Profile Consolidation**:
   - Ingests multiple past CVs (PDFs, DOCX, TXT) from the `cvs/` directory.
   - Synthesizes and de-duplicates contact info, skills, experiences, and achievements, then stores the profile in Supabase when configured.

2. **LinkedIn Job Discovery (Option A — Chrome Extension)**:
   - A Manifest V3 Chrome Extension injects a floating **JobHunter Copilot** widget on `linkedin.com/jobs/*`.
   - 1-Click extracts Job Title, Company, Location, Description, and Apply Type (Easy Apply vs External).
   - Immediately communicates with the local studio (`http://localhost:3000/api/jobs`) to compute real-time ATS keyword match scores and tailor the CV.

3. **ATS-Optimized CV Studio**:
   - Compares the target Job Description against the Master Profile.
   - Highlights matched competencies and flags missing keywords.
   - Renders a clean, single-column ATS resume sheet ready for instant printing/PDF export or plain text copy.

4. **Application Auto-Fill Assist**:
   - Detects input fields in LinkedIn Easy Apply modals or external portals (Name, Email, Phone, Location, Portfolio, LinkedIn).
   - Auto-fills them with human-in-the-loop review before final submission.

---

## 🛠️ Getting Started

### Configure an AI provider (optional)

The app supports Groq and OpenAI for AI-assisted CV tailoring and CV consolidation. Copy `.env.example` to `.env.local`, set `AI_PROVIDER` to `groq` or `openai`, fill in the matching API key, and restart the development server. Groq defaults to `openai/gpt-oss-20b`; OpenAI defaults to `gpt-4o`.

For Groq, create a key in the Groq Console and set `AI_PROVIDER=groq` and `GROQ_API_KEY` in `.env.local`. The Groq API key is sent from the server to Groq; it is never exposed to the browser.

Keep `.env.local` private and never commit your API key. Without a configured key, CV tailoring uses the built-in rule-based engine and CV imports use basic local extraction.

### Configure persistent storage with Supabase

The deployed app uses Supabase for the master profile, saved jobs, and tailored resumes. Local development continues to use the JSON files in `data/` unless Supabase credentials are configured.

1. Create a Supabase project and copy its project URL and **Secret key** from the Supabase dashboard. Keep the secret key on the server; do not prefix it with `NEXT_PUBLIC_`.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) to create the app tables with row-level security enabled.
3. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` to `.env.local` for local use, and add the same variables to the Vercel project’s Production environment.
4. Set `APP_ACCESS_PASSWORD` to a long, unique password and `APP_SESSION_SECRET` to a random value with at least 32 characters in Vercel. These protect the private profile and job API with a single-user sign-in.
5. Redeploy the Vercel project after saving its environment variables.

The production app is locked until its Supabase and private-access environment values are configured. It intentionally does not fall back to Vercel’s read-only filesystem. The app has one shared profile and job workspace behind a single-user password gate.

### 1. Launch the Web Studio
The web application runs locally at:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Install the Chrome Extension
1. Open Google Chrome and go to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` directory:
   ```
   /Users/timothyowolabi/Documents/jobhunter/extension
   ```
5. Navigate to any LinkedIn Job posting ([linkedin.com/jobs](https://www.linkedin.com/jobs)).
6. The **JobHunter AI Copilot** widget will appear in the bottom-right corner!

---

## 📁 Repository Structure
```
jobhunter/
├── cvs/                          # Your source CVs (PDF, DOCX)
├── data/                         # Local development fallback storage
├── extension/                    # Manifest V3 Chrome Extension
│   ├── manifest.json
│   ├── content.js                # LinkedIn DOM extractor & auto-fill assistant
│   ├── content.css               # Floating glassmorphic copilot UI
│   ├── popup.html & popup.js     # Toolbar popup
│   └── icons/                    # Extension icons
├── src/
│   ├── app/                      # Next.js App Router (Studio UI & API endpoints)
│   │   ├── page.tsx              # Main interactive dashboard
│   │   ├── globals.css           # Design tokens, glassmorphism, print CSS
│   │   └── api/                  # REST endpoints (/api/profile, /api/jobs, /api/tailor)
│   └── lib/                      # Core business logic
│       ├── types.ts              # TypeScript schemas
│       ├── storage.ts            # Supabase persistence with local development fallback
│       ├── cv-parser.ts          # PDF/DOCX text extractor
│       ├── profile-merger.ts     # Multi-CV consolidation
│       └── cv-tailorer.ts        # Dual-engine ATS tailoring (LLM + Rule-based)
```
