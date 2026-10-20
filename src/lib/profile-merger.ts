import OpenAI from 'openai';
import { ExtractedCVText } from './cv-parser';
import { MasterProfile } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function mergeCVsIntoMasterProfile(cvs: ExtractedCVText[]): Promise<MasterProfile> {
  if (cvs.length === 0) {
    throw new Error('No CV texts provided for consolidation.');
  }

  const combinedContent = cvs.map((cv, idx) => `
========================================
CV #${idx + 1} (Source: ${cv.filename})
========================================
${cv.rawText}
`).join('\n\n');

  const systemPrompt = `You are an elite Career & Talent Systems Architect and Resume Master.
Your job is to analyze multiple versions/tailored variations of a single candidate's CVs and consolidate them into ONE ultimate, comprehensive "Master Career Profile" JSON.

RULES:
1. TRUTHFUL & ACCURATE: Extract all facts, metrics, and experiences strictly from the provided CVs. Never fabricate dates or companies.
2. DEDUPLICATE & ENRICH: When the same job/role appears across multiple CVs, combine all unique bullet points, accomplishments, and metrics into that single role. Avoid repetitive duplicate wording.
3. PRESERVE MAXIMUM DETAIL: Keep all quantified metrics (e.g. "reduced latency by 45%", "processed 10TB/day", "managed 5 engineers", etc.).
4. CATEGORIZE SKILLS: Group every mentioned technology into clean, modern skill categories (languages, frameworks, data_and_ai, cloud_and_devops, databases, practices).
5. SUMMARIES: Provide specialized summaries for the key domains evident in the CVs (e.g., general, data_engineering, ai_engineering, backend_platform).

OUTPUT JSON STRUCTURE:
You must respond with valid JSON matching this exact structure:
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
      "startDate": "Start Date (e.g. Jan 2021)",
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
      "bullets": ["Achievement 1", "Achievement 2"],
      "link": "url or empty"
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "degree": "Degree Name",
      "institution": "University / School",
      "location": "Location",
      "graduationYear": "Year",
      "details": "optional honors or coursework"
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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please consolidate and synthesize the candidate's CVs below into the Master Career Profile JSON:\n\n${combinedContent}` }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI during consolidation.');
  }

  const parsed = JSON.parse(content);
  parsed.metadata = {
    lastUpdated: new Date().toISOString(),
    sourceFiles: cvs.map(c => c.filename)
  };

  return parsed as MasterProfile;
}
