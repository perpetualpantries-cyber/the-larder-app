import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { TASK_PROJECT_LABEL } from "../../../lib/constants";

// Unauthenticated-cookie read-only feed for external tools (e.g. a scheduled
// Claude morning brief) that can't hold the site's login cookie. Protected
// instead by a static shared-secret query token.
export async function GET(req) {
  const expected = process.env.BRIEF_FEED_KEY;
  if (!expected) {
    return NextResponse.json({ error: "BRIEF_FEED_KEY is not set" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sql = db();
  const [openTasks, recentFacts, counts] = await Promise.all([
    sql`SELECT text, project FROM tasks WHERE done = false ORDER BY order_key DESC LIMIT 40`,
    sql`SELECT category, subcategory, text, created_at as "createdAt" FROM facts WHERE created_at > now() - interval '4 days' ORDER BY created_at DESC LIMIT 20`,
    sql`SELECT
          (SELECT count(*)::int FROM tasks WHERE done = false) as "openTaskCount",
          (SELECT count(*)::int FROM facts) as "factCount",
          (SELECT count(*)::int FROM artifacts) as "artifactCount"
        `,
  ]);

  return NextResponse.json({
    summary: `${counts[0].openTaskCount} open tasks, ${counts[0].factCount} things kept, ${counts[0].artifactCount} artifacts tracked.`,
    openTasks: openTasks.map((t) => ({ text: t.text, project: TASK_PROJECT_LABEL[t.project] || t.project })),
    recentlyAdded: recentFacts.map((f) => ({
      category: f.category,
      subcategory: f.subcategory,
      text: f.text,
      createdAt: f.createdAt,
    })),
  });
}
