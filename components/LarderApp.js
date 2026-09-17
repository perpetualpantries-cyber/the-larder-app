"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  GROUPS,
  CATS,
  SUBCATS,
  RECENT,
  TASK_PROJECTS,
  TASK_PROJECT_LABEL,
  ARTIFACT_TYPES,
} from "../lib/constants";

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function IconBack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function fmtWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < 3600000) return "just now";
  if (diff < day) return `${Math.round(diff / 3600000)}h ago`;
  if (diff < day * 14) return `${Math.round(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function LarderApp() {
  const [facts, setFacts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState("overview");
  const [taskFilter, setTaskFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [artifactFilter, setArtifactFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const reload = useCallback(async () => {
    try {
      const [f, t, a] = await Promise.all([
        fetch("/api/facts").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/artifacts").then((r) => r.json()),
      ]);
      setFacts(f);
      setTasks(t);
      setArtifacts(a);
      setLoaded(true);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function navigate(id) {
    setView(id);
    setSearchOpen(false);
    setQuery("");
    window.scrollTo({ top: 0 });
  }

  const factsFor = (catId) => facts.filter((f) => f.category === catId);
  const openTasks = () => tasks.filter((t) => !t.done);

  if (loadError) {
    return <div className="no-db">Couldn&apos;t reach the database right now — try reloading.</div>;
  }

  return (
    <div className="app">
      <Header
        view={view}
        navigate={navigate}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        query={query}
        setQuery={setQuery}
        facts={facts}
        navigateToFactCat={(cat) => navigate(cat)}
      />
      <main>
        {!loaded ? (
          <div className="loading">Opening the larder…</div>
        ) : view === "overview" ? (
          <Overview facts={facts} tasks={tasks} artifacts={artifacts} navigate={navigate} reload={reload} />
        ) : view === "tasks" ? (
          <TasksPage
            tasks={tasks}
            navigate={navigate}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            showCompleted={showCompleted}
            setShowCompleted={setShowCompleted}
            reload={reload}
          />
        ) : view === "artifacts" ? (
          <ArtifactsPage
            artifacts={artifacts}
            navigate={navigate}
            artifactFilter={artifactFilter}
            setArtifactFilter={setArtifactFilter}
            reload={reload}
          />
        ) : (
          <CategoryPage catId={view} facts={factsFor(view)} navigate={navigate} reload={reload} />
        )}
      </main>
      <Composer navigate={navigate} reload={reload} />
    </div>
  );
}

function Header({ view, navigate, searchOpen, setSearchOpen, query, setQuery, facts, navigateToFactCat }) {
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return facts.filter((f) => (f.text || "").toLowerCase().includes(q)).slice(0, 40);
  }, [query, facts]);

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <span className="mark">The Larder</span>
          <span className="tag">everything, kept</span>
        </div>
        <button
          className={"iconbtn" + (searchOpen ? " active" : "")}
          aria-label="Search"
          onClick={() => setSearchOpen((s) => !s)}
        >
          <IconSearch />
        </button>
      </div>
      <nav className="chips">
        <button className="chip" data-active={view === "overview"} onClick={() => navigate("overview")}>
          Overview
        </button>
        {GROUPS.map((g) =>
          g.items.map((id) => (
            <button key={id} className="chip" data-active={view === id} onClick={() => navigate(id)}>
              {CATS[id].short}
            </button>
          ))
        )}
      </nav>
      {searchOpen ? (
        <div className="search-panel">
          <div className="search-field">
            <IconSearch />
            <input
              autoFocus
              type="text"
              placeholder="Search everything you've stored…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="search-results">
            {hits === null ? (
              <div className="search-empty">Search across every category — Perpetual Pantries, the job search, the car, all of it.</div>
            ) : hits.length === 0 ? (
              <div className="search-empty">Nothing matching &quot;{query}&quot; yet.</div>
            ) : (
              hits.map((f) => {
                const cat = CATS[f.category];
                return (
                  <div key={f.id} className="search-hit" onClick={() => navigateToFactCat(f.category)}>
                    <div className="hit-meta">
                      {(cat ? cat.short : f.category) + " · " + (f.subcategory || "")}
                    </div>
                    <div className="hit-text">{f.text}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Overview({ facts, tasks, artifacts, navigate, reload }) {
  const total = facts.length;
  const added = facts.filter((f) => f.subcategory === RECENT).length;
  const open = tasks.filter((t) => !t.done);
  const openPreview = open.slice().sort((a, b) => (b.order || 0) - (a.order || 0)).slice(0, 5);
  const recent = facts
    .filter((f) => f.subcategory === RECENT)
    .sort((a, b) => (b.order || 0) - (a.order || 0))
    .slice(0, 6);

  async function toggleTask(id) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    reload();
  }

  return (
    <>
      <div className="hero">
        <h1>Everything, kept in one place.</h1>
        <p>
          What this remembers about you, Perpetual Pantries, and every project running alongside it. Add to it any
          time from the bar below — no need to say which part it belongs to.
        </p>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="n">{total}</div>
          <div className="l">things kept</div>
        </div>
        <div className="stat">
          <div className="n">{Object.keys(CATS).length - 1}</div>
          <div className="l">categories</div>
        </div>
        <div className="stat">
          <div className="n">{added}</div>
          <div className="l">added by you</div>
        </div>
        <div className="stat">
          <div className="n">{open.length}</div>
          <div className="l">open tasks</div>
        </div>
        <div className="stat">
          <div className="n">{artifacts.length}</div>
          <div className="l">artifacts</div>
        </div>
      </div>

      <div className="group-label">Open tasks</div>
      {openPreview.length ? (
        <div className="overview-tasks">
          {openPreview.map((t) => (
            <div key={t.id} className="overview-task" onClick={() => navigate("tasks")}>
              <button
                className="check"
                aria-label="Mark done"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTask(t.id);
                }}
              >
                <IconCheck />
              </button>
              <div>
                <div className="ot-text">{t.text}</div>
                <span className="ot-tag">{TASK_PROJECT_LABEL[t.project] || t.project}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-note">Nothing outstanding — add one from the Tasks page.</div>
      )}

      {GROUPS.map((g) => (
        <div key={g.label}>
          <div className="group-label">{g.label}</div>
          <div className="tiles">
            {g.items.map((id) => {
              const c = CATS[id];
              const count =
                id === "tasks" ? open.length : id === "artifacts" ? artifacts.length : facts.filter((f) => f.category === id).length;
              return (
                <button key={id} className="tile" onClick={() => navigate(id)}>
                  <div className="tile-top">
                    <h3>{c.label}</h3>
                    <span className="count">{count}</span>
                  </div>
                  <p>{c.blurb}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="group-label">Recently added</div>
      {recent.length ? (
        <div className="recent-list">
          {recent.map((f) => {
            const cat = CATS[f.category];
            return (
              <div key={f.id} className="recent-item" onClick={() => navigate(f.category)}>
                <div className="rm">
                  {(cat ? cat.short : f.category) + " · " + fmtWhen(f.createdAt)}
                </div>
                <div className="rt">{f.text}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-note">Nothing added by hand yet — use the bar below any time.</div>
      )}
    </>
  );
}

function FactRow({ f, reload }) {
  const [text, setText] = useState(f.text);
  const [saving, setSaving] = useState(false);

  async function save() {
    const val = text.trim();
    if (!val || val === f.text) {
      setText(f.text);
      return;
    }
    setSaving(true);
    await fetch(`/api/facts/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: val }),
    });
    setSaving(false);
    reload();
  }

  async function remove() {
    setSaving(true);
    await fetch(`/api/facts/${f.id}`, { method: "DELETE" });
    reload();
  }

  return (
    <li className={"fact" + (saving ? " saving" : "")}>
      <span className="dot" />
      <div
        className="fact-text"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => {
          setText(e.currentTarget.textContent);
          save();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      >
        {f.text}
      </div>
      <div className="fact-actions">
        <button aria-label="Remove" title="Remove" onClick={remove}>
          <IconTrash />
        </button>
      </div>
    </li>
  );
}

