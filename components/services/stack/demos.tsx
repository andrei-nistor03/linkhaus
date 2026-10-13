import type { CSSProperties, ReactNode } from "react";

// Every scene is drawn on a fixed 480×320 board (see `.sd-canvas` in
// stack.css) and scaled to fit the stage, so coordinates here are absolute
// board pixels. Static styles describe the finished frame; the keyframes in
// stack.css animate *into* it, which keeps reduced-motion frames meaningful.

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const PAPER = "#f5f3ee";
const INK = "#0d0d0d";

function Cursor({ className }: { className: string }) {
  return (
    <svg className={`sd-cursor ${className}`} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 1.5l12.5 6.2-5.6 1.4-2.3 5.4z" fill={PAPER} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 01 · Design & Identity                                                     */
/* -------------------------------------------------------------------------- */

function LandingScene() {
  const rise = (d: number): Vars => ({ "--d": `${d}s` });
  return (
    <div className="sd-window" style={{ background: PAPER, color: INK }}>
      <div className="sd-window-bar">
        <i />
        <i />
        <i />
        <span>yourbrand.com</span>
      </div>

      <div className="sd-abs sd-rise flex items-center gap-3" style={{ left: 18, right: 18, top: 40, ...rise(0.1) }}>
        <span className="text-[11px] font-bold tracking-tight">brand.</span>
        <span className="ml-auto flex gap-2">
          <span className="sd-bar w-6" />
          <span className="sd-bar w-6" />
          <span className="sd-bar w-6" />
        </span>
        <span className="h-3 w-10 rounded-full" style={{ background: "var(--accent)" }} />
      </div>

      <div className="sd-abs sd-display text-[50px] leading-[0.88]" style={{ left: 18, top: 74 }}>
        <span className="sd-rise block" style={rise(0.3)}>
          Make it
        </span>
        <span className="sd-rise block" style={{ ...rise(0.42), color: "var(--accent)" }}>
          Yours.
        </span>
      </div>

      <div className="sd-abs sd-rise flex flex-col gap-1.5" style={{ left: 18, top: 172, ...rise(0.55) }}>
        <span className="sd-bar" style={{ width: 170 }} />
        <span className="sd-bar" style={{ width: 128 }} />
      </div>

      <div
        className="sd-abs sd-rise flex items-center justify-center rounded-full text-[10px] font-semibold"
        style={{
          left: 18,
          top: 200,
          width: 112,
          height: 28,
          background: "var(--accent)",
          color: "var(--accent-ink)",
          ...rise(0.7),
        }}
      >
        Start a project
      </div>

      <div
        className="sd-abs sd-rise overflow-hidden rounded-[10px]"
        style={{
          left: 250,
          top: 66,
          width: 172,
          height: 150,
          background: `linear-gradient(140deg, var(--accent), ${INK} 92%)`,
          ...rise(0.48),
        }}
      >
        <span className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full border-[10px] border-white/25" />
        <span className="absolute left-4 top-4 h-8 w-8 rounded-md bg-white/20" />
      </div>

      <div className="sd-abs sd-rise flex items-center gap-1.5" style={{ left: 18, top: 248, ...rise(0.85) }}>
        {["var(--accent)", INK, "#6f6c66", "#dedad0"].map((c) => (
          <span key={c} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c }} />
        ))}
      </div>
      <div className="sd-abs sd-rise flex items-end gap-2" style={{ left: 250, top: 236, ...rise(0.95) }}>
        <span className="sd-display text-[28px] leading-none">Aa</span>
        <span className="sd-mono pb-1 text-[7px] opacity-50">THUNDER / GROTESK</span>
      </div>

      <div className="sd-select" />
    </div>
  );
}

