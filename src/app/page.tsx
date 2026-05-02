import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-obsidian text-ink relative overflow-hidden">
      {/* Aurora background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gold/8 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-ai/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-rose/6 blur-[120px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <NavBar />

      <Hero />

      <CanvasPreview />

      <FeatureGrid />

      <HowItWorks />

      <AgentSection />

      <DesignNote />

      <FinalCTA />

      <Footer />
    </main>
  );
}

/* ─── NAV ─────────────────────────────────────────────────────────────── */

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-obsidian-border/60 bg-obsidian/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-gold to-rose flex items-center justify-center text-[11px] font-display text-obsidian font-semibold">
            R
          </div>
          <span className="font-display text-[18px] tracking-tight">
            Research Canvas
          </span>
          <span className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.2em] border border-obsidian-border rounded px-1.5 py-0.5 ml-1">
            v0.1
          </span>
        </Link>

        <nav className="ml-auto hidden md:flex items-center gap-7 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute">
          <a href="#how" className="hover:text-ink transition-colors">
            How it works
          </a>
          <a href="#agents" className="hover:text-ink transition-colors">
            Agents
          </a>
          <a href="#features" className="hover:text-ink transition-colors">
            Features
          </a>
        </nav>

        <Link
          href="/canvas"
          className="ml-7 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gold border border-gold/40 hover:bg-gold/10 hover:border-gold/60 transition-all rounded-md px-3 py-1.5"
        >
          <span>Open Canvas</span>
          <span className="text-base leading-none">→</span>
        </Link>
      </div>
    </header>
  );
}

/* ─── HERO ────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-obsidian-border bg-obsidian-panel/60 backdrop-blur rounded-full pl-1.5 pr-3 py-1 mb-9">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] bg-gold/15 text-gold rounded-full px-2 py-0.5">
            New
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-mute">
            Powered by Gemini 2.0 Flash
          </span>
        </div>

        <h1 className="font-display text-[56px] md:text-[88px] leading-[0.95] tracking-tight mb-7">
          Read papers
          <br />
          <span className="italic text-ink-mute">like a graph,</span>
          <br />
          not a wall of text.
        </h1>

        <p className="text-[17px] md:text-[18px] text-ink-soft leading-relaxed max-w-2xl mb-10">
          Upload a research PDF. <strong className="text-ink">Two AI agents</strong> run in parallel to
          extract a structured knowledge graph and a ranked set of insights.
          Click any node — the exact source sentence glows in the document. Then{" "}
          <strong className="text-ink">chat</strong> with the paper using full context.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
          <Link
            href="/canvas"
            className="group inline-flex items-center gap-2 bg-gold text-obsidian font-mono text-[12px] uppercase tracking-[0.14em] font-semibold rounded-md px-5 py-3 hover:bg-gold-soft transition-all shadow-[0_0_40px_rgba(232,162,49,0.25)]"
          >
            <span>Launch Canvas</span>
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-mute border border-obsidian-border hover:border-obsidian-active hover:text-ink rounded-md px-5 py-3 transition-all"
          >
            See how it works
          </a>
        </div>

        {/* Pipeline trail */}
        <div className="flex items-center gap-2 md:gap-4 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          <span className="text-gold">PDF</span>
          <Arrow />
          <span>Knowledge Graph</span>
          <Arrow />
          <span>Insights</span>
          <Arrow />
          <span>Chat</span>
          <Arrow />
          <span className="text-sage">LaTeX</span>
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return <span className="text-obsidian-active">———→</span>;
}

/* ─── CANVAS PREVIEW (Mock UI) ────────────────────────────────────────── */

