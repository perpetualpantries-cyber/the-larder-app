import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const sql = db();
  if (typeof body.done === "boolean") {
    await sql`UPDATE tasks SET done = ${body.done}, completed_at = ${body.done ? new Date().toISOString() : null} WHERE id = ${id}`;
  }
  if (typeof body.text === "string") {
    await sql`UPDATE tasks SET text = ${body.text} WHERE id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { id } = params;
  const sql = db();
  await sql`DELETE FROM tasks WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
