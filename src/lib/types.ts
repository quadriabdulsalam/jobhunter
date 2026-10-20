export interface ContactInfo {
  name: string;
  titles: string[];
  email: string;
  phone: string;
  location: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface SkillCategories {
  languages: string[];
  frameworks: string[];
  data_and_ai: string[];
  cloud_and_devops: string[];
  databases: string[];
  practices: string[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string; // "Present" or e.g. "2023"
  highlights: string[];
  keywords: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  link?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationYear: string;
  details?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year?: string;
}

export interface MasterProfile {
  contact: ContactInfo;
  summaries: {
    general?: string;
    data_engineering?: string;
    ai_engineering?: string;
    backend_platform?: string;
    [key: string]: string | undefined;
  };
  skills: SkillCategories;
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  metadata: {
    lastUpdated: string;
    sourceFiles: string[];
  };
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  workplaceType?: 'Remote' | 'Hybrid' | 'On-site' | 'Unknown';
  url: string;
  source: 'linkedin' | 'external' | 'manual';
  applyType: 'easy_apply' | 'external' | 'unknown';
  externalApplyUrl?: string;
  description: string;
  extractedAt: string;
  status: 'extracted' | 'tailored' | 'applied' | 'interviewing' | 'archived';
  matchScore?: number;
  matchAnalysis?: {
    matchedKeywords: string[];
    missingKeywords: string[];
    summaryFit: string;
  };
  tailoredCvId?: string;
}

export interface TailoredCV {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  targetRole: string;
  tailoredAt: string;
  contact: ContactInfo;
  professionalSummary: string;
  highlightedSkills: {
    category: string;
    skills: string[];
  }[];
  tailoredExperiences: {
    company: string;
    role: string;
    location: string;
    period: string;
    bullets: string[];
  }[];
  projects?: {
    name: string;
    technologies: string[];
    bullets: string[];
  }[];
  education: EducationItem[];
  certifications: CertificationItem[];
  matchScore: number;
  rationale: string;
}
