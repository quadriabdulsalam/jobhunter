import OpenAI from 'openai';
import { MasterProfile, JobPosting, TailoredCV } from './types';

// Clean raw job titles into pristine, executive resume titles
// Strips employer names (e.g. "Trade Republic"), cities ("Berlin"), and job posting quirks ("(m/w/d)", "(Backend focused)")
export function cleanProfessionalTitle(rawTitle: string, company?: string): string {
  if (!rawTitle) return 'Senior Software Engineer';

  let title = rawTitle;

  // Remove company name if embedded
  if (company) {
    const compRegex = new RegExp(`\\b${escapeRegExp(company)}\\b`, 'gi');
    title = title.replace(compRegex, '');
  }

  // Remove common location and country terms
  const locations = [
    'berlin', 'düsseldorf', 'dusseldorf', 'munich', 'frankfurt', 'hamburg', 'cologne',
    'germany', 'london', 'uk', 'amsterdam', 'remote', 'hybrid', 'on-site', 'europe', 'eu', 'us'
  ];
  for (const loc of locations) {
    title = title.replace(new RegExp(`\\b${loc}\\b`, 'gi'), '');
  }

  // Remove job posting noise, brackets, gender markers
  title = title.replace(/\(m\s*[\/\\]\s*[fwd]\s*[\/\\]\s*[dxf]\)/gi, '');
  title = title.replace(/\(m\/w\/d\)/gi, '');
  title = title.replace(/\(m\/f\/d\)/gi, '');
  title = title.replace(/\(f\/m\/x\)/gi, '');
  title = title.replace(/\(all genders\)/gi, '');
  title = title.replace(/full[\s-]?time/gi, '');
  title = title.replace(/contract/gi, '');
  title = title.replace(/[-–—]\s*$/, '').trim();

  // Normalize specific qualifiers
  const lower = title.toLowerCase();
  if (lower.includes('data') && (lower.includes('platform') || lower.includes('engineer'))) {
    return 'Senior Data Platform Engineer';
  }
  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('llm')) {
    return 'Senior AI & Backend Platform Engineer';
  }
  if (lower.includes('backend') || lower.includes('back-end') || lower.includes('back end')) {
    return 'Senior Backend Engineer';
  }
  if (lower.includes('platform') || lower.includes('distributed')) {
    return 'Senior Platform & Distributed Systems Engineer';
  }
  if (lower.includes('software') || lower.includes('engineer')) {
    return 'Senior Software Engineer';
  }

  // Fallback clean
  return title.replace(/[-–—]\s*$/, '').replace(/\(\s*\)/g, '').trim() || 'Senior Software Engineer';
}

export async function tailorCVForJob(
  profile: MasterProfile,
  job: Partial<JobPosting> & { description: string; title: string; company: string }
): Promise<TailoredCV> {
  // Try LLM tailoring first if API key is provided
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return await tailorWithLLM(openai, profile, job);
    } catch (llmErr: unknown) {
      const errorMsg = llmErr instanceof Error ? llmErr.message : String(llmErr);
      console.warn(`[CV Tailorer] LLM tailoring fallback (${errorMsg}) -> using deterministic transferable ATS engine.`);
    }
  }

  // Fallback / Deterministic ATS Engine with Transferable Tools & Clean Titles
  return tailorDeterministically(profile, job);
}

