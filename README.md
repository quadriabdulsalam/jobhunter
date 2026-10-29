# 🚀 JobHunter AI — LinkedIn Job Copilot & ATS CV Tailoring Platform

A platform designed to discover jobs on LinkedIn, consolidate multiple career CVs into a single Master Profile, dynamically tailor ATS-friendly resumes for specific roles, and assist with job applications (both LinkedIn Easy Apply and external portals).

---

## 🏗️ Architecture & Workflow

1. **Master Profile Consolidation**:
   - Users import their own CVs (PDFs, DOCX, TXT) from the profile screen.
   - Synthesizes and de-duplicates contact info, skills, experiences, and achievements, then stores the profile in that user's account.

2. **LinkedIn Job Discovery (Chrome Extension or Userscript)**:
   - The Manifest V3 Chrome Extension or optional Tampermonkey userscript injects a floating **Jobhunter Copilot** widget on LinkedIn job listings.
   - 1-Click extracts Job Title, Company, Location, Description, and Apply Type (Easy Apply vs External).
   - Communicates with the selected Jobhunter app (deployed by default, or local development) to compute ATS match scores and tailor the CV for the signed-in user.

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

### Configure accounts and per-user storage with Supabase

Each account has its own profile, saved jobs, and tailored resumes. Supabase Auth manages sessions; PostgreSQL row-level security restricts each account to its own rows. Local development can use JSON files when Supabase is not configured.

1. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from the Supabase project in `.env.local` and the Vercel Production environment. Do not use a secret/service-role key in the app.
2. For an existing single-user database, run [`supabase/migrations/20261028_multi_user_auth.sql`](supabase/migrations/20261028_multi_user_auth.sql) once. It preserves old records in restricted archive tables and creates empty per-user tables. For a new database, run [`supabase/schema.sql`](supabase/schema.sql).
3. In Supabase Authentication URL Configuration, set the Site URL to your deployed app and allow `https://your-domain/auth/callback` plus `http://localhost:3000/auth/callback`.
4. Enable email/password sign-in in Supabase Auth. To enable Google or GitHub, add OAuth credentials for each provider in Supabase Auth Providers and register Supabase's callback URL with that provider.
5. Redeploy the Vercel project after environment changes.

### 1. Launch the Web Studio
The web application runs locally at:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Install the Chrome Extension
1. Download the [Jobhunter Chrome extension ZIP](https://jobhunter-azure.vercel.app/downloads/jobhunter-chrome-extension.zip) and extract it.
2. In Chrome, open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked**.
3. Select the extracted `extension/` folder.
4. Open the extension popup and sign in with your Jobhunter email and password, or choose **Continue with Google or GitHub** to connect your browser session. It connects to the deployed app by default; choose **Local development** only when running the app on your computer.
5. Open any LinkedIn job posting ([linkedin.com/jobs](https://www.linkedin.com/jobs)). The **Jobhunter** widget will appear in the bottom-right corner.

### 3. Install the Tampermonkey userscript (alternative)

The userscript is a lighter alternative to the Chrome extension. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser, then [open the Jobhunter userscript](https://raw.githubusercontent.com/quadriabdulsalam/jobhunter/main/userscript/jobhunter.user.js) and confirm **Install** in Tampermonkey. It runs on LinkedIn job pages and the deployed Jobhunter app.

1. Sign in to [Jobhunter](https://jobhunter-azure.vercel.app/) in the same browser profile. The userscript securely reads the signed-in Supabase session through Jobhunter's same-origin session endpoint and shares it with the LinkedIn tab through Tampermonkey storage.
2. Open a LinkedIn job listing. The Jobhunter panel appears in the lower-right corner. If the panel says it is disconnected, click **Connect Jobhunter account**, sign in on the opened Jobhunter tab, then return to LinkedIn.
3. Click **Tailor my CV for this job** only when you want to send that job and your profile to Jobhunter for tailoring. Review the result in Jobhunter.
4. **Assist with application form** fills supported blank contact fields when you click it. Check the values and complete the application yourself; the userscript never submits it.

By default, the userscript connects to the production Jobhunter app. To use another self-hosted domain, update the `@match` and `@connect` entries in the userscript header for that domain, then change **Settings → Jobhunter app URL** in the panel. For local development, add `http://localhost:3000/*` to `@match` and `localhost` to `@connect` (already included).

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
├── userscript/
│   └── jobhunter.user.js         # Tampermonkey alternative for LinkedIn
├── src/
│   ├── app/                      # Next.js App Router (Studio UI & API endpoints)
│   │   ├── page.tsx              # Main interactive dashboard
│   │   ├── globals.css           # Design tokens, responsive UI, print CSS
│   │   └── api/                  # REST endpoints (/api/profile, /api/jobs, /api/tailor)
│   └── lib/                      # Core business logic
│       ├── types.ts              # TypeScript schemas
│       ├── storage.ts            # Supabase persistence with local development fallback
│       ├── cv-parser.ts          # PDF/DOCX text extractor
│       ├── profile-merger.ts     # Multi-CV consolidation
│       └── cv-tailorer.ts        # Dual-engine ATS tailoring (LLM + Rule-based)
```

## UI design system

The shared visual and interaction rules are documented in [`design-system/jobhunter/MASTER.md`](design-system/jobhunter/MASTER.md) and implemented in `src/app/globals.css`. Follow those rules when adding or changing screens.