function CanvasPreview() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <div className="relative rounded-2xl border border-obsidian-border overflow-hidden bg-obsidian-panel/60 backdrop-blur-sm shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
        {/* Mac-style window header */}
        <div className="h-9 bg-obsidian-raised/60 border-b border-obsidian-border flex items-center px-4 gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-gold/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-sage/60" />
          <span className="ml-4 font-mono text-[10px] text-ink-faint">
            research-canvas / attention-is-all-you-need.pdf
          </span>
          <span className="ml-auto font-mono text-[9px] text-ink-faint uppercase tracking-[0.18em]">
            ◆ live preview
          </span>
        </div>

        {/* Three-pane mock */}
        <div className="grid grid-cols-12 h-[440px]">
          {/* Document */}
          <div className="col-span-5 border-r border-obsidian-border p-5 overflow-hidden">
            <div className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.18em] mb-3">
              Document
            </div>
            <div className="space-y-2 text-[12px] text-ink-soft leading-relaxed">
              <p>
                We propose a new simple network architecture, the{" "}
                <mark className="research-highlight">
                  Transformer, based solely on attention mechanisms
                </mark>
                , dispensing with recurrence and convolutions entirely.
              </p>
              <p>
                Experiments on two machine translation tasks show these models
                to be superior in quality while being more parallelizable and
                requiring significantly less time to train.
              </p>
              <p className="text-ink-faint">
                Our model achieves 28.4 BLEU on the WMT 2014 English-to-German
                translation task, improving over the existing best results,
                including ensembles, by over 2 BLEU.
              </p>
            </div>
          </div>

          {/* Graph */}
          <div className="col-span-7 flex flex-col">
            <div className="flex-1 relative bg-obsidian overflow-hidden">
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #1a1a1f 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <MockGraph />
            </div>
            <div className="h-[140px] border-t border-obsidian-border p-4">
              <div className="font-mono text-[9px] text-gold uppercase tracking-[0.18em] mb-2 border-b border-gold pb-1 inline-block">
                Insights
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <MockInsight
                  cat="Finding"
                  color="rose"
                  title="Self-attention beats recurrence"
                />
                <MockInsight
                  cat="Methodology"
                  color="sage"
                  title="Multi-head attention layers"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.16em] text-center mt-5">
        click any node in the canvas → source sentence highlights instantly
      </p>
    </section>
  );
}

function MockInsight({
  cat,
  title,
  color,
}: {
  cat: string;
  title: string;
  color: "rose" | "sage" | "gold" | "ai";
}) {
  const map = {
    rose: "text-rose border-rose/30 bg-rose/5",
    sage: "text-sage border-sage/30 bg-sage/5",
    gold: "text-gold border-gold/30 bg-gold/5",
    ai: "text-ai border-ai/30 bg-ai/5",
  };
  return (
    <div className="bg-obsidian-raised/50 border border-obsidian-border rounded-md p-2.5">
      <span
        className={`font-mono text-[8px] uppercase tracking-[0.18em] border rounded-full px-1.5 py-0.5 ${map[color]}`}
      >
        {cat}
      </span>
      <p className="font-display text-[13px] text-ink mt-1.5">{title}</p>
    </div>
  );
}

function MockGraph() {
  return (
    <svg viewBox="0 0 600 320" className="w-full h-full">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.18)" />
        </marker>
      </defs>
      {/* edges */}
      <path
        d="M150,80 C220,80 220,160 290,160"
        stroke="rgba(255,255,255,0.10)"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M450,80 C380,80 380,160 310,160"
        stroke="rgba(255,255,255,0.10)"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M300,180 L180,260"
        stroke="rgba(255,255,255,0.10)"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M300,180 L420,260"
        stroke="rgba(255,255,255,0.10)"
        fill="none"
        markerEnd="url(#arrow)"
      />

      <MockNode x={90} y={55} cat="entity" label="Transformer" color="#4A9EFF" />
      <MockNode
        x={390}
        y={55}
        cat="method"
        label="Self-Attention"
        color="#3ECF8E"
      />
      <MockNode
        x={230}
        y={140}
        cat="concept"
        label="Sequence Modeling"
        color="#E8A231"
        active
      />
      <MockNode
        x={120}
        y={235}
        cat="finding"
        label="28.4 BLEU score"
        color="#E85D82"
      />
      <MockNode
        x={360}
        y={235}
        cat="method"
        label="Multi-Head Attention"
        color="#3ECF8E"
      />
    </svg>
  );
}

