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
            v0.2
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
      <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-obsidian-border bg-obsidian-panel/60 backdrop-blur rounded-full pl-1.5 pr-3 py-1 mb-9">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] bg-gold/15 text-gold rounded-full px-2 py-0.5">
            New
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-mute">
            Multi-doc workspace · Notepad · Compare
          </span>
        </div>

        <h1 className="font-display text-[64px] md:text-[108px] leading-[0.93] tracking-tight mb-8">
          From papers
          <br />
          <span className="italic text-ink-mute">to understanding</span>
          <br />
          your field.
        </h1>

        <p className="text-[19px] md:text-[21px] text-ink-soft leading-relaxed max-w-lg mb-12">
          Every paper becomes a knowledge map.{" "}
          <strong className="text-ink">Cite findings, compare sources,
          export your review.</strong>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/canvas"
            className="group inline-flex items-center gap-2.5 bg-gold text-obsidian font-mono text-[13px] uppercase tracking-[0.14em] font-semibold rounded-lg px-7 py-4 hover:bg-gold-soft transition-all shadow-[0_0_50px_rgba(232,162,49,0.3)]"
          >
            <span>Launch Canvas</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/canvas"
            className="group inline-flex items-center gap-2.5 font-mono text-[13px] uppercase tracking-[0.14em] text-ai border border-ai/40 hover:bg-ai/10 hover:border-ai/60 rounded-lg px-7 py-4 transition-all"
          >
            <span>Compare Papers →</span>
            <span className="font-mono text-[9px] text-ai/60 normal-case tracking-normal">inside canvas</span>
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2.5 font-mono text-[13px] uppercase tracking-[0.14em] text-ink-mute border border-obsidian-border hover:border-obsidian-active hover:text-ink rounded-lg px-7 py-4 transition-all"
          >
            See how it works
          </a>
        </div>

        {/* Pipeline trail */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          <span className="text-gold">1–3 PDFs</span>
          <Arrow />
          <span>Knowledge Graphs</span>
          <Arrow />
          <span>Insights</span>
          <Arrow />
          <span>Chat</span>
          <Arrow />
          <span className="text-ai">Notepad</span>
          <Arrow />
          <span className="text-sage">Report</span>
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
      <div className="relative rounded-2xl border border-obsidian-border overflow-hidden bg-obsidian-panel/60 backdrop-blur-sm shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        {/* Aurora glow behind the window */}
        <div className="pointer-events-none absolute -inset-x-20 -top-32 h-64 bg-gradient-to-b from-gold/15 via-rose/8 to-transparent blur-3xl" />

        {/* Mac-style window header */}
        <div className="relative h-10 bg-obsidian-raised/70 border-b border-obsidian-border flex items-center px-4 gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-gold/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-sage/70" />
          <span className="ml-4 font-mono text-[10.5px] text-ink-mute">
            research-canvas
            <span className="text-obsidian-active mx-1.5">/</span>
            <span className="text-ink">attention-is-all-you-need.pdf</span>
          </span>
          <div className="ml-auto flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
            <span>
              <span className="text-gold">12</span> nodes
            </span>
            <span>
              <span className="text-ai">14</span> edges
            </span>
            <span>
              <span className="text-sage">5</span> insights
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
              live
            </span>
          </div>
        </div>

        {/* Three-pane mock */}
        <div className="grid grid-cols-12 h-[560px]">
          {/* ─── Left: Document ─── */}
          <div className="col-span-4 border-r border-obsidian-border flex flex-col min-w-0">
            <PaneHeader label="Document" dotColor="sage" right="1,847 words" />
            <div className="flex-1 px-5 py-4 overflow-hidden text-[12.5px] text-ink-soft leading-[1.75] space-y-3">
              <p className="text-ink-faint">
                Recurrent neural networks, long short-term memory and gated
                recurrent neural networks in particular, have been firmly
                established as state of the art approaches in sequence
                modeling…
              </p>
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
                requiring significantly less time to train. Our model achieves{" "}
                <span className="text-gold-soft">28.4 BLEU</span> on the WMT
                2014 English-to-German translation task, improving over the
                existing best results, including ensembles, by over 2 BLEU.
              </p>
              <p className="text-ink-faint">
                On the WMT 2014 English-to-French translation task, our model
                establishes a new single-model state-of-the-art BLEU score of
                41.0 after training for 3.5 days on eight GPUs…
              </p>
            </div>

            {/* Focus indicator */}
            <div className="border-t border-obsidian-border px-5 py-2.5 bg-gold/5 flex items-center gap-2.5">
              <span className="font-mono text-[9px] text-gold uppercase tracking-[0.2em]">
                ◆ Focus
              </span>
              <span className="font-mono text-[10px] text-gold-soft truncate">
                "Transformer, based solely on attention…"
              </span>
            </div>
          </div>

          {/* ─── Center: Graph ─── */}
          <div className="col-span-5 border-r border-obsidian-border flex flex-col min-w-0">
            <PaneHeader label="Knowledge Graph" dotColor="gold" right="dagre · TB" />
            <div className="flex-1 relative bg-obsidian overflow-hidden">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #1a1a1f 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <MockGraph />
              {/* Mini control bar */}
              <div className="absolute bottom-3 left-3 flex flex-col gap-px bg-obsidian-panel border border-obsidian-border rounded-md overflow-hidden">
                {["+", "−", "⌂"].map((s) => (
                  <button
                    key={s}
                    className="w-6 h-6 text-ink-mute font-mono text-xs hover:bg-obsidian-raised hover:text-ink transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* Legend */}
              <div className="absolute top-3 right-3 bg-obsidian-panel/80 backdrop-blur border border-obsidian-border rounded-md p-2 space-y-1">
                {[
                  ["concept", "#E8A231"],
                  ["entity", "#4A9EFF"],
                  ["method", "#3ECF8E"],
                  ["finding", "#E85D82"],
                ].map(([label, color]) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-mute"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: color }}
                    />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right: Insights + Chat ─── */}
          <div className="col-span-3 flex flex-col min-w-0">
            <div className="flex border-b border-obsidian-border flex-shrink-0">
              <button className="px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold relative">
                Insights
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gold" />
              </button>
              <button className="px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Chat <span className="text-ink-faint">(2)</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3 space-y-2.5">
              <MiniInsight
                cat="Finding"
                color="rose"
                conf="high"
                title="Self-attention beats recurrence"
              />
              <MiniInsight
                cat="Methodology"
                color="sage"
                conf="high"
                title="Multi-head attention layers"
              />
              <MiniInsight
                cat="Implication"
                color="ai"
                conf="medium"
                title="Less training time at scale"
              />
              <MiniInsight
                cat="Gap"
                color="gold"
                conf="low"
                title="Audio & vision modalities"
              />
            </div>
            {/* Chat preview at the bottom */}
            <div className="border-t border-obsidian-border p-2.5 bg-obsidian-panel/40 flex items-center gap-2">
              <span className="font-mono text-[10px] text-ink-faint">›</span>
              <span className="font-mono text-[10.5px] text-ink-mute truncate">
                Why does attention scale better?
              </span>
              <span className="ml-auto font-mono text-[9px] text-gold uppercase tracking-[0.16em] border border-gold/40 rounded px-1.5 py-0.5">
                Send
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Annotation strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <PreviewCallout
          color="gold"
          glyph="◆"
          label="Click → Highlight"
          body="Click any node — the verbatim source sentence glows in the document pane on the left."
        />
        <PreviewCallout
          color="ai"
          glyph="∥"
          label="Parallel agents"
          body="Graph extraction and insight synthesis run as concurrent Gemini calls — both bars fill at once."
        />
        <PreviewCallout
          color="sage"
          glyph="✱"
          label="Grounded chat"
          body="Every chat turn ships full DOCUMENT + GRAPH + FOCUS context to the model."
        />
      </div>
    </section>
  );
}

function PaneHeader({
  label,
  dotColor,
  right,
}: {
  label: string;
  dotColor: "gold" | "sage" | "ai" | "rose";
  right?: string;
}) {
  const dot: Record<string, string> = {
    gold: "bg-gold",
    sage: "bg-sage",
    ai: "bg-ai",
    rose: "bg-rose",
  };
  return (
    <div className="h-9 px-4 border-b border-obsidian-border flex items-center gap-2 flex-shrink-0 bg-obsidian-panel/40">
      <span className={`w-1.5 h-1.5 rounded-full ${dot[dotColor]}`} />
      <span className="font-mono text-[9.5px] text-ink-faint uppercase tracking-[0.18em]">
        {label}
      </span>
      {right && (
        <span className="ml-auto font-mono text-[9.5px] text-ink-faint">
          {right}
        </span>
      )}
    </div>
  );
}

function MiniInsight({
  cat,
  title,
  color,
  conf,
}: {
  cat: string;
  title: string;
  color: "rose" | "sage" | "gold" | "ai";
  conf: "high" | "medium" | "low";
}) {
  const map = {
    rose: "text-rose border-rose/30 bg-rose/5",
    sage: "text-sage border-sage/30 bg-sage/5",
    gold: "text-gold border-gold/30 bg-gold/5",
    ai: "text-ai border-ai/30 bg-ai/5",
  };
  const dot = {
    high: "bg-sage",
    medium: "bg-gold",
    low: "bg-rose",
  };
  return (
    <div className="bg-obsidian-raised/60 border border-obsidian-border rounded-md p-2.5 hover:border-obsidian-active transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`font-mono text-[8px] uppercase tracking-[0.18em] border rounded-full px-1.5 py-0.5 ${map[color]}`}
        >
          {cat}
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${dot[conf]}`} />
          <span className="font-mono text-[8px] text-ink-faint uppercase tracking-[0.14em]">
            {conf}
          </span>
        </span>
      </div>
      <p className="font-display text-[13.5px] text-ink leading-tight">
        {title}
      </p>
    </div>
  );
}

function PreviewCallout({
  color,
  glyph,
  label,
  body,
}: {
  color: "gold" | "ai" | "sage";
  glyph: string;
  label: string;
  body: string;
}) {
  const map = {
    gold: "text-gold border-gold/25 bg-gold/[0.04]",
    ai: "text-ai border-ai/25 bg-ai/[0.04]",
    sage: "text-sage border-sage/25 bg-sage/[0.04]",
  };
  return (
    <div
      className={`rounded-xl border ${map[color]} p-4 backdrop-blur-sm flex gap-3`}
    >
      <span className="font-display text-[22px] leading-none">{glyph}</span>
      <div>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] mb-1">
          {label}
        </p>
        <p className="text-[13.5px] text-ink-soft leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function MockGraph() {
  return (
    <svg viewBox="0 0 600 360" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
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
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.22)" />
        </marker>
        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* edges */}
      <g stroke="rgba(255,255,255,0.10)" fill="none" strokeWidth="1">
        <path d="M150,70 C230,70 230,170 295,170" markerEnd="url(#arrow)" />
        <path d="M450,70 C370,70 370,170 305,170" markerEnd="url(#arrow)" />
        <path d="M300,200 C300,230 200,240 175,275" markerEnd="url(#arrow)" />
        <path d="M300,200 C300,230 400,240 425,275" markerEnd="url(#arrow)" />
        <path d="M450,90 C500,140 480,210 460,275" markerEnd="url(#arrow)" />
        <path d="M150,90 C100,140 120,210 140,275" markerEnd="url(#arrow)" />
      </g>

      {/* edge labels */}
      <g
        fontFamily="JetBrains Mono"
        fontSize="8.5"
        fill="#5a5a60"
        letterSpacing="0.4"
      >
        <text x="200" y="118">based on</text>
        <text x="370" y="118">uses</text>
        <text x="220" y="240">achieves</text>
        <text x="365" y="240">implements</text>
      </g>

      <MockNode x={90} y={50} cat="entity" label="Transformer" color="#4A9EFF" />
      <MockNode x={390} y={50} cat="method" label="Self-Attention" color="#3ECF8E" />
      <MockNode x={230} y={150} cat="concept" label="Sequence Modeling" color="#E8A231" active />
      <MockNode x={120} y={275} cat="finding" label="28.4 BLEU score" color="#E85D82" />
      <MockNode x={400} y={275} cat="method" label="Multi-Head Attention" color="#3ECF8E" />
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
          x="-4"
          y="-4"
          width="128"
          height="52"
          rx="12"
          fill={color}
          opacity="0.15"
          filter="url(#nodeGlow)"
        />
      )}
      <rect
        width="120"
        height="44"
        rx="10"
        fill="#111114"
        stroke={color}
        strokeOpacity={active ? 1 : 0.55}
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
    label: "Multi-doc workspace",
    color: "gold" as const,
    title: "Three papers, one canvas.",
    body: "Load up to 3 PDFs simultaneously. Each gets its own colour-coded tab, persistent knowledge graph, insights panel, and chat history — all in a single workspace.",
    icon: "⊞",
  },
  {
    label: "Bidirectional highlight",
    color: "ai" as const,
    title: "Click a node, the sentence glows.",
    body: "Every graph node carries the verbatim source quote. Clicking finds and highlights the exact passage in the document — zero round-trips.",
    icon: "◆",
  },
  {
    label: "Research notepad",
    color: "sage" as const,
    title: "Cite anything, export everything.",
    body: "Hit Cite on any graph node, insight card, or chat reply. Citations land in a persistent notepad with inline annotations and tags. One click exports a structured research report.",
    icon: "📓",
  },
  {
    label: "In-canvas compare",
    color: "rose" as const,
    title: "Side-by-side, no page switch.",
    body: "Toggle Compare mode to see two documents, their graphs, and chats side-by-side. Session state is never lost — it's a layout toggle, not a new route.",
    icon: "⇄",
  },
];

function FeatureGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Capabilities"
        title="A research hub, not a chatbot."
        sub="Six primitives built for literature review."
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
              <p className="text-[15px] text-ink-soft leading-relaxed max-w-md">
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
      title: "Upload 1–3 PDFs",
      body: "Drag papers onto the canvas tabs. Each gets its own colour-coded slot. PDF text is extracted in the browser — no server upload.",
    },
    {
      n: "02",
      label: "Analyze",
      title: "Two agents per doc",
      body: "Graph Extractor builds 8–20 typed nodes. Insight Analyzer ranks structured insights. Both run in parallel from Gemini 2.5 Flash.",
    },
    {
      n: "03",
      label: "Explore",
      title: "Click · Cite · Compare",
      body: "Click nodes to highlight source sentences. Hit Cite on anything to add it to the Notepad. Switch to Compare mode to diff two papers side-by-side.",
    },
    {
      n: "04",
      label: "Export",
      title: "Report from your citations",
      body: "Annotate and tag each citation in the Notepad. Export a structured Markdown or PDF report built from your cited findings — not a raw dump.",
    },
  ];

  return (
    <section id="how" className="max-w-7xl mx-auto px-6 py-24 border-y border-obsidian-border/40">
      <SectionHeader
        eyebrow="Pipeline"
        title="Four steps, ~20 seconds."
        sub="From raw papers to a citable research report."
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-14">
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
    role: "Builds a typed knowledge graph per slot",
    detail:
      "Returns 8–20 nodes across nine categories (concept, entity, method, finding, dataset, metric, result, assumption, limitation) with verbatim source quotes. Runs independently per document slot.",
    output: "{ nodes: [...], edges: [...] }",
  },
  {
    letter: "B",
    name: "Insight Analyzer",
    color: "#4A9EFF",
    role: "Distills each paper into ranked insights",
    detail:
      "Up to 12 insights ranked by significance, tagged by category (finding · limitation · methodology · implication · gap · contribution) and confidence. Runs in parallel with Agent A.",
    output: "{ insights: [...], summary }",
  },
  {
    letter: "C",
    name: "Context Chat",
    color: "#3ECF8E",
    role: "Streams answers grounded in the active doc",
    detail:
      "Receives DOCUMENT + GRAPH + FOCUS quote on every turn. References graph nodes inline as clickable chips. Each document slot has its own independent chat history.",
    output: "stream → ReadableStream",
  },
  {
    letter: "D",
    name: "Notepad + Report",
    color: "#9F7AEA",
    role: "Turns citations into a structured report",
    detail:
      "Cite any node, insight, or chat reply. Annotate and tag citations in the persistent Notepad sidebar. Export builds a grouped Markdown or PDF report from your cited findings — not a raw dump.",
    output: ".md / .pdf report",
  },
];

function AgentSection() {
  return (
    <section id="agents" className="max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Architecture"
        title="Four specialized agents."
        sub="Every prompt is hand-tuned, JSON-mode locked, Zod-validated, and runs per document slot."
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
            <span className="italic text-ink-mute">A research instrument.</span>
          </h2>
          <p className="text-[15px] text-ink-soft leading-relaxed mt-6 max-w-md">
            Inspired by Nature journal and terminal interfaces. Every element
            earns its place. Three-pane workspace, persistent per-document state,
            a Notepad that bridges exploration to writing, and Compare mode that
            never loses your session. Built for researchers doing real literature review.
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
            <span className="italic text-ink-mute">Drop your papers.</span>
          </h2>
          <p className="text-[16px] text-ink-soft max-w-xl mx-auto mb-10">
            No signup. No database. Load up to 3 papers, explore their graphs,
            cite findings to your Notepad, and export a structured report.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/canvas"
              className="inline-flex items-center gap-3 bg-gold text-obsidian font-mono text-[12px] uppercase tracking-[0.16em] font-semibold rounded-md px-7 py-3.5 hover:bg-gold-soft transition-all shadow-[0_0_60px_rgba(232,162,49,0.3)]"
            >
              <span>Launch Canvas</span>
              <span className="text-base leading-none">→</span>
            </Link>
          </div>
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
          <span>Next.js 16</span>
          <span>·</span>
          <span>Gemini 2.5 Flash</span>
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
        <p className="text-[17px] text-ink-soft mt-5 max-w-2xl leading-relaxed">
          {sub}
        </p>
      )}
    </div>
  );
}