async function tailorWithLLM(
  openai: OpenAI,
  profile: MasterProfile,
  job: Partial<JobPosting> & { description: string; title: string; company: string }
): Promise<TailoredCV> {
  const sanitizedTitle = cleanProfessionalTitle(job.title, job.company);

  const systemPrompt = `You are an executive career strategist and elite ATS optimization specialist.
Your goal is to tailor the candidate's Master Career Profile to match a specific Job Description with laser precision, creating an ATS-optimized, high-converting CV.

CORE PRINCIPLES & GUIDELINES:
1. CLEAN PROFESSIONAL TITLE: The "targetRole" MUST be a clean, standard executive title (e.g. "Senior Backend Engineer", "Senior Software Engineer", "Senior Data Platform Engineer"). NEVER include employer names (e.g. "Trade Republic", "Tesla"), cities/locations (e.g. "Berlin"), or job posting tags (e.g. "(m/w/d)", "Backend focused").
2. TRANSFERRABLE SKILLS & TOOL ADAPTATION: The candidate is a senior engineer with 9+ years across Java/Kotlin, Python, Go, distributed systems, and modern data platforms. Tools and frameworks in the same family are highly transferable. For example, if the job description asks for:
   - jOOQ: Include jOOQ alongside Java, SQL, Hibernate, and JPA!
   - Airflow or dbt: Include alongside Kafka, ETL, and data pipelines!
   - Snowflake or ClickHouse: Include alongside PostgreSQL, MongoDB, and data warehousing!
   - GraphQL or gRPC: Include alongside RESTful APIs and distributed microservices!
   - Terraform or Helm: Include alongside Docker and Kubernetes!
   ACTIVELY incorporate these requested tools into the highlighted skills and relevant experience bullets to demonstrate direct tool familiarity.
3. BULLET POINT EMPHASIS: Weave the requested tools into real projects/roles where that domain applies (e.g., type-safe SQL queries with jOOQ in Java/PostgreSQL services, or Kafka streaming pipelines).
4. ATS READABILITY: Write punchy, quantified bullet points with action verbs.

OUTPUT JSON SCHEMA:
{
  "targetRole": "${sanitizedTitle}",
  "matchScore": 92,
  "rationale": "Brief rationale for alignment...",
  "matchedKeywords": ["Java", "jOOQ", "Spring Boot", "Kafka", "PostgreSQL"],
  "missingKeywords": [],
  "professionalSummary": "A tailored 3-4 sentence professional summary aligning the candidate's background with the target role...",
  "highlightedSkills": [
    {
      "category": "Languages & Core",
      "skills": ["Java 17", "Kotlin", "Python", "SQL", "Go"]
    },
    {
      "category": "Backend, ORM & Distributed Systems",
      "skills": ["Spring Boot", "jOOQ", "Hibernate / JPA", "Apache Kafka", "PostgreSQL"]
    },
    {
      "category": "Cloud & Infrastructure",
      "skills": ["Docker", "Kubernetes", "AWS", "CI/CD"]
    }
  ],
  "tailoredExperiences": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "location": "Location",
      "period": "Start - End",
      "bullets": [
        "High-impact bullet point with metrics..."
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": ["Tech1", "Tech2"],
      "bullets": ["Achievement 1"]
    }
  ]
}`;

  const userPrompt = `
TARGET JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}

JOB DESCRIPTION:
${job.description}

CANDIDATE MASTER PROFILE:
${JSON.stringify(profile, null, 2)}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.25,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const result = JSON.parse(content);
  const cvId = `cv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: cvId,
    jobId: job.id || `job-${Date.now()}`,
    jobTitle: job.title,
    company: job.company,
    targetRole: cleanProfessionalTitle(result.targetRole || sanitizedTitle, job.company),
    tailoredAt: new Date().toISOString(),
    contact: profile.contact,
    professionalSummary: result.professionalSummary,
    highlightedSkills: result.highlightedSkills || [],
    tailoredExperiences: result.tailoredExperiences || [],
    projects: result.projects || profile.projects || [],
    education: profile.education || [],
    certifications: profile.certifications || [],
    matchScore: result.matchScore || 90,
    rationale: result.rationale || ''
  };
}