function MockNode({
  x,
  y,
  label,
  cat,
  color,
  active = false,
}: {
  x: number;
  y: number;
  label: string;
  cat: string;
  color: string;
  active?: boolean;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      {active && (
        <rect
          x="-2"
          y="-2"
          width="124"
          height="48"
          rx="11"
          fill={color}
          opacity="0.12"
        />
      )}
      <rect
        width="120"
        height="44"
        rx="9"
        fill="#111114"
        stroke={color}
        strokeOpacity={active ? 1 : 0.5}
      />
      <circle cx="10" cy="14" r="2.5" fill={color} />
      <text
        x="18"
        y="17"
        fontFamily="JetBrains Mono"
        fontSize="8"
        fill={color}
        letterSpacing="0.8"
      >
        {cat.toUpperCase()}
      </text>
      <text
        x="10"
        y="34"
        fontFamily="Geist, system-ui"
        fontSize="11"
        fill="#F0EDE8"
        fontWeight="500"
      >
        {label}
      </text>
    </g>
  );
}

/* ─── FEATURES ────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    label: "Bidirectional highlight",
    color: "gold" as const,
    title: "Click a node, the sentence glows.",
    body: "Every graph node carries the verbatim source quote. Clicking finds and highlights the exact passage in the document — zero round-trips.",
    icon: "◆",
  },
  {
    label: "Parallel agents",
    color: "ai" as const,
    title: "Two minds, one click.",
    body: "Graph extraction and insight synthesis run as concurrent Gemini calls, so you watch both progress bars fill at the same time.",
    icon: "∥",
  },
  {
    label: "Context-aware chat",
    color: "sage" as const,
    title: "Conversation that sees the whole paper.",
    body: "The chat model receives the document, the graph, and your last clicked focus quote — so answers are grounded in what you're looking at.",
    icon: "✱",
  },
  {
    label: "Compilable export",
    color: "rose" as const,
    title: "From PDF to .tex in one click.",
    body: "Press Export — get a structured LaTeX file with abstract, findings, concept map, and your chat transcript. No manual cleanup.",
    icon: "λ",
  },
];

function FeatureGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Capabilities"
        title="A canvas, not a chatbot."
        sub="Four primitives, four moments of delight."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-obsidian-border rounded-2xl overflow-hidden border border-obsidian-border mt-12">
        {FEATURES.map((f) => {
          const colorMap = {
            gold: "text-gold",
            ai: "text-ai",
            sage: "text-sage",
            rose: "text-rose",
          };
          return (
            <div
              key={f.label}
              className="bg-obsidian-panel p-9 hover:bg-obsidian-raised/60 transition-colors group"
            >
              <div className="flex items-start gap-3 mb-5">
                <span
                  className={`text-2xl ${colorMap[f.color]} font-display`}
                >
                  {f.icon}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.18em] ${colorMap[f.color]}`}
                >
                  {f.label}
                </span>
              </div>
              <h3 className="font-display text-[28px] leading-tight text-ink mb-3">
                {f.title}
              </h3>
              <p className="text-[14.5px] text-ink-soft leading-relaxed max-w-md">
                {f.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      label: "Drop",
      title: "Upload a PDF",
      body: "PDF text is extracted in your browser via pdfjs-dist — no server upload, no waiting on file I/O.",
    },
    {
      n: "02",
      label: "Analyze",
      title: "Two agents fire",
      body: "Graph Extractor builds 8–20 typed nodes. Insight Analyzer ranks 5 structured insights. Both stream from Gemini in parallel.",
    },
    {
      n: "03",
      label: "Explore",
      title: "Click → highlight → ask",
      body: "Click a node — its source sentence glows in the document. Open the chat — every question answers from full context.",
    },
  ];

  return (
    <section id="how" className="max-w-7xl mx-auto px-6 py-24 border-y border-obsidian-border/40">
      <SectionHeader
        eyebrow="Pipeline"
        title="Three steps, ~15 seconds."
        sub="From a raw paper to a structured knowledge workspace."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
        {steps.map((s) => (
          <div
            key={s.n}
            className="relative border border-obsidian-border bg-obsidian-panel/40 rounded-xl p-7 hover:border-obsidian-active transition-colors"
          >
            <div className="flex items-center justify-between mb-7">
              <span className="font-display text-[64px] leading-none text-gold/80">
                {s.n}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {s.label}
              </span>
            </div>
            <h3 className="font-display text-[24px] text-ink mb-2.5 leading-tight">
              {s.title}
            </h3>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── AGENTS ──────────────────────────────────────────────────────────── */

