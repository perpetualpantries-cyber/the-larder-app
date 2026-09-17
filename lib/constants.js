export const GROUPS = [
  { label: "Keeper", items: ["keeper"] },
  { label: "You", items: ["josh"] },
  { label: "Tasks", items: ["tasks"] },
  { label: "Artifacts", items: ["artifacts"] },
  { label: "Perpetual Pantries", items: ["pp-product", "pp-command", "pp-investor"] },
  { label: "Other ventures", items: ["anglesea"] },
  { label: "Personal", items: ["job-search", "car", "savings-app", "cooking", "recent-work"] },
];

export const CATS = {
  keeper: { label: "Keeper", short: "Keeper", blurb: "Chat with the AI that can search, add, and edit everything in your Larder." },
  josh: { label: "Josh", short: "Josh", blurb: "Who you are, background, and how you like to work." },
  tasks: { label: "Tasks", short: "Tasks", blurb: "What's outstanding, across every project." },
  artifacts: {
    label: "Artifacts",
    short: "Artifacts",
    blurb: "Documents, decks, sheets, and dashboards produced across every project — a catalog, not the files themselves.",
  },
  "pp-product": {
    label: "The Platform",
    short: "Platform",
    blurb: "Perpetual Pantries the café app — modules, pricing, architecture, the algorithm moat.",
  },
  "pp-command": {
    label: "PP Command & Agents",
    short: "PP Command",
    blurb: "The multi-site control plane, the Gavin→Ronin→Canopy→Helm agent hierarchy, and PPcanopy.",
  },
  "pp-investor": {
    label: "Investor Deck & Financials",
    short: "Investor Deck",
    blurb: "Pitch materials, the milestone roadmap, funding tranches, the beta program.",
  },
  anglesea: {
    label: "Anglesea Golf Club",
    short: "Anglesea",
    blurb: "The Grill House Bistro bid — competitive research, staffing, open questions.",
  },
  "job-search": {
    label: "Job Search",
    short: "Job Search",
    blurb: "Applications, framing, and cover letter guidance for the Geelong hunt.",
  },
  car: { label: "Car Purchase", short: "Car", blurb: "Budget, use case, and the shortlist." },
  "savings-app": {
    label: "Savings App Idea",
    short: "Savings App",
    blurb: "Exploring AI-powered personal finance tooling — build vs. buy.",
  },
  cooking: { label: "Cooking & Recipes", short: "Cooking", blurb: "Family recipe cards and the odd birthday menu." },
  "recent-work": {
    label: "Recent Work",
    short: "Recent Work",
    blurb: "Side inquiries and one-off research that don't need their own home.",
  },
};

export const SUBCATS = {
  josh: ["About"],
  "pp-product": [
    "Overview",
    "Product Modules & Tiers",
    "Pricing",
    "Compliance & Safety",
    "Architecture & Stack",
    "Algorithms & AI Moat",
    "Hardware & Edge AI",
    "Recent Technical Work",
    "Codebase & Repo",
  ],
  "pp-command": [
    "Purpose & Components",
    "Agent Hierarchy",
    "Architecture & Build State",
    "PPcanopy (Internal Ops Dashboard)",
    "Decisions & Principles",
    "Ways of Working",
  ],
  "pp-investor": ["Status", "Materials", "Beta Program", "Milestone Roadmap & Funding", "Modelling Learnings"],
  anglesea: ["Overview", "Competitive Landscape", "Staffing & Labour Model", "Open Questions"],
  "job-search": ["Background", "Current Applications", "Writing Guidance"],
  car: ["Details"],
  "savings-app": ["Current State", "Landscape Learnings"],
  cooking: ["Notes"],
  "recent-work": ["Notes"],
};

export const RECENT = "Recently added";

export const TASK_PROJECTS = [{ id: "general", label: "General" }];
GROUPS.forEach((g) => {
  g.items.forEach((id) => {
    if (id !== "tasks" && id !== "keeper") TASK_PROJECTS.push({ id, label: CATS[id].short });
  });
});
export const TASK_PROJECT_LABEL = {};
TASK_PROJECTS.forEach((p) => {
  TASK_PROJECT_LABEL[p.id] = p.label;
});

export const ARTIFACT_TYPES = ["Doc", "Sheet", "Slide deck", "App"];