// Deterministic ATS Keyword & Alignment Tailoring Engine with Transferable Tools
function tailorDeterministically(
  profile: MasterProfile,
  job: Partial<JobPosting> & { description: string; title: string; company: string }
): TailoredCV {
  const jdLower = (job.description + ' ' + job.title).toLowerCase();
  const cleanTitle = cleanProfessionalTitle(job.title, job.company);

  // 1. Recognize demanded tools and frameworks from the JD (including transferable tools)
  const transferrableToolCatalog: { [key: string]: { name: string; category: string; relatedBulletKeywords: string[] } } = {
    'jooq': { name: 'jOOQ', category: 'Backend & Data Access', relatedBulletKeywords: ['sql', 'postgres', 'query', 'orm', 'database'] },
    'jpa': { name: 'JPA / Hibernate', category: 'Backend & Data Access', relatedBulletKeywords: ['database', 'spring', 'service'] },
    'hibernate': { name: 'Hibernate', category: 'Backend & Data Access', relatedBulletKeywords: ['database', 'sql'] },
    'graphql': { name: 'GraphQL', category: 'APIs & Services', relatedBulletKeywords: ['api', 'service', 'checkout'] },
    'grpc': { name: 'gRPC & Protocol Buffers', category: 'APIs & Services', relatedBulletKeywords: ['grpc', 'microservice'] },
    'airflow': { name: 'Apache Airflow', category: 'Data & Pipeline Orchestration', relatedBulletKeywords: ['pipeline', 'batch', 'sync', 'etl'] },
    'dbt': { name: 'dbt', category: 'Data & Pipeline Orchestration', relatedBulletKeywords: ['data', 'pipeline', 'sql'] },
    'snowflake': { name: 'Snowflake', category: 'Data Platforms', relatedBulletKeywords: ['analytics', 'reporting', 'query'] },
    'clickhouse': { name: 'ClickHouse', category: 'Data Platforms', relatedBulletKeywords: ['analytics', 'query', 'reporting'] },
    'flink': { name: 'Apache Flink', category: 'Streaming Systems', relatedBulletKeywords: ['streaming', 'event', 'kafka'] },
    'spark': { name: 'Apache Spark', category: 'Data Platforms', relatedBulletKeywords: ['data', 'batch', 'stream'] },
    'kafka': { name: 'Apache Kafka', category: 'Event Streaming', relatedBulletKeywords: ['kafka', 'event', 'streaming'] },
    'rabbitmq': { name: 'RabbitMQ', category: 'Event Streaming', relatedBulletKeywords: ['event', 'message', 'queue'] },
    'terraform': { name: 'Terraform', category: 'Cloud & Infrastructure', relatedBulletKeywords: ['kubernetes', 'cloud', 'deployment'] },
    'helm': { name: 'Helm', category: 'Cloud & Infrastructure', relatedBulletKeywords: ['kubernetes', 'pod', 'deployment'] },
    'datadog': { name: 'Datadog', category: 'Observability & Monitoring', relatedBulletKeywords: ['logging', 'monitoring', 'service'] },
    'prometheus': { name: 'Prometheus & Grafana', category: 'Observability & Monitoring', relatedBulletKeywords: ['monitoring', 'service', 'metric'] },
    'opentelemetry': { name: 'OpenTelemetry', category: 'Observability & Monitoring', relatedBulletKeywords: ['logging', 'monitoring', 'metrics'] },
    'elasticsearch': { name: 'Elasticsearch / OpenSearch', category: 'Search & Data', relatedBulletKeywords: ['search', 'query', 'coveo'] },
    'redis': { name: 'Redis', category: 'Caching & Data', relatedBulletKeywords: ['caching', 'redis', 'latency'] },
    'graalvm': { name: 'GraalVM Native Image', category: 'Runtimes & Performance', relatedBulletKeywords: ['graalvm', 'startup', 'memory'] },
    'spring boot': { name: 'Spring Boot', category: 'Backend Frameworks', relatedBulletKeywords: ['spring', 'microservice'] },
    'fastapi': { name: 'FastAPI', category: 'Backend Frameworks', relatedBulletKeywords: ['fastapi', 'python', 'api'] },
    'kotlin': { name: 'Kotlin', category: 'Languages', relatedBulletKeywords: ['kotlin', 'java', 'service'] },
    'golang': { name: 'Go / Golang', category: 'Languages', relatedBulletKeywords: ['golang', 'grpc', 'backend'] },
    'python': { name: 'Python', category: 'Languages', relatedBulletKeywords: ['python', 'fastapi', 'pipeline'] },
    'java': { name: 'Java (8/11/17)', category: 'Languages', relatedBulletKeywords: ['java', 'spring', 'banking'] }
  };

  const detectedJDTools: string[] = [];
  const toolsToAddMap = new Map<string, { name: string; category: string; relatedBulletKeywords: string[] }>();

  for (const [key, tool] of Object.entries(transferrableToolCatalog)) {
    const regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'i');
    if (regex.test(jdLower)) {
      detectedJDTools.push(tool.name);
      toolsToAddMap.set(key, tool);
    }
  }

  // 2. Candidate core skills from Master Profile
  const allCandidateSkills = [
    ...profile.skills.languages,
    ...profile.skills.frameworks,
    ...profile.skills.data_and_ai,
    ...profile.skills.cloud_and_devops,
    ...profile.skills.databases,
    ...profile.skills.practices
  ];

  const matchedKeywords: string[] = [];
  const candidateSkillsLower = new Map<string, string>();
  for (const s of allCandidateSkills) {
    candidateSkillsLower.set(s.toLowerCase(), s);
  }

  candidateSkillsLower.forEach((original, lower) => {
    const regex = new RegExp(`\\b${escapeRegExp(lower)}\\b`, 'i');
    if (regex.test(jdLower)) {
      matchedKeywords.push(original);
    }
  });

  // Also count any detected tools as matched competencies
  detectedJDTools.forEach(t => {
    if (!matchedKeywords.includes(t)) {
      matchedKeywords.push(t);
    }
  });

  // Calculate high match score (transferable skills empower candidate)
  const baseScore = 84;
  const matchBonus = Math.min(14, matchedKeywords.length * 2);
  const matchScore = Math.min(96, baseScore + matchBonus);

  // 3. Select optimal professional summary
  let professionalSummary = profile.summaries.general || '';
  if (jdLower.includes('data engineer') || jdLower.includes('pipeline') || jdLower.includes('etl') || jdLower.includes('streaming')) {
    professionalSummary = profile.summaries.data_engineering || professionalSummary;
  } else if (jdLower.includes('ai') || jdLower.includes('llm') || jdLower.includes('machine learning')) {
    professionalSummary = profile.summaries.ai_engineering || professionalSummary;
  } else if (jdLower.includes('backend') || jdLower.includes('platform') || jdLower.includes('distributed') || jdLower.includes('java')) {
    professionalSummary = profile.summaries.backend_platform || professionalSummary;
  }

  // 4. Highlighted Skills: actively blend candidate skills + job's demanded tools
  const languagesList = [...profile.skills.languages];
  const backendAndDataList = [...profile.skills.data_and_ai, ...profile.skills.databases, ...profile.skills.frameworks];
  const cloudAndPracticesList = [...profile.skills.cloud_and_devops, ...profile.skills.practices];

  // Inject demanded tools into skill lists if not already present
  toolsToAddMap.forEach((tool) => {
    if (tool.category === 'Languages') {
      if (!languagesList.some(s => s.toLowerCase() === tool.name.toLowerCase())) {
        languagesList.unshift(tool.name);
      }
    } else if (tool.category.includes('Cloud') || tool.category.includes('Observability')) {
      if (!cloudAndPracticesList.some(s => s.toLowerCase() === tool.name.toLowerCase())) {
        cloudAndPracticesList.unshift(tool.name);
      }
    } else {
      if (!backendAndDataList.some(s => s.toLowerCase() === tool.name.toLowerCase())) {
        backendAndDataList.unshift(tool.name);
      }
    }
  });

  const prioritize = (list: string[]) => {
    return [...list].sort((a, b) => {
      const aIn = matchedKeywords.some(kw => kw.toLowerCase() === a.toLowerCase()) ? 1 : 0;
      const bIn = matchedKeywords.some(kw => kw.toLowerCase() === b.toLowerCase()) ? 1 : 0;
      return bIn - aIn;
    });
  };

  const highlightedSkills = [
    {
      category: 'Languages & Core',
      skills: prioritize(languagesList).slice(0, 6)
    },
    {
      category: 'Backend, Data & Distributed Systems',
      skills: prioritize(backendAndDataList).slice(0, 8)
    },
    {
      category: 'Cloud, DevOps & System Architecture',
      skills: prioritize(cloudAndPracticesList).slice(0, 7)
    }
  ];

  // 5. Tailored Experiences: re-rank and dynamically weave transferable tools into bullet points
  const hasJooq = toolsToAddMap.has('jooq');
  const hasKafka = toolsToAddMap.has('kafka');

  const tailoredExperiences = profile.experiences.map((exp, expIdx) => {
    const scoredBullets = exp.highlights.map(bullet => {
      let score = 0;
      matchedKeywords.forEach(kw => {
        if (bullet.toLowerCase().includes(kw.toLowerCase())) score += 2;
      });

      let enrichedBullet = bullet;

      // Adapt bullet point for jOOQ / modern ORM if demanded by JD
      if (hasJooq && expIdx === 0 && (bullet.toLowerCase().includes('database') || bullet.toLowerCase().includes('query') || bullet.toLowerCase().includes('api'))) {
        enrichedBullet = bullet.replace(/using streamed CSV processing/i, 'utilizing jOOQ and streamed processing')
                               .replace(/improving data consistency/i, 'optimizing complex SQL execution with jOOQ and JPA');
      }

      return { bullet: enrichedBullet, score };
    });

    scoredBullets.sort((a, b) => b.score - a.score);

    return {
      company: exp.company,
      role: exp.role,
      location: exp.location,
      period: `${exp.startDate} – ${exp.endDate}`,
      bullets: scoredBullets.map(sb => sb.bullet).slice(0, 4)
    };
  });

  const cvId = `cv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: cvId,
    jobId: job.id || `job-${Date.now()}`,
    jobTitle: job.title,
    company: job.company,
    targetRole: cleanTitle,
    tailoredAt: new Date().toISOString(),
    contact: profile.contact,
    professionalSummary,
    highlightedSkills,
    tailoredExperiences,
    projects: profile.projects?.map(p => ({
      name: p.name,
      technologies: p.technologies,
      bullets: p.bullets
    })),
    education: profile.education,
    certifications: profile.certifications,
    matchScore,
    rationale: `Targeted for ${cleanTitle} at ${job.company}. Incorporated key demanded competencies (${detectedJDTools.slice(0, 6).join(', ')}) with transferrable mastery from your 9+ years in distributed architectures and data platforms.`
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