function MotionScene() {
  const letters = "MOTION".split("");
  const keys = [
    [0.08, 0.42, 0.8],
    [0.2, 0.55],
    [0.3, 0.66, 0.92],
  ];
  return (
    <div className="sd-window" style={{ background: "#161616", color: PAPER }}>
      <div className="sd-window-bar">
        <i />
        <i />
        <i />
        <span>scroll · hover · reveal</span>
      </div>

      <div className="sd-abs sd-display w-full text-center text-[64px] leading-none" style={{ top: 42 }}>
        {letters.map((l, i) => (
          <span key={i} className="sd-wave" style={{ "--d": `${i * 0.09}s` } as Vars}>
            {l}
          </span>
        ))}
      </div>

      <div className="sd-abs flex gap-3" style={{ left: 30, top: 118 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="sd-slide-card flex h-[72px] w-[118px] flex-col justify-end gap-1.5 rounded-[10px] p-2.5"
            style={{
              background: i === 1 ? "var(--accent)" : "#232323",
              color: i === 1 ? "var(--accent-ink)" : PAPER,
              "--d": `${i * 0.16}s`,
            } as Vars}
          >
            <span className="sd-bar w-14" style={{ opacity: 0.5 }} />
            <span className="sd-bar w-9" style={{ opacity: 0.3 }} />
          </div>
        ))}
      </div>

      <div className="sd-abs rounded-lg bg-black/40 p-2.5" style={{ left: 18, right: 18, top: 208, height: 72 }}>
        {["opacity", "y", "scale"].map((label, row) => (
          <div key={label} className="relative flex h-[17px] items-center">
            <span className="sd-mono w-12 text-[7px] uppercase text-white/40">{label}</span>
            <span className="relative h-px flex-1 bg-white/10">
              {keys[row].map((f) => (
                <span
                  key={f}
                  className="sd-key absolute top-1/2 -mt-[3px] block h-[6px] w-[6px]"
                  style={{ left: `${f * 100}%`, "--d": `${f * 4}s` } as Vars}
                />
              ))}
            </span>
          </div>
        ))}
        <span
          className="sd-playhead absolute bottom-1.5 top-1.5 w-px"
          style={{ left: 58, background: "var(--accent)", "--track-w": "336px" } as Vars}
        />
      </div>
    </div>
  );
}

function WebglScene() {
  return (
    <>
      <div className="sd-floor" />
      <div className="sd-orbit-x" style={{ "--d": "0s" } as Vars}>
        <div className="sd-orbit-y" />
      </div>
      <div className="sd-scene3d">
        <div className="sd-cube">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="sd-face" />
          ))}
        </div>
      </div>
      <div className="sd-orbit-x" style={{ "--d": "-3s" } as Vars}>
        <div className="sd-orbit-y" style={{ background: "var(--accent)" }} />
      </div>
      <div className="sd-abs sd-mono flex items-center gap-2 text-[9px] text-white/55" style={{ right: 22, top: 18 }}>
        <span className="sd-live h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        REAL-TIME · 60 FPS
      </div>
      <div className="sd-abs sd-display text-[22px] leading-none text-white/80" style={{ left: 22, top: 16 }}>
        WebGL
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 02 · Structure & Navigation                                                */
/* -------------------------------------------------------------------------- */

const NODES = [
  { id: "home", label: "Home", x: 240, y: 36, level: 0, visit: 0 },
  { id: "shop", label: "Shop", x: 110, y: 112, level: 1, visit: 1 },
  { id: "studio", label: "Studio", x: 240, y: 112, level: 1 },
  { id: "journal", label: "Journal", x: 370, y: 112, level: 1 },
  { id: "apparel", label: "Apparel", x: 64, y: 188, level: 2, visit: 2 },
  { id: "objects", label: "Objects", x: 162, y: 188, level: 2 },
  { id: "article", label: "Article", x: 370, y: 188, level: 2 },
  { id: "product", label: "Product", x: 64, y: 260, level: 3, visit: 3 },
] as const;

const EDGES: [string, string][] = [
  ["home", "shop"],
  ["home", "studio"],
  ["home", "journal"],
  ["shop", "apparel"],
  ["shop", "objects"],
  ["journal", "article"],
  ["apparel", "product"],
];

