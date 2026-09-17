import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { KEEPER_TOOLS, runKeeperTool } from "../../../lib/keeper-tools";

const SYSTEM_PROMPT = `You are Keeper, the AI assistant built into The Larder — Josh's personal knowledge base covering himself, Perpetual Pantries (his café operations SaaS company), and his other projects.

You have tools to search, add, edit, and delete facts, tasks, and artifacts stored in the Larder. Use them whenever the conversation calls for looking something up or changing something — don't guess at what's stored, look it up.

Be concise and direct. When you make a change (add/edit/delete), briefly confirm what you did. When Josh asks a question, answer from what you find via search_facts/list_tasks/list_artifacts rather than from assumption.`;

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }

  const body = await req.json();
  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

  const client = new Anthropic({ apiKey });
  const messages = incomingMessages.map((m) => ({ role: m.role, content: m.content }));

  let finalText = "";
  const MAX_TURNS = 6;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      tools: KEEPER_TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");
    finalText = textBlocks.map((b) => b.text).join("\n") || finalText;

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      break;
    }

    const toolResults = [];
    for (const use of toolUses) {
      let result;
      try {
        result = await runKeeperTool(use.name, use.input || {});
      } catch (err) {
        result = { error: String(err && err.message ? err.message : err) };
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return NextResponse.json({
    reply: finalText || "(no response)",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}