function CategoryPage({ catId, facts, navigate, reload }) {
  const c = CATS[catId];
  const recent = facts.filter((f) => f.subcategory === RECENT).sort((a, b) => (b.order || 0) - (a.order || 0));
  const subcats = SUBCATS[catId] || [];

  return (
    <>
      <div className="cat-header">
        <button className="back" onClick={() => navigate("overview")}>
          <IconBack />
          Overview
        </button>
        <h1>{c.label}</h1>
        <p>{c.blurb}</p>
      </div>

      {recent.length ? (
        <section className="subcat is-recent">
          <h2>
            Recently added <span className="badge">{recent.length}</span>
          </h2>
          <ul className="fact-list">
            {recent.map((f) => (
              <FactRow key={f.id} f={f} reload={reload} />
            ))}
          </ul>
        </section>
      ) : null}

      {subcats.map((sub) => {
        const items = facts.filter((f) => f.subcategory === sub).sort((a, b) => (a.order || 0) - (b.order || 0));
        if (!items.length) return null;
        return (
          <section className="subcat" key={sub}>
            <h2>{sub}</h2>
            <ul className="fact-list">
              {items.map((f) => (
                <FactRow key={f.id} f={f} reload={reload} />
              ))}
            </ul>
          </section>
        );
      })}

      {!facts.length ? <div className="empty-note">Nothing here yet — add the first thing below.</div> : null}
    </>
  );
}