const AGENTS = [
  {
    letter: "A",
    name: "Graph Extractor",
    color: "#E8A231",
    role: "Builds a typed knowledge graph",
    detail:
      "Returns 8–20 nodes across four categories (concept, entity, method, finding) with verbatim source quotes for every node.",
    output: "{ nodes: [...], edges: [...] }",
  },
  {
    letter: "B",
    name: "Insight Analyzer",
    color: "#4A9EFF",
    role: "Distills the paper into 5 insights",
    detail:
      "Ranked by significance, tagged by category (finding · limitation · methodology · implication · gap) and confidence (high · med · low).",
    output: "{ insights: [5 items] }",
  },
  {
    letter: "C",
    name: "Context Chat",
    color: "#3ECF8E",
    role: "Streams answers grounded in the doc",
    detail:
      "Receives DOCUMENT + GRAPH + FOCUS quote on every turn. References graph nodes inline as clickable [NODE: label] chips.",
    output: "stream → ReadableStream",
  },
  {
    letter: "D",
    name: "LaTeX Formatter",
    color: "#E85D82",
    role: "Compiles your work into a .tex",
    detail:
      "One-shot LaTeX or Markdown export with abstract, key findings, concept map, and chat transcript. Compiles with pdflatex.",
    output: ".tex / .md download",
  },
];

