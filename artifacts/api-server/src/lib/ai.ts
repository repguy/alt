import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

export async function runAuditWithAI(url: string, websiteName: string | null): Promise<AuditResult> {
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
  "aiSummary": "<2-3 paragraph executive summary of the website's strengths and weaknesses>",
  "aiRecommendations": "<markdown formatted list of 5 specific, actionable recommendations numbered 1-5>",
  "issues": [
    {
      "category": "<seo|performance|accessibility|ux|conversion|mobile>",
      "severity": "<low|medium|high|critical>",
      "title": "<short title>",
      "description": "<specific description of the issue>",
      "recommendation": "<specific fix>",
      "impact": "<business impact>"
    }
  ]
}

Generate 6-10 realistic issues. Base scores on real common issues for this type of site. 
Vary scores realistically — most sites score 40-75 range overall.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  const result = JSON.parse(cleaned);
  return result as AuditResult;
}

export async function generateLeadsWithAI(
  niche: string,
  location: string,
  count: number
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

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "[]";
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

export async function generateEmailCopyWithAI(params: {
  businessName: string;
  contactName: string | null;
  niche: string | null;
  location: string | null;
  auditScore: number | null;
  tone: string;
}): Promise<{ subject: string; body: string }> {
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
Do NOT use generic phrases like "I hope this finds you well". 
Keep it under 200 words. Sound human, not salesy.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}
