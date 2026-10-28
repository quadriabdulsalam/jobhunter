import { ExtractedCVText } from './cv-parser';
import { MasterProfile } from './types';
import { createAIClient, AI_MODEL } from './openai-config';

export async function mergeCVsIntoMasterProfile(cvs: ExtractedCVText[]): Promise<MasterProfile> {
  if (cvs.length === 0) {
    throw new Error('No CV texts provided for consolidation.');
  }

  const ai = createAIClient();
  if (!ai) {
    return mergeCVsDeterministically(cvs);
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

  try {
    const response = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please consolidate and synthesize the candidate's CVs below into the Master Career Profile JSON:\n\n${combinedContent}` }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content returned from AI provider during consolidation.');

    const parsed = JSON.parse(content);
    parsed.metadata = {
      lastUpdated: new Date().toISOString(),
      sourceFiles: cvs.map(c => c.filename)
    };

    return parsed as MasterProfile;
  } catch (error) {
    console.warn('[Profile Merger] AI import failed; falling back to local extraction.', error);
    return mergeCVsDeterministically(cvs);
  }
}

function mergeCVsDeterministically(cvs: ExtractedCVText[]): MasterProfile {
  const rawText = cvs.map(cv => cv.rawText).join('\n\n');
  const lines = rawText.split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const sectionHeading = /^(professional\s+)?(summary|profile|objective|about\s+me|skills|technical\s+skills|experience|work\s+experience|employment|education|certifications?|projects?)\s*:?$/i;
  const summaryHeading = /^(professional\s+)?(summary|profile|objective|about\s+me)\s*:?$/i;
  const name = lines.find(line => line.length <= 70 && !sectionHeading.test(line) && !/^(resume|curriculum vitae|cv|profile)$/i.test(line) && !/@|https?:\/\/|www\./i.test(line) && !/^\+?[\d\s().-]{7,}$/.test(line)) || '';
  const afterName = name ? lines.slice(lines.indexOf(name) + 1) : lines;
  const titleCandidate = afterName.find(line => line.length <= 90 && !sectionHeading.test(line) && !/@|https?:\/\/|www\./i.test(line) && !/^\+?[\d\s().-]{7,}$/.test(line));

  const email = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = rawText.match(/(?:\+?\d[\d\s()./-]{7,}\d)/)?.[0]?.trim() || '';
  const linkedin = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[\w\-/%.?=&]+/i)?.[0] || '';
  const github = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0] || '';
  const portfolio = lines.find(line => /https?:\/\//i.test(line) && !/linkedin\.com|github\.com/i.test(line))?.match(/https?:\/\/\S+/i)?.[0] || '';

  let summary = '';
  const summaryStart = lines.findIndex(line => summaryHeading.test(line));
  if (summaryStart >= 0) {
    const contentStart = summaryStart + 1;
    const end = lines.findIndex((line, index) => index >= contentStart && sectionHeading.test(line));
    summary = lines.slice(contentStart, end < 0 ? contentStart + 8 : end).join(' ').trim();
  }
  if (!summary) {
    const intro = afterName.filter(line => !sectionHeading.test(line) && !/@|https?:\/\/|www\./i.test(line) && !/^\+?[\d\s().-]{7,}$/.test(line));
    summary = intro.slice(0, 3).join(' ').slice(0, 1200);
  }

  const catalog: Array<[keyof MasterProfile['skills'], string[]]> = [
    ['languages', ['python', 'java', 'javascript', 'typescript', 'golang', 'kotlin', 'c++', 'c#', 'ruby', 'php', 'swift', 'rust', 'sql']],
    ['frameworks', ['react', 'next.js', 'angular', 'vue.js', 'node.js', 'express.js', 'nestjs', 'django', 'flask', 'fastapi', 'spring boot', '.net', 'laravel']],
    ['data_and_ai', ['machine learning', 'artificial intelligence', 'llm', 'natural language processing', 'kafka', 'spark', 'airflow', 'tableau', 'power bi', 'salesforce', 'hubspot', 'figma', 'adobe photoshop']],
    ['cloud_and_devops', ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'linux', 'ci/cd']],
    ['databases', ['postgresql', 'mysql', 'mongodb', 'redis', 'cassandra', 'sqlite', 'oracle', 'sql server']],
    ['practices', ['agile', 'scrum', 'project management', 'stakeholder management', 'customer service', 'leadership', 'communication', 'data analysis', 'financial analysis', 'marketing', 'sales', 'recruitment', 'teaching', 'nursing', 'research', 'product design']]
  ];
  const skills: MasterProfile['skills'] = {
    languages: [], frameworks: [], data_and_ai: [], cloud_and_devops: [], databases: [], practices: []
  };
  const normalizedText = rawText.toLowerCase();
  for (const [category, terms] of catalog) {
    skills[category] = terms.filter(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalizedText);
    });
  }

  return {
    contact: {
      name,
      titles: titleCandidate ? [titleCandidate] : [],
      email,
      phone,
      location: '',
      github,
      linkedin,
      portfolio
    },
    summaries: { general: summary },
    skills,
    // Experience details require review; do not guess job titles, employers, or dates from unstructured text.
    experiences: [],
    projects: [],
    education: [],
    certifications: [],
    metadata: { lastUpdated: new Date().toISOString(), sourceFiles: cvs.map(cv => cv.filename) }
  };
}