function AgentSection() {
  return (
    <section id="agents" className="max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Architecture"
        title="Four specialized agents."
        sub="Every prompt is hand-tuned, JSON-mode locked, and Zod-validated before reaching the UI."
      />
      <div className="space-y-px bg-obsidian-border rounded-2xl overflow-hidden border border-obsidian-border mt-12">
        {AGENTS.map((a) => (
          <div
            key={a.letter}
            className="bg-obsidian-panel hover:bg-obsidian-raised/50 transition-colors group grid grid-cols-12 gap-6 p-7 items-center"
          >
            <div className="col-span-12 md:col-span-2 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-display text-[24px] border"
                style={{
                  background: `${a.color}12`,
                  borderColor: `${a.color}45`,
                  color: a.color,
                }}
              >
                {a.letter}
              </div>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: a.color }}
              >
                Agent {a.letter}
              </span>
            </div>
            <div className="col-span-12 md:col-span-6">
              <h3 className="font-display text-[22px] text-ink mb-1">
                {a.name}
              </h3>
              <p className="text-[13.5px] text-ink-mute mb-2 italic">
                {a.role}
              </p>
              <p className="text-[13px] text-ink-soft leading-relaxed">
                {a.detail}
              </p>
            </div>
            <div className="col-span-12 md:col-span-4 md:text-right">
              <span className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.14em] block mb-1">
                Output
              </span>
              <code
                className="font-mono text-[12px] inline-block px-2.5 py-1 rounded border"
                style={{
                  color: a.color,
                  borderColor: `${a.color}30`,
                  background: `${a.color}08`,
                }}
              >
                {a.output}
              </code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── DESIGN NOTE ─────────────────────────────────────────────────────── */

function DesignNote() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 border-y border-obsidian-border/40">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Design system · Obsidian Lab
          </span>
          <h2 className="font-display text-[44px] md:text-[52px] leading-[1.05] mt-4 tracking-tight">
            Not a chatbot.
            <br />
            <span className="italic text-ink-mute">A scientific instrument.</span>
          </h2>
          <p className="text-[15px] text-ink-soft leading-relaxed mt-6 max-w-md">
            Inspired by Nature journal and terminal interfaces. Every element
            earns its place. No glassmorphism, no gradient bloat, no AI slop.
            Just a precise, functional canvas you'd actually use to do real
            research.
          </p>
        </div>

        <div className="md:col-span-7 grid grid-cols-2 gap-3">
          {[
            { name: "Concept", color: "#E8A231", hex: "#E8A231" },
            { name: "Entity", color: "#4A9EFF", hex: "#4A9EFF" },
            { name: "Method", color: "#3ECF8E", hex: "#3ECF8E" },
            { name: "Finding", color: "#E85D82", hex: "#E85D82" },
          ].map((c) => (
            <div
              key={c.name}
              className="border border-obsidian-border rounded-xl p-5 bg-obsidian-panel/40"
            >
              <div
                className="w-full h-20 rounded-lg mb-4"
                style={{
                  background: `linear-gradient(135deg, ${c.hex}, ${c.hex}40)`,
                }}
              />
              <div className="flex items-center justify-between">
                <span className="font-display text-[16px] text-ink">
                  {c.name}
                </span>
                <span className="font-mono text-[10px] text-ink-faint">
                  {c.hex}
                </span>
              </div>
            </div>
          ))}
          <div className="col-span-2 grid grid-cols-3 gap-3 mt-2">
            <div className="border border-obsidian-border rounded-xl p-4 bg-obsidian-panel/40">
              <p className="font-display italic text-[28px] text-ink leading-none">
                Aa
              </p>
              <p className="font-mono text-[9px] text-ink-faint mt-3 uppercase tracking-[0.14em]">
                Instrument Serif
              </p>
            </div>
            <div className="border border-obsidian-border rounded-xl p-4 bg-obsidian-panel/40">
              <p className="font-mono text-[20px] text-ink leading-none">
                Aa
              </p>
              <p className="font-mono text-[9px] text-ink-faint mt-3 uppercase tracking-[0.14em]">
                JetBrains Mono
              </p>
            </div>
            <div className="border border-obsidian-border rounded-xl p-4 bg-obsidian-panel/40">
              <p className="text-[20px] text-ink font-medium leading-none">
                Aa
              </p>
              <p className="font-mono text-[9px] text-ink-faint mt-3 uppercase tracking-[0.14em]">
                Geist Sans
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ───────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-28">
      <div className="relative border border-obsidian-border rounded-3xl bg-gradient-to-br from-obsidian-panel via-obsidian-raised/40 to-obsidian-panel p-12 md:p-16 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-rose/10 blur-3xl" />

        <div className="relative text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            ◆ Ready to read differently
          </span>
          <h2 className="font-display text-[48px] md:text-[68px] leading-[0.98] tracking-tight mt-5 mb-7">
            Open the canvas.
            <br />
            <span className="italic text-ink-mute">Drop a paper.</span>
          </h2>
          <p className="text-[16px] text-ink-soft max-w-xl mx-auto mb-10">
            No signup. No database. Your document never leaves the browser
            until the moment AI analysis runs.
          </p>
          <Link
            href="/canvas"
            className="inline-flex items-center gap-3 bg-gold text-obsidian font-mono text-[12px] uppercase tracking-[0.16em] font-semibold rounded-md px-7 py-3.5 hover:bg-gold-soft transition-all shadow-[0_0_60px_rgba(232,162,49,0.3)]"
          >
            <span>Launch Canvas</span>
            <span className="text-base leading-none">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-obsidian-border/60">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-gold to-rose" />
          <span>Research Canvas · 2026</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Next.js 15</span>
          <span>·</span>
          <span>Gemini 2.0 Flash</span>
          <span>·</span>
          <span>React Flow</span>
          <span>·</span>
          <span>pdfjs-dist</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── HELPERS ─────────────────────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="max-w-3xl">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
        ◆ {eyebrow}
      </span>
      <h2 className="font-display text-[40px] md:text-[56px] leading-[1.02] tracking-tight mt-4">
        {title}
      </h2>
      {sub && (
        <p className="text-[15px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
          {sub}
        </p>
      )}
    </div>
  );
}
