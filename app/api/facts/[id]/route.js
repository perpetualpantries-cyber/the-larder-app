import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const sql = db();
  if (typeof body.text === "string") {
    await sql`UPDATE facts SET text = ${body.text}, updated_at = now() WHERE id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { id } = params;
  const sql = db();
  await sql`DELETE FROM facts WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
