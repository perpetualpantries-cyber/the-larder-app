import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../../lib/db";
import { TASK_PROJECT_LABEL } from "../../../lib/constants";

const BRIEF_ID = "latest";
// Regenerate if the cached brief is older than this many hours.
const MAX_AGE_HOURS = 12;

const SYSTEM_PROMPT = `You are Keeper, writing Josh's morning brief for The Larder — his personal knowledge base covering himself, Perpetual Pantries (his café operations SaaS company), and his other projects.

Write a short, warm, plain-text brief (no markdown headers, a few short paragraphs or a short list is fine) covering:
- What's outstanding — the most important open tasks, grouped by project if it helps.
- Anything added or changed recently that's worth noticing.
- Keep it concise — this is a 30-second read over coffee, not a report.

Never invent tasks or facts that aren't in the data provided. If there's nothing notable, say so plainly and briefly.`;

async function gatherContext() {
  const sql = db();
  const [openTasks, recentFacts, artifactCount] = await Promise.all([
    sql`SELECT text, project FROM tasks WHERE done = false ORDER BY order_key DESC LIMIT 40`,
    sql`SELECT category, subcategory, text, created_at as "createdAt" FROM facts WHERE created_at > now() - interval '4 days' ORDER BY created_at DESC LIMIT 20`,
    sql`SELECT count(*)::int as n FROM artifacts`,
  ]);
  return { openTasks, recentFacts, artifactCount: artifactCount[0]?.n || 0 };
}

function formatContext({ openTasks, recentFacts, artifactCount }) {
  const taskLines = openTasks.length
    ? openTasks.map((t) => `- [${TASK_PROJECT_LABEL[t.project] || t.project}] ${t.text}`).join("\n")
    : "(none)";
  const factLines = recentFacts.length
    ? recentFacts.map((f) => `- [${f.category}${f.subcategory ? " / " + f.subcategory : ""}] ${f.text}`).join("\n")
    : "(nothing added in the last 4 days)";
  return `Open tasks (${openTasks.length} total):\n${taskLines}\n\nRecently added or changed (last 4 days):\n${factLines}\n\nArtifact catalog: ${artifactCount} items tracked.`;
}

async function generateBrief() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const context = await gatherContext();
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: formatContext(context) }],
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const sql = db();
  await sql`
    INSERT INTO briefs (id, generated_at, text) VALUES (${BRIEF_ID}, now(), ${text})
    ON CONFLICT (id) DO UPDATE SET generated_at = now(), text = ${text}
  `;
  return { text, generatedAt: new Date().toISOString() };
}

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`SELECT text, generated_at as "generatedAt" FROM briefs WHERE id = ${BRIEF_ID}`;
    const existing = rows[0];
    if (existing) {
      const ageHours = (Date.now() - new Date(existing.generatedAt).getTime()) / 3600000;
      if (ageHours < MAX_AGE_HOURS) {
        return NextResponse.json(existing);
      }
    }
    const fresh = await generateBrief();
    return NextResponse.json(fresh);
  } catch (err) {
    return NextResponse.json({ error: String(err && err.message ? err.message : err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const fresh = await generateBrief();
    return NextResponse.json(fresh);
  } catch (err) {
    return NextResponse.json({ error: String(err && err.message ? err.message : err) }, { status: 500 });
  }
}
