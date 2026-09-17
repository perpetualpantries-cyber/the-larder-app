import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import crypto from "crypto";

export async function GET() {
  const sql = db();
  const rows = await sql`SELECT id, category, subcategory, text, order_key as "order", created_at as "createdAt", updated_at as "updatedAt" FROM facts ORDER BY order_key ASC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const body = await req.json();
  const { category, text } = body;
  const subcategory = body.subcategory || "Recently added";
  if (!category || !text) {
    return NextResponse.json({ error: "category and text are required" }, { status: 400 });
  }
  const id = `${category}-${crypto.randomBytes(4).toString("hex")}`;
  const order = Date.now();
  const sql = db();
  await sql`INSERT INTO facts (id, category, subcategory, text, order_key, created_at) VALUES (${id}, ${category}, ${subcategory}, ${text}, ${order}, now())`;
  return NextResponse.json({ id, category, subcategory, text, order });
}