function SitemapScene() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <>
      <svg className="sd-abs inset-0" width="480" height="320" fill="none" aria-hidden="true">
        {EDGES.map(([a, b]) => {
          const p = byId[a];
          const c = byId[b];
          const midY = (p.y + 14 + c.y - 14) / 2;
          return (
            <path
              key={`${a}-${b}`}
              className="sd-draw"
              pathLength={1}
              d={`M${p.x} ${p.y + 14}V${midY}H${c.x}V${c.y - 14}`}
              stroke="rgba(245,243,238,0.28)"
              strokeWidth="1.2"
              style={{ "--d": `${0.15 + c.level * 0.35}s` } as Vars}
            />
          );
        })}
      </svg>
      {NODES.map((n) => (
        <div
          key={n.id}
          className="sd-node sd-rise"
          style={{ left: n.x, top: n.y, "--d": `${n.level * 0.35}s` } as Vars}
        >
          {"visit" in n && (
            <span className="sd-node-inner" style={{ "--v": `${1.9 + n.visit * 0.45}s` } as Vars} />
          )}
          <span className="relative">{n.label}</span>
        </div>
      ))}
      <div className="sd-abs sd-mono flex gap-1.5 text-[9px] text-white/40" style={{ left: 190, top: 254 }}>
        {["Home", "Shop", "Apparel", "Product"].map((c, i) => (
          <span key={c} className="sd-rise" style={{ "--d": `${1.9 + i * 0.45}s`, color: i === 3 ? "var(--accent)" : undefined } as Vars}>
            {i > 0 && <span className="mr-1.5 text-white/25">/</span>}
            {c}
          </span>
        ))}
      </div>
    </>
  );
}

