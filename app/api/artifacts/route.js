import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import crypto from "crypto";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT id, title, type, project, order_key as "order", created_at as "createdAt" FROM artifacts ORDER BY order_key DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const body = await req.json();
  const { title } = body;
  const type = body.type || "Doc";
  const project = body.project || "general";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const id = `artifact-${crypto.randomBytes(4).toString("hex")}`;
  const order = Date.now();
  const sql = db();
  await sql`INSERT INTO artifacts (id, title, type, project, order_key, created_at) VALUES (${id}, ${title}, ${type}, ${project}, ${order}, now())`;
  return NextResponse.json({ id, title, type, project, order });
}
