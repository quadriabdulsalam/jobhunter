import fs from 'fs';
import path from 'path';

const masterProfile = {
  contact: {
    name: "Timothy Owolabi S.",
    titles: [
      "Senior Backend Engineer",
      "Senior Software Engineer",
      "Senior Data Platform Engineer",
      "AI & Platform Engineer"
    ],
    email: "owolabi.sunday08@gmail.com",
    phone: "+49 1624079145",
    location: "Düsseldorf, Germany",
    github: "https://github.com/timmyowl",
    linkedin: "https://linkedin.com/in/timothyowolabi",
    portfolio: "https://github.com/sunkylab"
  },
  summaries: {
    general: "Senior Software & Platform Engineer with 9+ years of experience designing and scaling high-throughput distributed systems, banking platforms, data pipelines, and AI-driven automation services across financial services, e-commerce, and enterprise environments. Strong mastery across Python, Java/Kotlin, Go, Apache Kafka, PostgreSQL, MongoDB, Docker, and Kubernetes. Holds a Master's degree in Data Science Management.",
    backend_platform: "Specialized Backend and Platform Engineer with 9 years architecting resilient, fault-tolerant microservices, gRPC interfaces, event-driven architectures (CQRS/Kafka), and cloud-native backends in regulated financial and e-commerce ecosystems (BanqueMisr, Spreadgroup, 3Line Card Management).",
    data_engineering: "Senior Data & Platform Engineer with deep expertise building streaming ETL/ELT pipelines, real-time data processing engines with Apache Kafka, data warehouse integrations, CQRS architectures, and batch synchronization pipelines serving tens of millions of events across multi-locale platforms.",
    ai_engineering: "AI & Platform Engineer combining robust backend architecture with modern AI/LLM engineering. Experienced in building structured prompting classification engines, local LLM inference services (Ollama/FastAPI), taxonomy classification pipelines, and implicit feedback recommendation systems."
  },
  skills: {
    languages: [
      "Python",
      "Java (7/8/11/17)",
      "Kotlin",
      "Golang",
      "SQL",
      "TypeScript",
      "JavaScript",
      "Bash"
    ],
    frameworks: [
      "FastAPI",
      "Spring Boot",
      "Spring Cloud",
      "Django",
      "Next.js",
      "Express.js",
      "Hibernate / JPA",
      "Flask"
    ],
    data_and_ai: [
      "Apache Kafka",
      "ETL / ELT Pipelines",
      "Streaming Data Architecture",
      "LLM Prompt Engineering",
      "Local LLM Inference (Ollama)",
      "Taxonomy & Classification Pipelines",
      "Recommendation Systems (LightFM, ALS-implicit)",
      "CQRS & Event Sourcing",
      "Apache Mahout",
      "Data Modeling"
    ],
    cloud_and_devops: [
      "Docker",
      "Kubernetes",
      "AWS (EC2, S3, RDS, ECS, Lambda)",
      "GCP",
      "CI/CD (GitHub Actions, GitLab CI)",
      "Terraform",
      "GraalVM Native Image",
      "Linux / Unix"
    ],
    databases: [
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "MySQL",
      "Memcached",
      "ClickHouse"
    ],
    practices: [
      "Distributed Systems",
      "Microservices Architecture",
      "gRPC & Protocol Buffers",
      "RESTful API Design",
      "Event-Driven Architecture",
      "High-Throughput Systems",
      "Security & Data Redaction (GDPR, PCI-DSS)",
      "Agile / Scrum Leadership",
      "Unit & Integration Testing (Mockito, WireMock, PyTest)"
    ]
  },
  experiences: [
    {
      id: "exp-spreadgroup",
      company: "Spreadgroup",
      role: "Senior Software Engineer",
      location: "Germany",
      startDate: "Jun 2025",
      endDate: "Present",
      highlights: [
        "Extended Commercetools' checkout API with advanced payment flows integrating PayPal, Google Pay, and Apple Pay express methods, reducing checkout drop-off by an estimated 25% across global storefronts.",
        "Designed custom API extensions hooking into Commercetools webhooks to enforce business validation logic and trigger downstream event processing in real time.",
        "Re-architected product-to-Coveo batch sync pipeline using streamed CSV processing and tracking tables across ~18 locales, cutting sync failures by an estimated 65% and boosting catalog data consistency.",
        "Led replacement of legacy Apache Mahout recommendation engine, evaluating ALS-implicit and LightFM approaches with decoupled offline training and online serving to improve model load time by ~22%."
      ],
      keywords: ["Python", "FastAPI", "Commercetools", "Apache Mahout", "Recommendation Systems", "Docker", "Event-Driven"]
    },
    {
      id: "exp-banquemisr",
      company: "BanqueMisr — Retail Banking (via Andela Network)",
      role: "Senior Software Engineer",
      location: "Düsseldorf, Germany / Remote",
      startDate: "Dec 2022",
      endDate: "May 2025",
      highlights: [
        "Migrated core retail banking microservices to GraalVM native image using Spring buildpacks, substantially reducing service memory footprint and improving cold-start latency.",
        "Refactored core enterprise logging libraries with custom SLF4J sanitization to automatically redact PII and sensitive financial data across banking services, satisfying strict banking regulatory compliance.",
        "Re-architected the analytical and reporting service utilizing CQRS patterns and denormalized MongoDB collections, accelerating query performance for high-volume transactions.",
        "Elevated test coverage across core banking microservices by implementing comprehensive unit and integration test suites using Mockito, WireMock, and Castle Mock."
      ],
      keywords: ["Java 17", "Spring Boot", "GraalVM", "CQRS", "MongoDB", "Kafka", "Banking Security", "WireMock"]
    },
    {
      id: "exp-nomba",
      company: "Nomba (formerly Kudi)",
      role: "Senior Backend Engineer",
      location: "Remote",
      startDate: "Sep 2022",
      endDate: "Nov 2023",
      highlights: [
        "Engineered core gRPC services and shared platform libraries (IAM, Storehouse) powering agency banking operations handling millions in daily transactional volume.",
        "Streamlined API latency and cross-service communication overhead by transitioning internal REST endpoints to high-performance gRPC with Protocol Buffers.",
        "Collaborated with cross-functional product and infrastructure teams to maintain 99.9% uptime during peak holiday banking transaction surges."
      ],
      keywords: ["Golang", "gRPC", "Protobuf", "Distributed Systems", "PostgreSQL", "Redis", "Docker"]
    },
    {
      id: "exp-ai-automation",
      company: "Independent AI & Systems Initiatives",
      role: "AI & Platform Engineer",
      location: "Düsseldorf, Germany",
      startDate: "Jan 2023",
      endDate: "Present",
      highlights: [
        "Designed and built an AI-driven taxonomy classification system using structured JSON prompting with LLMs to automatically categorize keywords into a 3-tier (C1/C2/C3) hierarchy, completely eliminating manual workflows.",
        "Architected an on-premise, self-hosted keyword categorization and search service utilizing FastAPI, local LLMs via Ollama, PostgreSQL, and Docker with complete lifecycle ownership.",
        "Engineered multilingual inference pipelines for German-language category label simplification using few-shot prompt engineering for reproducible, human-validated outputs."
      ],
      keywords: ["Python", "FastAPI", "Ollama", "LLMs", "Prompt Engineering", "PostgreSQL", "Docker", "NLP"]
    },
    {
      id: "exp-3line",
      company: "3Line Card Management Limited",
      role: "Software Engineer",
      location: "Lagos, Nigeria",
      startDate: "Apr 2019",
      endDate: "Aug 2020",
      highlights: [
        "Restructured core and shared transactional services for the Freedom Network agency banking platform, driving customer engagement and transaction volume up to 10x within 3 months.",
        "Architected Card-Not-Present (CNP) and POS settlement integrations complying with card scheme requirements and strict fraud-detection parameters.",
        "Optimized relational database queries and indices in PostgreSQL, eliminating transaction bottlenecks during peak financial settlement hours."
      ],
      keywords: ["Java", "Spring Boot", "Fintech", "Payment Gateways", "PostgreSQL", "Microservices"]
    }
  ],
  projects: [
    {
      id: "proj-ai-taxonomy",
      name: "Autonomous Taxonomy Classification & LLM Inference Engine",
      description: "Self-hosted high-throughput API categorizing e-commerce keywords and search queries using localized LLMs.",
      technologies: ["Python", "FastAPI", "Ollama", "PostgreSQL", "Docker"],
      bullets: [
        "Engineered 3-tier semantic hierarchy categorization with JSON schema validation.",
        "Runs on-premise with zero external API latency or egress data concerns."
      ],
      link: "https://github.com/timmyowl"
    },
    {
      id: "proj-streaming-pipeline",
      name: "High-Throughput Event Streaming & CQRS Reporting Platform",
      description: "Distributed reporting engine handling asynchronous financial event ingestion and denormalized query acceleration.",
      technologies: ["Apache Kafka", "Java", "Spring Boot", "MongoDB", "Docker"],
      bullets: [
        "Decoupled read and write data paths using CQRS pattern to achieve sub-50ms query responses on historical transactions."
      ],
      link: "https://github.com/sunkylab"
    }
  ],
  education: [
    {
      id: "edu-rbs",
      degree: "Master's in Data Science Management",
      institution: "Rome Business School",
      location: "Rome, Italy",
      graduationYear: "2024",
      details: "Specialization in Distributed Data Infrastructure, Scalable Data Engineering, Machine Learning Systems, and Big Data Governance."
    },
    {
      id: "edu-hnd",
      degree: "Higher National Diploma (HND) in Computer Engineering",
      institution: "Yaba College of Technology",
      location: "Lagos, Nigeria",
      graduationYear: "2016",
      details: "Specialized coursework in Microprocessors, Computer Systems Architecture, Embedded Systems, and Software Engineering."
    }
  ],
  certifications: [
    {
      id: "cert-aws",
      name: "AWS Certified Solutions Architect / Cloud Practitioner",
      issuer: "Amazon Web Services",
      year: "2023"
    },
    {
      id: "cert-data",
      name: "Specialized Distributed Systems & Data Platform Architecture",
      issuer: "Professional Certificate",
      year: "2024"
    }
  ],
  metadata: {
    lastUpdated: new Date().toISOString(),
    sourceFiles: [
      "Tesla Senior Data Engineer Cv Tailored.pdf",
      "Tim's Resume (7).pdf",
      "Timothy_Owolabi_CV.pdf",
      "Timothy_Owolabi_CV_AI_Engineer.docx",
      "Timothy_Owolabi_Engineer_CV.pdf"
    ]
  }
};

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, 'master_profile.json'),
  JSON.stringify(masterProfile, null, 2),
  'utf-8'
);

console.log('✅ Successfully compiled Master Profile from all 5 CVs into data/master_profile.json');
