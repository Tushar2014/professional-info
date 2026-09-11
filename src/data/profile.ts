import { ProfileSchema, type Profile } from './profile.schema'

const data: Profile = {
  name: 'Tushar Chauhan',
  role: 'Backend Engineer',
  location: 'Gurugram, India',
  bio: 'I build the layers underneath LLM products: streaming edges, orchestration, retrieval, and the state they all fight over. Six years on backend systems.',
  email: 'tusharchauhan1410@gmail.com',
  socials: [{ label: 'LinkedIn', href: 'https://linkedin.com/in/tusharchauhan1410' }],
  experience: [
    {
      company: 'PayPay India',
      title: 'Backend Engineer',
      team: 'Context Engineering, AI & Data',
      start: '2026-05',
      end: null,
      summary:
        'Backend and platform work on a conversational AI product: the streaming edge, the orchestration tier, and the agent pipeline behind them.',
      highlights: [
        'Designed and shipped source attribution for generated answers, carried end to end across the request path from the streaming edge through orchestration to the agent.',
        'Built an end-user support assistant as primary author: staged request pipeline and durable conversation state.',
        'Owned the production release path for that service, including canary rollouts.',
      ],
    },
    {
      company: 'Soroco',
      title: 'Senior Software Engineer',
      start: '2024-01',
      end: '2026-04',
      summary:
        'Backend services and data pipelines for a process-intelligence product, plus shared libraries used across teams.',
      highlights: [
        'Designed a Linux-based data processing server that moved computation off client machines, improving client-side performance and reliability.',
        'Added caching layers to backend microservices, cutting API latency by 60% and raising throughput by 35%.',
        'Built asynchronous, event-driven workflows for fault-tolerant orchestration.',
        'Wrote shared service-initialisation libraries adopted by more than ten teams, removing most duplicated setup code.',
        'Tuned SQL indexing and partitioning, reducing polling time in a high-load sync service from 30s to 5s.',
      ],
    },
    {
      company: 'Soroco',
      title: 'Software Engineer',
      start: '2020-10',
      end: '2023-12',
      summary: 'Data extraction and annotation pipelines, and refactoring of legacy backend services.',
      highlights: [
        'Built heuristic auto-annotation pipelines that cut manual annotation time by 30%.',
        'Raised document extraction accuracy to 96% through more resilient enrichment logic.',
        'Refactored legacy services for modularity, reducing library size by 30%.',
        'Raised unit test coverage from 80% to 95% with structured suites and coverage thresholds.',
      ],
    },
  ],
  skills: [
    { group: 'Languages', items: ['Python', 'Kotlin', 'Java', 'Scala', 'SQL'] },
    { group: 'Backend', items: ['FastAPI', 'Spring Boot', 'Django', 'Celery', 'REST API design'] },
    { group: 'Data', items: ['PostgreSQL', 'pgvector', 'DynamoDB', 'Redis', 'Kafka', 'Elasticsearch'] },
    { group: 'Platform', items: ['Kubernetes', 'ArgoCD', 'Terraform', 'Docker', 'Airflow'] },
    { group: 'Observability', items: ['OpenTelemetry', 'Prometheus', 'Grafana'] },
    { group: 'AI systems', items: ['RAG pipelines', 'LLM orchestration', 'prompt iteration', 'evaluation harnesses'] },
  ],
  education: [
    {
      degree: 'B.Tech, Computer Science and Engineering',
      institution: 'AKTU, Lucknow',
      start: '2016-07',
      end: '2020-05',
    },
  ],
}

export const profile = ProfileSchema.parse(data)
export type { Profile }
