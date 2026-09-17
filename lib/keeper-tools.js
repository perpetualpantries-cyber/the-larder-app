import { db } from "./db";
import crypto from "crypto";
import { CATS, TASK_PROJECT_LABEL } from "./constants";

const validCategories = Object.keys(CATS).filter((c) => c !== "tasks" && c !== "artifacts");
const validProjects = Object.keys(TASK_PROJECT_LABEL);

export const KEEPER_TOOLS = [
  {
    name: "search_facts",
    description:
      "Search or list stored facts about Josh, Perpetual Pantries, or any other tracked category. Pass a text query to search, or a category to list everything in it, or neither to get the most recently added facts.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text search across all fact content." },
        category: {
          type: "string",
          enum: validCategories,
          description: "Limit to one category (e.g. 'josh', 'pp-product', 'job-search').",
        },
        limit: { type: "integer", description: "Max results, default 20." },
      },
    },
  },
  {
    name: "add_fact",
    description: "Save a new fact/note into the Larder under a category.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: validCategories },
        text: { type: "string" },
        subcategory: { type: "string", description: "Optional subcategory label; defaults to 'Recently added'." },
      },
      required: ["category", "text"],
    },
  },
  {
    name: "update_fact",
    description: "Edit the text of an existing fact by id.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" }, text: { type: "string" } },
      required: ["id", "text"],
    },
  },
  {
    name: "delete_fact",
    description: "Permanently remove a fact by id.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "list_tasks",
    description: "List tasks, optionally filtered by project or completion status.",
    input_schema: {
      type: "object",
      properties: {
        project: { type: "string", enum: validProjects },
        done: { type: "boolean", description: "Filter to only done or only open tasks. Omit for all." },
      },
    },
  },
  {
    name: "add_task",
    description: "Create a new task.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        project: { type: "string", enum: validProjects, description: "Defaults to 'general'." },
      },
      required: ["text"],
    },
  },
  {
    name: "update_task",
    description: "Edit a task's text and/or mark it done/not done.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        text: { type: "string" },
        done: { type: "boolean" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_task",
    description: "Permanently remove a task by id.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "list_artifacts",
    description: "List the artifact catalog (documents, decks, sheets, dashboards), optionally filtered by project.",
    input_schema: {
      type: "object",
      properties: { project: { type: "string", enum: validProjects } },
    },
  },
  {
    name: "add_artifact",
    description: "Add an entry to the artifact catalog.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: { type: "string", enum: ["Doc", "Sheet", "Slide deck", "App"] },
        project: { type: "string", enum: validProjects },
      },
      required: ["title"],
    },
  },
];

export async function runKeeperTool(name, input) {
  const sql = db();
  switch (name) {
    case "search_facts": {
      const limit = Math.min(input.limit || 20, 100);
      let rows;
      if (input.query) {
        rows = await sql`SELECT id, category, subcategory, text, created_at as "createdAt" FROM facts WHERE text ILIKE ${"%" + input.query + "%"} ORDER BY order_key DESC LIMIT ${limit}`;
      } else if (input.category) {
        rows = await sql`SELECT id, category, subcategory, text, created_at as "createdAt" FROM facts WHERE category = ${input.category} ORDER BY order_key DESC LIMIT ${limit}`;
      } else {
        rows = await sql`SELECT id, category, subcategory, text, created_at as "createdAt" FROM facts ORDER BY order_key DESC LIMIT ${limit}`;
      }
      return rows;
    }
    case "add_fact": {
      const category = input.category;
      const subcategory = input.subcategory || "Recently added";
      const id = `${category}-${crypto.randomBytes(4).toString("hex")}`;
      const order = Date.now();
      await sql`INSERT INTO facts (id, category, subcategory, text, order_key, created_at) VALUES (${id}, ${category}, ${subcategory}, ${input.text}, ${order}, now())`;
      return { ok: true, id };
    }
    case "update_fact": {
      await sql`UPDATE facts SET text = ${input.text}, updated_at = now() WHERE id = ${input.id}`;
      return { ok: true };
    }
    case "delete_fact": {
      await sql`DELETE FROM facts WHERE id = ${input.id}`;
      return { ok: true };
    }
    case "list_tasks": {
      let rows;
      if (input.project && typeof input.done === "boolean") {
        rows = await sql`SELECT id, text, project, done, created_at as "createdAt", completed_at as "completedAt" FROM tasks WHERE project = ${input.project} AND done = ${input.done} ORDER BY order_key DESC`;
      } else if (input.project) {
        rows = await sql`SELECT id, text, project, done, created_at as "createdAt", completed_at as "completedAt" FROM tasks WHERE project = ${input.project} ORDER BY order_key DESC`;
      } else if (typeof input.done === "boolean") {
        rows = await sql`SELECT id, text, project, done, created_at as "createdAt", completed_at as "completedAt" FROM tasks WHERE done = ${input.done} ORDER BY order_key DESC`;
      } else {
        rows = await sql`SELECT id, text, project, done, created_at as "createdAt", completed_at as "completedAt" FROM tasks ORDER BY order_key DESC`;
      }
      return rows;
    }
    case "add_task": {
      const project = input.project || "general";
      const id = `task-${crypto.randomBytes(4).toString("hex")}`;
      const order = Date.now();
      await sql`INSERT INTO tasks (id, text, project, done, order_key, created_at) VALUES (${id}, ${input.text}, ${project}, false, ${order}, now())`;
      return { ok: true, id };
    }
    case "update_task": {
      if (typeof input.done === "boolean") {
        await sql`UPDATE tasks SET done = ${input.done}, completed_at = ${input.done ? new Date().toISOString() : null} WHERE id = ${input.id}`;
      }
      if (typeof input.text === "string") {
        await sql`UPDATE tasks SET text = ${input.text} WHERE id = ${input.id}`;
      }
      return { ok: true };
    }
    case "delete_task": {
      await sql`DELETE FROM tasks WHERE id = ${input.id}`;
      return { ok: true };
    }
    case "list_artifacts": {
      let rows;
      if (input.project) {
        rows = await sql`SELECT id, title, type, project, created_at as "createdAt" FROM artifacts WHERE project = ${input.project} ORDER BY order_key DESC`;
      } else {
        rows = await sql`SELECT id, title, type, project, created_at as "createdAt" FROM artifacts ORDER BY order_key DESC`;
      }
      return rows;
    }
    case "add_artifact": {
      const type = input.type || "Doc";
      const project = input.project || "general";
      const id = `artifact-${crypto.randomBytes(4).toString("hex")}`;
      const order = Date.now();
      await sql`INSERT INTO artifacts (id, title, type, project, order_key, created_at) VALUES (${id}, ${input.title}, ${type}, ${project}, ${order}, now())`;
      return { ok: true, id };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
