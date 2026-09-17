import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import crypto from "crypto";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT id, text, project, done, order_key as "order", created_at as "createdAt", completed_at as "completedAt" FROM tasks ORDER BY order_key DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const body = await req.json();
  const { text } = body;
  const project = body.project || "general";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  const id = `task-${crypto.randomBytes(4).toString("hex")}`;
  const order = Date.now();
  const sql = db();
  await sql`INSERT INTO tasks (id, text, project, done, order_key, created_at) VALUES (${id}, ${text}, ${project}, false, ${order}, now())`;
  return NextResponse.json({ id, text, project, done: false, order });
}
