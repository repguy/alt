import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

// ─── Provider clients ──────────────────────────────────────────────────────────

function makeOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

function makeOpenRouterClient(customApiKey?: string) {
  return new OpenAI({
    apiKey: customApiKey || process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
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

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-3-flash-preview",
  openrouter: "meta-llama/llama-4-maverick",
};

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI GPT-4o Mini",
  gemini: "Google Gemini Flash",
  openrouter: "OpenRouter",
};

export interface AIOptions {
  provider?: AIProvider;
  customModel?: string;    // override model name (mainly for openrouter)
  customApiKey?: string;   // override API key (mainly for openrouter)
}

export function getActiveProvider(): AIProvider {
  const p = process.env.AI_PROVIDER as AIProvider | undefined;
  if (p && p in DEFAULT_MODELS) return p;
  return "openai";
}

export function getProviderLabel(provider: AIProvider): string {
  return PROVIDER_LABELS[provider];
}

export function listProviders(): { id: AIProvider; label: string; model: string }[] {
  return (Object.keys(DEFAULT_MODELS) as AIProvider[]).map(id => ({
    id,
    label: PROVIDER_LABELS[id],
    model: DEFAULT_MODELS[id],
  }));
}

// ─── Unified completion ────────────────────────────────────────────────────────

async function complete(
  options: AIOptions,
  system: string,
  user: string,
  maxTokens = 4096,
): Promise<string> {
  const provider = options.provider ?? getActiveProvider();

  if (provider === "gemini") {
    const gemini = makeGeminiClient();
    const model = options.customModel || DEFAULT_MODELS.gemini;
    const result = await gemini.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
      config: { maxOutputTokens: maxTokens },
    });
    return result.text ?? "";
  }

  if (provider === "openrouter") {
    const client = makeOpenRouterClient(options.customApiKey);
    const model = options.customModel || DEFAULT_MODELS.openrouter;
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  // openai
  const client = makeOpenAIClient();
  const response = await client.chat.completions.create({
    model: options.customModel || DEFAULT_MODELS.openai,
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

export interface AuditResult {
  overallScore: number;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  uxScore: number;
  conversionScore: number;
  mobileScore: number;
  aiSummary: string;
  aiRecommendations: string;
  issues: Array<{
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    recommendation: string;
    impact: string;
  }>;
}

export const AUDIT_STEPS = [
  { step: "crawl",         label: "Crawling website",           detail: "Fetching page structure and content" },
  { step: "seo",           label: "Analyzing SEO",              detail: "Meta tags, structured data, keywords" },
  { step: "performance",   label: "Measuring performance",      detail: "Load times, Core Web Vitals, rendering" },
  { step: "accessibility", label: "Running accessibility audit", detail: "WCAG compliance, contrast ratios, ARIA" },
  { step: "ux",            label: "Reviewing UX patterns",      detail: "Navigation, CTAs, user flows" },
  { step: "mobile",        label: "Testing mobile readiness",   detail: "Responsive design, touch targets" },
  { step: "generate",      label: "Generating AI report",       detail: "Compiling insights and recommendations" },
];

export async function runAuditWithAI(
  url: string,
  websiteName: string | null,
  aiOptions?: AIOptions,
  onStep?: (step: string) => void,
): Promise<AuditResult> {
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

Generate 6-10 realistic issues. Vary scores realistically — most sites score 40-75 overall.`;

  const raw = await complete(aiOptions ?? {}, systemPrompt, userPrompt, 4096);
  return JSON.parse(cleanJson(raw)) as AuditResult;
}

// ─── Lead generation ───────────────────────────────────────────────────────────

export async function generateLeadsWithAI(
  niche: string,
  location: string,
  count: number,
  aiOptions?: AIOptions,
): Promise<Array<{
  businessName: string;
  website: string;
  contactEmail: string;
  contactName: string;
  phone: string;
  auditScore: number;
}>> {
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

  const raw = await complete(
    aiOptions ?? {},
    "You generate realistic business lead data. Return ONLY valid JSON arrays.",
    prompt,
    2048,
  );
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
  aiOptions?: AIOptions,
): Promise<{ subject: string; body: string }> {
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

  const raw = await complete(
    aiOptions ?? {},
    "You write high-converting cold email copy. Return ONLY valid JSON.",
    prompt,
    1024,
  );
  return JSON.parse(cleanJson(raw));
}