function TaskRow({ t, reload }) {
  const [text, setText] = useState(t.text);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    setSaving(false);
    reload();
  }

  async function save() {
    const val = text.trim();
    if (!val || val === t.text) {
      setText(t.text);
      return;
    }
    setSaving(true);
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: val }),
    });
    setSaving(false);
    reload();
  }

  async function remove() {
    setSaving(true);
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    reload();
  }

  return (
    <li className={"task" + (t.done ? " done" : "") + (saving ? " saving" : "")}>
      <button className="check" aria-label="Toggle done" onClick={toggle}>
        <IconCheck />
      </button>
      <div className="task-body">
        <div
          className="task-text"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => {
            setText(e.currentTarget.textContent);
            save();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {t.text}
        </div>
        <span className="task-tag">{TASK_PROJECT_LABEL[t.project] || t.project}</span>
      </div>
      <div className="fact-actions">
        <button aria-label="Remove" title="Remove" onClick={remove}>
          <IconTrash />
        </button>
      </div>
    </li>
  );
}

function TasksPage({ tasks, navigate, taskFilter, setTaskFilter, showCompleted, setShowCompleted, reload }) {
  const c = CATS.tasks;
  const [text, setText] = useState("");
  const [project, setProject] = useState(taskFilter !== "all" ? taskFilter : "general");
  const [busy, setBusy] = useState(false);

  const filtered = taskFilter === "all" ? tasks : tasks.filter((t) => t.project === taskFilter);
  const open = filtered.filter((t) => !t.done).sort((a, b) => (b.order || 0) - (a.order || 0));
  const done = filtered
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ? new Date(b.completedAt).getTime() : 0) - (a.completedAt ? new Date(a.completedAt).getTime() : 0));

  async function submit() {
    const val = text.trim();
    if (!val) return;
    setBusy(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: val, project }),
    });
    setText("");
    setBusy(false);
    reload();
  }

  return (
    <>
      <div className="cat-header">
        <button className="back" onClick={() => navigate("overview")}>
          <IconBack />
          Overview
        </button>
        <h1>{c.label}</h1>
        <p>{c.blurb}</p>
      </div>

      <div className="task-add-row">
        <select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Project">
          {TASK_PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Add a task…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button type="button" aria-label="Add" disabled={!text.trim() || busy} onClick={submit}>
          <IconPlus />
        </button>
      </div>

      <div className="task-filters">
        <button className="chip" data-active={taskFilter === "all"} onClick={() => setTaskFilter("all")}>
          All
        </button>
        {TASK_PROJECTS.map((p) => (
          <button key={p.id} className="chip" data-active={taskFilter === p.id} onClick={() => setTaskFilter(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {open.length ? (
        <ul className="task-list">
          {open.map((t) => (
            <TaskRow key={t.id} t={t} reload={reload} />
          ))}
        </ul>
      ) : (
        <div className="empty-note">
          Nothing outstanding{taskFilter === "all" ? "" : ` in ${TASK_PROJECT_LABEL[taskFilter] || ""}`}.
        </div>
      )}

      <button className="completed-toggle" onClick={() => setShowCompleted(!showCompleted)}>
        {showCompleted ? "Hide" : "Show"} completed ({done.length})
      </button>
      {showCompleted && done.length ? (
        <ul className="task-list">
          {done.map((t) => (
            <TaskRow key={t.id} t={t} reload={reload} />
          ))}
        </ul>
      ) : null}
    </>
  );
}

function ArtifactRow({ a, reload }) {
  const [title, setTitle] = useState(a.title);
  const [saving, setSaving] = useState(false);

  async function save() {
    const val = title.trim();
    if (!val || val === a.title) {
      setTitle(a.title);
      return;
    }
    setSaving(true);
    await fetch(`/api/artifacts/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: val }),
    });
    setSaving(false);
    reload();
  }

  async function remove() {
    setSaving(true);
    await fetch(`/api/artifacts/${a.id}`, { method: "DELETE" });
    reload();
  }

  return (
    <li className={"fact" + (saving ? " saving" : "")}>
      <span className="dot" />
      <div className="fact-body">
        <div
          className="fact-text"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => {
            setTitle(e.currentTarget.textContent);
            save();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {a.title}
        </div>
        <div className="tag-row">
          <span className="artifact-type-tag">{a.type || "Doc"}</span>
          <span className="task-tag">{TASK_PROJECT_LABEL[a.project] || a.project}</span>
        </div>
      </div>
      <div className="fact-actions">
        <button aria-label="Remove" title="Remove" onClick={remove}>
          <IconTrash />
        </button>
      </div>
    </li>
  );
}

function ArtifactsPage({ artifacts, navigate, artifactFilter, setArtifactFilter, reload }) {
  const c = CATS.artifacts;
  const [title, setTitle] = useState("");
  const [type, setType] = useState(ARTIFACT_TYPES[0]);
  const [project, setProject] = useState(artifactFilter !== "all" ? artifactFilter : "general");
  const [busy, setBusy] = useState(false);

  const items = (artifactFilter === "all" ? artifacts : artifacts.filter((a) => a.project === artifactFilter))
    .slice()
    .sort((a, b) => (b.order || 0) - (a.order || 0));

  async function submit() {
    const val = title.trim();
    if (!val) return;
    setBusy(true);
    await fetch("/api/artifacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: val, type, project }),
    });
    setTitle("");
    setBusy(false);
    reload();
  }

  return (
    <>
      <div className="cat-header">
        <button className="back" onClick={() => navigate("overview")}>
          <IconBack />
          Overview
        </button>
        <h1>{c.label}</h1>
        <p>{c.blurb}</p>
      </div>

      <div className="task-add-row">
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          {ARTIFACT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Project">
          {TASK_PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Add a document, deck, or dashboard…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button type="button" aria-label="Add" disabled={!title.trim() || busy} onClick={submit}>
          <IconPlus />
        </button>
      </div>

      <div className="task-filters">
        <button className="chip" data-active={artifactFilter === "all"} onClick={() => setArtifactFilter("all")}>
          All
        </button>
        {TASK_PROJECTS.map((p) => (
          <button key={p.id} className="chip" data-active={artifactFilter === p.id} onClick={() => setArtifactFilter(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {items.length ? (
        <ul className="fact-list">
          {items.map((a) => (
            <ArtifactRow key={a.id} a={a} reload={reload} />
          ))}
        </ul>
      ) : (
        <div className="empty-note">
          Nothing catalogued yet{artifactFilter === "all" ? "" : ` for ${TASK_PROJECT_LABEL[artifactFilter] || ""}`}.
        </div>
      )}
    </>
  );
}

function Composer({ navigate, reload }) {
  const [category, setCategory] = useState("josh");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("Saves straight into the larder — no need to say who or what it's about.");

  async function submit(e) {
    e.preventDefault();
    const val = text.trim();
    if (!val) return;
    setBusy(true);
    try {
      await fetch("/api/facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, text: val }),
      });
      setText("");
      setHint(`Saved to ${CATS[category].short}.`);
      reload();
      setTimeout(() => setHint("Saves straight into the larder — no need to say who or what it's about."), 2200);
    } catch {
      setHint("Couldn't save that just now — try again.");
    }
    setBusy(false);
  }

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-inner">
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          {GROUPS.filter((g) => g.label !== "Tasks" && g.label !== "Artifacts").map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.items.map((id) => (
                <option key={id} value={id}>
                  {CATS[id].short}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <input
          type="text"
          placeholder="Add something to remember…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" aria-label="Save" disabled={!text.trim() || busy}>
          <IconSend />
        </button>
      </div>
      <div className="composer-hint">{hint}</div>
    </form>
  );
}
