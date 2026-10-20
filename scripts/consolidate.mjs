import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function runConsolidation() {
  const cvDir = path.join(process.cwd(), 'cvs');
  const files = fs.readdirSync(cvDir);
  console.log(`Reading CV files from ${cvDir}...`);

  const extracted = [];
  for (const file of files) {
    if (file.startsWith('.')) continue;
    const filePath = path.join(cvDir, file);
    const ext = path.extname(file).toLowerCase();
    try {
      if (ext === '.pdf') {
        const buf = fs.readFileSync(filePath);
        const data = await pdfParse(buf);
        extracted.push({ filename: file, rawText: data.text.trim() });
        console.log(`✓ Read PDF: ${file} (${data.text.length} chars)`);
      } else if (ext === '.docx') {
        const res = await mammoth.extractRawText({ path: filePath });
        extracted.push({ filename: file, rawText: res.value.trim() });
        console.log(`✓ Read DOCX: ${file} (${res.value.length} chars)`);
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  }

  console.log(`\nConsolidating ${extracted.length} CVs using GPT-4o into Master Profile JSON...`);

  const combinedContent = extracted.map((cv, idx) => `
========================================
CV #${idx + 1}: ${cv.filename}
========================================
${cv.rawText}
`).join('\n\n');

  const systemPrompt = `You are an elite Career & Talent Systems Architect and Resume Master.
Your job is to analyze multiple versions/tailored variations of candidate Timothy Owolabi's CVs and consolidate them into ONE ultimate, comprehensive "Master Career Profile" JSON.

RULES:
1. TRUTHFUL & ACCURATE: Extract all facts, metrics, and experiences strictly from the provided CVs. Never fabricate dates, companies, or degrees.
2. DEDUPLICATE & ENRICH: When the same job/role appears across multiple CVs, combine all unique bullet points, accomplishments, and metrics into that single role. Avoid repetitive duplicate wording.
3. PRESERVE MAXIMUM DETAIL: Keep all quantified metrics (e.g. "reduced latency by 45%", "processed 10TB/day", "managed 5 engineers", etc.).
4. CATEGORIZE SKILLS: Group every mentioned technology into clean, modern skill categories (languages, frameworks, data_and_ai, cloud_and_devops, databases, practices).
5. SUMMARIES: Provide specialized summaries for the key domains evident in the CVs (general, data_engineering, ai_engineering, backend_platform).

OUTPUT JSON STRUCTURE:
{
  "contact": {
    "name": "Full Name",
    "titles": ["Title 1", "Title 2"],
    "email": "email",
    "phone": "phone",
    "location": "City, Country",
    "github": "url or handle",
    "linkedin": "url or handle",
    "portfolio": "url if any"
  },
  "summaries": {
    "general": "Executive summary...",
    "data_engineering": "Data platform focused summary...",
    "ai_engineering": "AI / ML engineering summary...",
    "backend_platform": "Backend & distributed systems summary..."
  },
  "skills": {
    "languages": ["Python", "Go", ...],
    "frameworks": ["FastAPI", ...],
    "data_and_ai": ["Kafka", "Spark", "PyTorch", ...],
    "cloud_and_devops": ["AWS", "Docker", "Kubernetes", ...],
    "databases": ["PostgreSQL", "Redis", ...],
    "practices": ["Distributed Systems", "CI/CD", ...]
  },
  "experiences": [
    {
      "id": "exp-1",
      "company": "Company Name",
      "role": "Role Title",
      "location": "Location",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "highlights": [
        "Quantified achievement 1...",
        "Quantified achievement 2..."
      ],
      "keywords": ["Python", "Kafka", "AWS"]
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "Project Name",
      "description": "Short description",
      "technologies": ["Tech1", "Tech2"],
      "bullets": ["Achievement 1"],
      "link": ""
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "degree": "Degree Name",
      "institution": "University / School",
      "location": "Location",
      "graduationYear": "Year",
      "details": ""
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "Certification Name",
      "issuer": "Issuer",
      "year": "Year"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please consolidate the candidate's CVs into the Master Career Profile JSON:\n\n${combinedContent}` }
    ]
  });

  const content = completion.choices[0].message.content;
  const masterProfile = JSON.parse(content);
  masterProfile.metadata = {
    lastUpdated: new Date().toISOString(),
    sourceFiles: extracted.map(e => e.filename)
  };

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'master_profile.json'), JSON.stringify(masterProfile, null, 2), 'utf-8');

  console.log(`\n🎉 Success! Master Profile saved to data/master_profile.json`);
  console.log(`Candidate Name: ${masterProfile.contact.name}`);
  console.log(`Titles: ${masterProfile.contact.titles.join(', ')}`);
  console.log(`Experiences Consolidated: ${masterProfile.experiences.length}`);
  console.log(`Skill Categories: Languages (${masterProfile.skills.languages.length}), Cloud (${masterProfile.skills.cloud_and_devops.length}), Data/AI (${masterProfile.skills.data_and_ai.length})`);
}

runConsolidation().catch(err => {
  console.error('Consolidation failed:', err);
  process.exit(1);
});
