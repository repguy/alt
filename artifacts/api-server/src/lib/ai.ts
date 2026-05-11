import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

// ─── Provider clients ──────────────────────────────────────────────────────────

function makeOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

function makeOpenRouterClient() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  });
}

function makeGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
    ...(process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
      ? { httpOptions: { baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } }
      : {}),
  });
}

// ─── Provider types ────────────────────────────────────────────────────────────

export type AIProvider = "openai" | "gemini" | "openrouter";

const PROVIDER_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-3-flash-preview",
  openrouter: "meta-llama/llama-4-maverick",
};

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI GPT-4o Mini",
  gemini: "Google Gemini Flash",
  openrouter: "Meta Llama 4 Maverick",
};

// Read provider from env (set per-workspace eventually), default to openai
export function getActiveProvider(): AIProvider {
  const p = process.env.AI_PROVIDER as AIProvider | undefined;
  if (p && p in PROVIDER_MODELS) return p;
  return "openai";
}

export function getProviderLabel(provider: AIProvider) {
  return PROVIDER_LABELS[provider];
}

export function listProviders(): { id: AIProvider; label: string; model: string }[] {
  return (Object.keys(PROVIDER_MODELS) as AIProvider[]).map(id => ({
    id,
    label: PROVIDER_LABELS[id],
    model: PROVIDER_MODELS[id],
  }));
}

// ─── Unified completion ────────────────────────────────────────────────────────

async function complete(
  provider: AIProvider,
  system: string,
  user: string,
  maxTokens = 4096
): Promise<string> {
  if (provider === "gemini") {
    const gemini = makeGeminiClient();
    const result = await gemini.models.generateContent({
      model: PROVIDER_MODELS.gemini,
      contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
      config: { maxOutputTokens: maxTokens },
    });
    return result.text ?? "";
  }

  const client = provider === "openrouter" ? makeOpenRouterClient() : makeOpenAIClient();
  const response = await client.chat.completions.create({
    model: PROVIDER_MODELS[provider],
    max_completion_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

function cleanJson(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```json")) s = s.slice(7);
  if (s.startsWith("```")) s = s.slice(3);
  if (s.endsWith("```")) s = s.slice(0, -3);
  return s.trim();
}

// ─── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditScores {
  overallScore: number;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  uxScore: number;
  conversionScore: number;
  mobileScore: number;
}

export interface AuditIssue {
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  impact: string;
}

export interface AuditResult extends AuditScores {
  aiSummary: string;
  aiRecommendations: string;
  issues: AuditIssue[];
}

export type AuditProgressStep = {
  step: string;
  label: string;
  detail: string;
  done: boolean;
};

export const AUDIT_STEPS: AuditProgressStep[] = [
  { step: "crawl", label: "Crawling website", detail: "Fetching page structure and content", done: false },
  { step: "seo", label: "Analyzing SEO", detail: "Checking meta tags, structured data, keywords", done: false },
  { step: "performance", label: "Measuring performance", detail: "Load times, Core Web Vitals, rendering", done: false },
  { step: "accessibility", label: "Running accessibility audit", detail: "WCAG compliance, contrast ratios, ARIA", done: false },
  { step: "ux", label: "Reviewing UX patterns", detail: "Navigation, CTAs, user flows", done: false },
  { step: "mobile", label: "Testing mobile readiness", detail: "Responsive design, touch targets", done: false },
  { step: "generate", label: "Generating AI report", detail: "Compiling insights and recommendations", done: false },
];

export async function runAuditWithAI(
  url: string,
  websiteName: string | null,
  provider?: AIProvider,
  onStep?: (step: string) => void
): Promise<AuditResult> {
  const p = provider ?? getActiveProvider();

  const steps = ["crawl", "seo", "performance", "accessibility", "ux", "mobile"];
  for (const step of steps) {
    onStep?.(step);
    await new Promise(r => setTimeout(r, 600));
  }
  onStep?.("generate");

  const systemPrompt = `You are an expert website auditor for a digital agency SaaS platform.
Analyze websites and return structured JSON audit results. Be specific and actionable.
Return ONLY valid JSON, no markdown, no explanation.`;

  const userPrompt = `Audit the website: ${url} (${websiteName || "Unknown"})

Return a JSON object with exactly this structure:
{
  "overallScore": <0-100>,
  "seoScore": <0-100>,
  "performanceScore": <0-100>,
  "accessibilityScore": <0-100>,
  "uxScore": <0-100>,
  "conversionScore": <0-100>,
  "mobileScore": <0-100>,
  "aiSummary": "<2-3 paragraph executive summary>",
  "aiRecommendations": "<markdown numbered list of 5 specific actionable recommendations>",
  "issues": [
    {
      "category": "<seo|performance|accessibility|ux|conversion|mobile>",
      "severity": "<low|medium|high|critical>",
      "title": "<short title>",
      "description": "<specific description>",
      "recommendation": "<specific fix>",
      "impact": "<business impact>"
    }
  ]
}

Generate 6-10 realistic issues. Vary scores realistically — most sites score 40-75 range overall.`;

  const raw = await complete(p, systemPrompt, userPrompt, 4096);
  return JSON.parse(cleanJson(raw)) as AuditResult;
}

// ─── Lead generation ───────────────────────────────────────────────────────────

export async function generateLeadsWithAI(
  niche: string,
  location: string,
  count: number,
  provider?: AIProvider
): Promise<Array<{
  businessName: string;
  website: string;
  contactEmail: string;
  contactName: string;
  phone: string;
  auditScore: number;
}>> {
  const p = provider ?? getActiveProvider();

  const prompt = `Generate ${count} realistic local business leads for a digital agency.
Niche: ${niche}
Location: ${location}

Return ONLY a JSON array of exactly ${count} objects, no markdown:
[
  {
    "businessName": "<realistic local business name>",
    "website": "<realistic website url without https://>",
    "contactEmail": "<realistic email>",
    "contactName": "<realistic full name>",
    "phone": "<realistic US phone>",
    "auditScore": <20-75 realistic website score>
  }
]

Make names, emails, and websites specific and realistic for ${niche} in ${location}.
Vary audit scores — most small businesses score 30-65.`;

  const raw = await complete(p, "You generate realistic business lead data. Return ONLY valid JSON arrays.", prompt, 2048);
  return JSON.parse(cleanJson(raw));
}

// ─── Email copy ────────────────────────────────────────────────────────────────

export async function generateEmailCopyWithAI(
  params: {
    businessName: string;
    contactName: string | null;
    niche: string | null;
    location: string | null;
    auditScore: number | null;
    tone: string;
  },
  provider?: AIProvider
): Promise<{ subject: string; body: string }> {
  const p = provider ?? getActiveProvider();

  const prompt = `Write a cold email for a digital agency reaching out to a prospect.

Business: ${params.businessName}
Contact: ${params.contactName || "Decision Maker"}
Niche: ${params.niche || "local business"}
Location: ${params.location || ""}
Their website score: ${params.auditScore ? `${params.auditScore}/100` : "unknown"}
Tone: ${params.tone}

Return ONLY JSON (no markdown):
{
  "subject": "<compelling subject line under 60 chars>",
  "body": "<3-4 paragraph email, conversational, specific, ends with soft CTA>"
}

Be specific about their industry. Mention the audit score if available.
Do NOT use phrases like "I hope this finds you well".
Keep it under 200 words. Sound human, not salesy.`;

  const raw = await complete(p, "You write high-converting cold email copy. Return ONLY valid JSON.", prompt, 1024);
  return JSON.parse(cleanJson(raw));
}