function ResponsiveScene() {
  return (
    <>
      <div className="sd-abs sd-mono h-4 w-full text-[9px] tracking-[0.14em] text-white/55" style={{ top: 18 }}>
        <span className="sd-bp">DESKTOP · 1440</span>
        <span className="sd-bp">TABLET · 768</span>
        <span className="sd-bp">MOBILE · 375</span>
      </div>
      <div className="sd-device">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="sd-bar w-8" style={{ color: PAPER, opacity: 0.5 }} />
          <span className="sd-rlinks ml-auto">
            <span className="sd-bar w-6" style={{ color: PAPER }} />
            <span className="sd-bar w-6" style={{ color: PAPER }} />
            <span className="sd-bar w-6" style={{ color: PAPER }} />
          </span>
          <span className="sd-rburger ml-auto flex-col gap-[3px]">
            <span className="block h-px w-3 bg-white/60" />
            <span className="block h-px w-3 bg-white/60" />
          </span>
        </div>
        <div
          className="mb-2.5 flex h-[64px] flex-col justify-end rounded-lg p-2.5"
          style={{ background: `linear-gradient(120deg, var(--accent), #1d1d1d)` }}
        >
          <span className="sd-display sd-rhero-title text-[26px] leading-[0.9] text-white">Built to fit.</span>
        </div>
        <div className="sd-rgrid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex h-[52px] flex-col justify-end gap-1 rounded-md bg-[#232323] p-2">
              <span className="sd-bar w-10" style={{ color: PAPER, opacity: 0.35 }} />
              <span className="sd-bar w-6" style={{ color: PAPER, opacity: 0.2 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 03 · Commerce & Accounts                                                   */
/* -------------------------------------------------------------------------- */

function CartScene() {
  return (
    <>
      <div className="sd-abs rounded-[14px] p-3.5" style={{ left: 20, top: 30, width: 190, height: 260, background: PAPER, color: INK }}>
        <div
          className="relative h-[140px] overflow-hidden rounded-[10px]"
          style={{ background: `linear-gradient(150deg, var(--accent), #2a1408)` }}
        >
          <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-white/30" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[12px] font-semibold">Linen Overshirt</span>
          <span className="sd-mono text-[11px]">€89</span>
        </div>
        <div className="sd-mono mt-1 text-[8px] opacity-45">SIZE M · SAND</div>
        <div
          className="sd-press-add sd-abs flex items-center justify-center rounded-full text-[10px] font-semibold"
          style={{ left: 14, right: 14, top: 216, height: 30, background: INK, color: PAPER }}
        >
          Add to cart
        </div>
      </div>

      <div
        className="sd-fly sd-abs z-10 h-9 w-9 rounded-lg"
        style={{ left: 97, top: 92, background: `linear-gradient(150deg, var(--accent), #2a1408)` }}
      />

      <div
        className="sd-abs overflow-hidden rounded-[14px] border border-white/10 bg-[#161616] p-4"
        style={{ left: 230, top: 30, width: 230, height: 260 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">Cart</span>
          <span
            className="sd-badge flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            1
          </span>
          <span className="sd-mono ml-auto text-[8px] text-white/35">SECURE CHECKOUT</span>
        </div>
        <div className="mt-2.5 h-px bg-white/10" />
        <div className="sd-cart-item mt-3 flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: `linear-gradient(150deg, var(--accent), #2a1408)` }} />
          <span className="flex-1">
            <span className="block text-[10px] font-medium">Linen Overshirt</span>
            <span className="sd-mono block text-[8px] text-white/40">M · SAND · ×1</span>
          </span>
          <span className="sd-mono text-[10px]">€89</span>
        </div>
        <div className="sd-abs flex flex-col gap-2" style={{ left: 16, right: 16, top: 160 }}>
          <div className="sd-mono flex justify-between text-[9px] text-white/45">
            <span>SHIPPING</span>
            <span>FREE</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-white/70">Total</span>
            <span className="sd-display text-[24px] leading-none">
              €<span className="sd-total" />
            </span>
          </div>
        </div>
        <div
          className="sd-press-checkout sd-abs flex items-center justify-center rounded-full text-[10px] font-semibold"
          style={{ left: 16, right: 16, top: 212, height: 32, background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          Checkout →
        </div>
        <div className="sd-success sd-abs inset-0 flex flex-col items-center justify-center gap-2 bg-[#161616]">
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
            <circle cx="27" cy="27" r="25" stroke="var(--accent)" strokeWidth="2" />
            <path className="sd-check" pathLength={1} d="M16 28l7 7 15-16" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-semibold">Payment complete</span>
          <span className="sd-mono text-[8px] text-white/40">ORDER #1042 · RECEIPT SENT</span>
        </div>
      </div>

      <Cursor className="sd-cursor-cart" />
    </>
  );
}

function AuthScene() {
  return (
    <>
      <div className="sd-abs rounded-[14px] p-4" style={{ left: 24, top: 34, width: 200, height: 252, background: PAPER, color: INK }}>
        <div className="text-[14px] font-semibold">Welcome back</div>
        <div className="mt-0.5 text-[9px] opacity-50">Sign in to your account</div>

        <div className="sd-mono mt-4 text-[7px] opacity-50">EMAIL</div>
        <div className="mt-1 flex h-7 items-center rounded-lg border border-black/15 px-2.5">
          <span className="sd-mono sd-type text-[10px]">you@brand.com</span>
        </div>

        <div className="sd-mono mt-3 text-[7px] opacity-50">PASSWORD</div>
        <div className="mt-1 flex h-7 items-center gap-1 rounded-lg border border-black/15 px-2.5">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="sd-pwdot h-1.5 w-1.5 rounded-full bg-black/80" style={{ "--d": `${i * 0.1}s` } as Vars} />
          ))}
        </div>

        <div className="sd-btn-auth relative mt-5 flex h-[30px] items-center justify-center rounded-full text-[10px] font-semibold" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
          <span className="sd-btn-label absolute" style={{ opacity: 0 }}>
            Continue
          </span>
          <span className="sd-btn-spin absolute">
            <span className="sd-spinner block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" />
          </span>
          <span className="sd-btn-done absolute" style={{ opacity: 1 }}>
            ✓ Signed in
          </span>
        </div>
      </div>

      <div className="sd-abs overflow-hidden rounded-[14px] border border-white/10 bg-[#161616] p-4" style={{ left: 244, top: 34, width: 212, height: 252 }}>
        <div className="sd-members">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(140deg, var(--accent), #333)` }} />
            <span>
              <span className="block text-[10px] font-semibold">Members area</span>
              <span className="sd-mono block text-[7px] text-white/40">3 NEW RESOURCES</span>
            </span>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="mt-3 flex items-center gap-2.5 rounded-lg bg-white/[0.04] p-2">
              <span className="h-8 w-10 shrink-0 rounded-md" style={{ background: i === 0 ? "var(--accent)" : "#2a2a2a" }} />
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="sd-bar w-20" style={{ color: PAPER, opacity: 0.4 }} />
                <span className="sd-bar w-12" style={{ color: PAPER, opacity: 0.2 }} />
              </span>
            </div>
          ))}
        </div>
        <div className="sd-lock sd-abs left-1/2 top-1/2 -ml-[22px] -mt-[26px]">
          <svg width="44" height="52" viewBox="0 0 44 52" fill="none" aria-hidden="true">
            <path className="sd-shackle" d="M12 22V14a10 10 0 0120 0v8" stroke={PAPER} strokeWidth="3.5" strokeLinecap="round" />
            <rect x="4" y="22" width="36" height="28" rx="7" fill={PAPER} />
            <circle cx="22" cy="35" r="3.5" fill={INK} />
          </svg>
        </div>
        <div
          className="sd-badge-pro sd-mono sd-abs rounded-full px-2.5 py-1 text-[8px] font-bold"
          style={{ right: 14, bottom: 14, background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          PRO MEMBER
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 04 · Engineering & Infrastructure                                          */
/* -------------------------------------------------------------------------- */

const SATELLITES = [
  { label: "Payments", x: 82, y: 44 },
  { label: "CRM", x: 398, y: 44 },
  { label: "Analytics", x: 82, y: 176 },
  { label: "Email", x: 398, y: 176 },
];

const LOG = [
  ["POST", "/api/orders", "201", "38ms"],
  ["→", "payments.intent", "ok", "21ms"],
  ["→", "crm.contacts.upsert", "ok", "17ms"],
  ["GET", "/api/products", "200", "12ms"],
];

function ApiScene() {
  return (
    <>
      <svg className="sd-abs inset-0" width="480" height="320" fill="none" aria-hidden="true">
        {SATELLITES.map((s, i) => (
          <g key={s.label}>
            <line x1="240" y1="110" x2={s.x} y2={s.y} stroke="rgba(245,243,238,0.12)" strokeWidth="1.2" />
            <line
              className="sd-flow"
              data-reverse={i % 2 ? "" : undefined}
              x1="240"
              y1="110"
              x2={s.x}
              y2={s.y}
              stroke="var(--accent)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
      {SATELLITES.map((s) => (
        <div key={s.label} className="sd-node" style={{ left: s.x, top: s.y }}>
          {s.label}
        </div>
      ))}
      <div
        className="sd-hub sd-abs flex h-[68px] w-[68px] items-center justify-center rounded-full border-[1.5px] bg-[#121212]"
        style={{ left: 206, top: 76, borderColor: "var(--accent)" }}
      >
        <span className="sd-display text-[26px] leading-none">API</span>
      </div>

      <div className="sd-abs rounded-[10px] border border-white/10 bg-[#0e0e0e] px-3.5 py-2.5" style={{ left: 40, top: 222, width: 400 }}>
        <div className="h-12 overflow-hidden">
          <div className="sd-log">
            {[...LOG, ...LOG].map(([method, path, status, ms], i) => (
              <div key={i} className="sd-mono flex h-4 items-center gap-3 text-[9px]">
                <span className="w-8 text-white/45">{method}</span>
                <span className="flex-1 text-white/80">{path}</span>
                <span style={{ color: "var(--accent)" }}>{status}</span>
                <span className="w-9 text-right text-white/35">{ms}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const TABLES = [
  { name: "users", x: 24, y: 30, rows: [["id", "uuid"], ["email", "text"], ["plan", "enum"]] },
  { name: "products", x: 326, y: 30, rows: [["id", "uuid"], ["title", "text"], ["price", "int"]] },
  { name: "orders", x: 175, y: 128, rows: [["id", "uuid"], ["user_id", "fk"], ["product_id", "fk"], ["total", "int"]] },
];

function Table({ name, rows, style, className = "" }: { name: string; rows: string[][]; style: Vars; className?: string }) {
  return (
    <div className={`sd-abs w-[130px] overflow-hidden rounded-lg border border-white/15 bg-[#151515] ${className}`} style={style}>
      <div className="sd-mono flex h-[22px] items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-2.5 text-[9px] font-bold">
        <span className="h-1.5 w-1.5 rounded-sm" style={{ background: "var(--accent)" }} />
        {name}
      </div>
      {rows.map(([field, type]) => (
        <div key={field} className="sd-mono flex h-[17px] items-center justify-between px-2.5 text-[8px]">
          <span className="text-white/75">{field}</span>
          <span className={type === "fk" ? "" : "text-white/35"} style={type === "fk" ? { color: "var(--accent)" } : undefined}>
            {type}
          </span>
        </div>
      ))}
    </div>
  );
}

function DatabaseScene() {
  return (
    <>
      <svg className="sd-abs inset-0" width="480" height="320" fill="none" aria-hidden="true">
        <path className="sd-draw" pathLength={1} d="M154 64C190 64 150 175 175 175" stroke="var(--accent)" strokeWidth="1.3" style={{ "--d": "0.4s" } as Vars} />
        <path className="sd-draw" pathLength={1} d="M326 64C290 64 330 192 305 192" stroke="var(--accent)" strokeWidth="1.3" style={{ "--d": "0.6s" } as Vars} />
        <path className="sd-draw" pathLength={1} d="M70 103V200" stroke="var(--accent)" strokeWidth="1.3" style={{ "--d": "2.9s" } as Vars} />
      </svg>
      {TABLES.map((t, i) => (
        <Table key={t.name} name={t.name} rows={t.rows} className="sd-rise" style={{ left: t.x, top: t.y, "--d": `${i * 0.15}s` }} />
      ))}
      <Table
        name="subscriptions"
        rows={[["id", "uuid"], ["user_id", "fk"], ["renews_at", "date"]]}
        className="sd-newtable"
        style={{ left: 24, top: 200, borderColor: "var(--accent)" }}
      />
      <div className="sd-abs sd-rise sd-mono flex items-center gap-2 text-[8px] text-white/50" style={{ left: 196, top: 252, "--d": "3.2s" } as Vars}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        NEW CONTENT TYPE · NO REBUILD · 0 DOWNTIME
      </div>
    </>
  );
}

const SCORES = ["Performance", "Accessibility", "Best practices", "SEO"];
const VITALS = [
  ["LCP", "0.8s"],
  ["INP", "48ms"],
  ["CLS", "0.01"],
];

function ScoresScene() {
  return (
    <>
      {SCORES.map((label, i) => (
        <div key={label} className="sd-abs flex w-[96px] flex-col items-center gap-2" style={{ left: 27 + i * 108, top: 40 }}>
          <div className="relative h-[84px] w-[84px]">
            <svg width="84" height="84" viewBox="0 0 84 84" fill="none" className="-rotate-90" aria-hidden="true">
              <circle cx="42" cy="42" r="36" stroke="rgba(245,243,238,0.1)" strokeWidth="5" />
              <circle
                className="sd-ring"
                cx="42"
                cy="42"
                r="36"
                pathLength={100}
                stroke="var(--accent)"
                strokeWidth="5"
                strokeLinecap="round"
                style={{ "--d": `${i * 0.15}s` } as Vars}
              />
            </svg>
            <span
              className="sd-count sd-display absolute inset-0 flex items-center justify-center text-[28px] leading-none"
              style={{ "--to": 100, "--d": `${i * 0.15}s` } as Vars}
            />
          </div>
          <span className="sd-mono text-center text-[7.5px] uppercase tracking-[0.1em] text-white/50">{label}</span>
        </div>
      ))}
      <div className="sd-abs flex gap-2.5" style={{ left: 40, top: 192 }}>
        {VITALS.map(([k, v], i) => (
          <div
            key={k}
            className="sd-rise flex w-[124px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
            style={{ "--d": `${1.4 + i * 0.15}s` } as Vars}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="sd-mono text-[9px] text-white/50">{k}</span>
            <span className="ml-auto text-[15px] font-semibold leading-none">{v}</span>
          </div>
        ))}
      </div>
      <div className="sd-abs sd-rise sd-mono w-full text-center text-[8px] tracking-[0.16em] text-white/40" style={{ top: 252, "--d": "1.9s" } as Vars}>
        CORE WEB VITALS · PASSED · WCAG 2.2 AA
      </div>
    </>
  );
}

const DEPLOYS = [
  ["v1.4.0", "Checkout copy test", "6d"],
  ["v1.4.1", "Image CDN switch", "2d"],
  ["v1.5.0", "Members dashboard", "now"],
];

function SupportScene() {
  return (
    <>
      <div className="sd-abs" style={{ left: 24, top: 18 }}>
        <div className="sd-display text-[54px] leading-[0.9]">99.99%</div>
        <div className="sd-mono mt-1 text-[8px] tracking-[0.14em] text-white/45">UPTIME · LAST 90 DAYS</div>
      </div>
      <div className="sd-abs sd-mono flex items-center gap-2 text-[8px] text-white/50" style={{ right: 24, top: 26 }}>
        <span className="sd-live h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        MONITORING
      </div>
      <div className="sd-abs flex items-end gap-[3px]" style={{ left: 24, top: 96, height: 40 }}>
        {Array.from({ length: 43 }, (_, i) => (
          <span
            key={i}
            className="sd-uptime block w-[7px] rounded-[2px]"
            style={{
              height: i === 27 ? 22 : 40,
              background: i === 27 ? "rgba(245,243,238,0.4)" : "var(--accent)",
              opacity: i === 27 ? 1 : 0.85,
              "--d": `${i * 0.025}s`,
            } as Vars}
          />
        ))}
      </div>
      <div className="sd-abs flex flex-col gap-2" style={{ left: 24, right: 24, top: 156 }}>
        {DEPLOYS.map(([ver, msg, when], i) => (
          <div
            key={ver}
            className="sd-rise flex h-[34px] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3"
            style={{ "--d": `${1.2 + i * 0.35}s` } as Vars}
          >
            <span className="sd-mono text-[9px]" style={{ color: "var(--accent)" }}>
              {ver}
            </span>
            <span className="text-[10px] text-white/75">{msg}</span>
            <span className="sd-mono ml-auto text-[8px] text-white/35">{when === "now" ? "SHIPPED · NOW" : `SHIPPED · ${when}`}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export const SERVICE_DEMOS: Record<string, () => ReactNode[]> = {
  "01": () => [<LandingScene key="landing" />, <MotionScene key="motion" />, <WebglScene key="webgl" />],
  "02": () => [<SitemapScene key="sitemap" />, <ResponsiveScene key="responsive" />],
  "03": () => [<CartScene key="cart" />, <AuthScene key="auth" />],
  "04": () => [<ApiScene key="api" />, <DatabaseScene key="db" />, <ScoresScene key="scores" />, <SupportScene key="support" />],
};
