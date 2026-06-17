import { useId, useMemo } from "react";
import { useTimeTheme } from "../theme/useTimeTheme";

/* =========================================================================
   Procedural tropical foliage engine.
   Instead of static clip-art, each leaf is generated from a curved rachis
   with tapered leaflets, so every frond is organic and unique. Layered with
   depth-of-field blur + sunlight bokeh for a premium, editorial feel.
   ========================================================================= */

function leafGeometry({
  length,
  curve,
  pairs,
  maxLeaf,
  leafWidth,
  sweep,
  taperBase,
}) {
  const ctrl = { x: -curve * 0.35, y: length * 0.5 };
  const tip = { x: curve, y: length };

  const pointAt = (t) => {
    const mt = 1 - t;
    return {
      x: 2 * mt * t * ctrl.x + t * t * tip.x,
      y: 2 * mt * t * ctrl.y + t * t * tip.y,
      tx: 2 * mt * ctrl.x + 2 * t * (tip.x - ctrl.x),
      ty: 2 * mt * ctrl.y + 2 * t * (tip.y - ctrl.y),
    };
  };

  const leaflets = [];
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1);
    const p = pointAt(t);
    const tl = Math.hypot(p.tx, p.ty) || 1;
    const dx = p.tx / tl;
    const dy = p.ty / tl;
    const taper = Math.sin(Math.PI * Math.min(1, t * 1.05));
    const len = maxLeaf * (taperBase + (1 - taperBase) * taper);

    for (const side of [-1, 1]) {
      const perpX = -dy * side;
      const perpY = dx * side;
      let ux = perpX * (1 - sweep) - dx * sweep;
      let uy = perpY * (1 - sweep) - dy * sweep;
      const ul = Math.hypot(ux, uy) || 1;
      ux /= ul;
      uy /= ul;

      const ex = p.x + ux * len;
      const ey = p.y + uy * len;
      const w = len * leafWidth;
      const nx = -uy * w;
      const ny = ux * w;
      const ax = p.x + ux * len * 0.45 + nx;
      const ay = p.y + uy * len * 0.45 + ny;
      const bx = p.x + ux * len * 0.45 - nx;
      const by = p.y + uy * len * 0.45 - ny;

      leaflets.push(
        `M${p.x.toFixed(1)} ${p.y.toFixed(1)}` +
          `Q${ax.toFixed(1)} ${ay.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}` +
          `Q${bx.toFixed(1)} ${by.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}Z`,
      );
    }
  }

  return {
    leaflets,
    rachis: `M0 0Q${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`,
  };
}

const PRESETS = {
  // Feather palm — many slim leaflets swept toward the tip.
  palm: {
    length: 300,
    curve: 70,
    pairs: 18,
    maxLeaf: 94,
    leafWidth: 0.09,
    sweep: 0.55,
    taperBase: 0.32,
  },
  // Monstera / split-leaf — few broad lobes with airy gaps.
  monstera: {
    length: 240,
    curve: 36,
    pairs: 6,
    maxLeaf: 132,
    leafWidth: 0.46,
    sweep: 0.2,
    taperBase: 0.58,
  },
  // Fan palm — short, wide spray.
  fan: {
    length: 150,
    curve: 8,
    pairs: 11,
    maxLeaf: 150,
    leafWidth: 0.12,
    sweep: 0.02,
    taperBase: 0.74,
  },
};

const PALETTES = {
  jungle: { from: "#2fb573", to: "#0a5e47", vein: "#0a5e47" },
  emerald: { from: "#43d6a0", to: "#0f7a5c", vein: "#bdf5dd" },
  lime: { from: "#8ed94f", to: "#3a8f3f", vein: "#2f7a33" },
  coral: { from: "#ffae74", to: "#ff5f8d", vein: "#ffd2c0" },
  gold: { from: "#ffd86b", to: "#ff9a3c", vein: "#fff0c2" },
  white: {
    from: "rgba(255,255,255,0.6)",
    to: "rgba(255,255,255,0.22)",
    vein: "rgba(255,255,255,0.6)",
  },
  // Dark cut-out leaves for sunset/night scenes.
  silhouette: {
    from: "rgba(8,40,38,0.92)",
    to: "rgba(4,22,28,0.96)",
    vein: "rgba(0,0,0,0.3)",
  },
};

function Frond({ type = "palm", palette = "jungle", showVein = true }) {
  const rawId = useId();
  const gid = `frond-${rawId.replace(/[:]/g, "")}`;
  const geo = useMemo(() => leafGeometry(PRESETS[type]), [type]);
  const c = PALETTES[palette] || PALETTES.jungle;

  return (
    <svg
      viewBox="-170 -40 500 520"
      className="h-full w-full overflow-visible"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={c.from} />
          <stop offset="100%" stopColor={c.to} />
        </linearGradient>
      </defs>
      <g fill={`url(#${gid})`}>
        {geo.leaflets.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {showVein && (
        <path
          d={geo.rachis}
          stroke={c.vein}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.45"
        />
      )}
    </svg>
  );
}

/** Small standalone monstera mark for headers / decorative bands. */
export function LeafMark({ className = "", palette = "emerald" }) {
  return (
    <span className={`inline-block ${className}`}>
      <Frond type="monstera" palette={palette} showVein={false} />
    </span>
  );
}

function PlacedLeaf({
  size,
  pos,
  rotate = 0,
  origin = "50% 0%",
  blur = 0,
  opacity = 1,
  sway = "animate-sway",
  children,
}) {
  return (
    <div
      className="absolute"
      style={{
        ...pos,
        width: size,
        height: size,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        transform: `rotate(${rotate}deg)`,
        willChange: "transform",
      }}
    >
      <div
        className={sway}
        style={{ width: "100%", height: "100%", transformOrigin: origin }}
      >
        {children}
      </div>
    </div>
  );
}

function Bokeh({ pos, size, color, delay = "0s", anim = "animate-float" }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl ${anim}`}
      style={{
        ...pos,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        animationDelay: delay,
      }}
    />
  );
}

/* ===== Ocean & sky scene props ===== */

// Wrapper for elements that travel/float across the scene.
function Drifter({
  pos,
  width,
  anim,
  duration,
  delay = "0s",
  opacity = 1,
  blur = 0,
  children,
}) {
  return (
    <div
      className={`absolute ${anim}`}
      style={{
        ...pos,
        width,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        animationDuration: duration,
        animationDelay: delay,
        willChange: "transform",
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

// Elegant gull silhouette with a gentle wing flap.
function SeaBird({ color = "rgba(40,55,70,0.5)" }) {
  return (
    <svg
      viewBox="0 0 60 22"
      className="h-auto w-full animate-flap overflow-visible"
      fill="none"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 17 Q16 3 29 15 Q30 16 31 15 Q44 3 57 17" />
    </svg>
  );
}

// Parasailer — canopy, rigging lines and a small figure. Towed over water.
function Parasail({ canopy = "#ff6b9d", body = "rgba(35,50,65,0.72)" }) {
  return (
    <svg
      viewBox="0 0 120 112"
      className="h-auto w-full overflow-visible"
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 42 Q60 -6 114 42 Q88 31 60 31 Q32 31 6 42 Z" fill={canopy} />
      <path
        d="M40 32 L44 42 M60 31 L60 42 M80 32 L76 42"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.4"
      />
      <path
        d="M10 42 L58 88 M110 42 L62 88 M60 32 L60 86"
        stroke={body}
        strokeWidth="1.1"
      />
      <rect x="52" y="86" width="16" height="3" rx="1.5" fill={body} />
      <circle cx="60" cy="96" r="4" fill={body} />
      <path
        d="M60 100 L60 108 M60 102 L54 106 M60 102 L66 106"
        stroke={body}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Sailboat resting on the horizon.
function Sailboat({
  sail = "rgba(255,255,255,0.82)",
  hull = "rgba(35,50,65,0.7)",
}) {
  return (
    <svg
      viewBox="0 0 90 88"
      className="h-auto w-full overflow-visible"
      fill="none"
      aria-hidden="true"
    >
      <path d="M45 6 L45 62" stroke={hull} strokeWidth="2" />
      <path d="M47 10 Q70 36 70 58 L47 58 Z" fill={sail} />
      <path d="M43 14 Q25 40 25 58 L43 58 Z" fill={sail} opacity="0.9" />
      <path d="M12 62 L78 62 Q71 80 45 80 Q19 80 12 62 Z" fill={hull} />
    </svg>
  );
}

// Swaying strand of kelp/seaweed anchored to the seabed.
function Kelp({ color = "rgba(15,122,92,0.5)" }) {
  return (
    <svg
      viewBox="0 0 60 220"
      className="h-full w-full overflow-visible"
      fill={color}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <path
        d="M30 220 C18 182 44 152 28 122 C14 94 42 70 30 32 C27 18 30 8 30 0"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="152" rx="15" ry="7" transform="rotate(-32 20 152)" />
      <ellipse cx="43" cy="120" rx="15" ry="7" transform="rotate(30 43 120)" />
      <ellipse cx="19" cy="86" rx="13" ry="6" transform="rotate(-28 19 86)" />
      <ellipse cx="41" cy="56" rx="13" ry="6" transform="rotate(30 41 56)" />
      <ellipse cx="30" cy="24" rx="11" ry="6" transform="rotate(-10 30 24)" />
    </svg>
  );
}

// Bioluminescent jellyfish for the night scene.
function Jellyfish({ glow = "#7fd8ff" }) {
  const rawId = useId();
  const gid = `jelly-${rawId.replace(/[:]/g, "")}`;
  return (
    <svg
      viewBox="0 0 60 104"
      className="h-auto w-full overflow-visible"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gid} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.95" />
          <stop offset="100%" stopColor={glow} stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <path
        d="M6 36 Q6 6 30 6 Q54 6 54 36 Q42 42 30 42 Q18 42 6 36 Z"
        fill={`url(#${gid})`}
      />
      <path
        d="M14 40 Q11 64 16 90 M24 42 Q21 68 26 96 M36 42 Q39 68 34 96 M46 40 Q49 64 44 90"
        stroke={glow}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function Bubbles({ tint = "rgba(255,255,255,0.5)", origin = "left" }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        left: `${i * 16 + 4}%`,
        size: 5 + ((i * 5) % 12),
        delay: `${i * 1.7}s`,
        dur: `${9 + (i % 3) * 3}s`,
      })),
    [],
  );
  return (
    <div
      className="absolute bottom-0 h-1/2 w-40"
      style={{ [origin]: "4%" }}
      aria-hidden="true"
    >
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full animate-bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), ${tint})`,
            animationDelay: b.delay,
            animationDuration: b.dur,
          }}
        />
      ))}
    </div>
  );
}

// One seamless wave band. The path is drawn twice side by side so the
// horizontal scroll loops without a seam.
function WaveBand({ fill, opacity, duration, height, bottom, reverse }) {
  return (
    <div
      className="absolute inset-x-0"
      style={{ bottom, height, opacity }}
      aria-hidden="true"
    >
      <svg
        className={`h-full w-[200%] ${reverse ? "animate-wave [animation-direction:reverse]" : "animate-wave"}`}
        style={{ animationDuration: duration }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        fill={fill}
      >
        <path d="M0 40 C 180 0 360 80 720 40 C 1080 0 1260 80 1440 40 L1440 120 L0 120 Z" />
        <path
          d="M0 40 C 180 0 360 80 720 40 C 1080 0 1260 80 1440 40 L1440 120 L0 120 Z"
          transform="translate(1440 0)"
        />
      </svg>
    </div>
  );
}

// Layered sea at the foot of the page — gives the whole site a real horizon.
function Ocean({ palette }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[28vh] animate-swell"
      aria-hidden="true"
    >
      {/* deep water body */}
      <div
        className="absolute inset-x-0 bottom-0 h-full"
        style={{ background: palette.body }}
      />
      <WaveBand
        fill={palette.back}
        opacity={0.4}
        duration="26s"
        height="70%"
        bottom="0"
        reverse
      />
      <WaveBand
        fill={palette.mid}
        opacity={0.6}
        duration="18s"
        height="50%"
        bottom="0"
      />
      <WaveBand
        fill={palette.front}
        opacity={0.85}
        duration="12s"
        height="30%"
        bottom="0"
        reverse
      />
      {/* foam line */}
      <div
        className="absolute inset-x-0 bottom-[30%] h-px"
        style={{ background: palette.foam }}
      />
    </div>
  );
}

// Vertical shimmer of light reflecting off the water.
function SeaGlitter({ color, left = "50%" }) {
  return (
    <div
      className="absolute bottom-0 h-[34vh] w-24 animate-glimmer blur-md"
      style={{
        left,
        transform: "translateX(-50%)",
        background: `linear-gradient(to top, ${color}, transparent)`,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Decorative, non-interactive tropical layer.
 * variant: "hero" (vivid, over dark hero) | "section" (light content) | "soft".
 */
export default function TropicalBackground({
  variant = "section",
  className = "",
}) {
  const onHero = variant === "hero";
  const containerOpacity =
    variant === "soft" ? 0.55 : variant === "hero" ? 1 : 0.9;
  const leafPalette = onHero ? "emerald" : "jungle";

  // Vibrant sunset/night stage — dark palm silhouettes glowing against a
  // tropical sunset. Used for immersive sections (e.g. testimonials).
  if (variant === "night") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 tropical-sunset" />

        {/* Setting sun */}
        <div className="absolute left-1/2 top-[42%] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-tropical-yellow via-tropical-orange to-flamingo opacity-70 blur-2xl animate-sun" />
        <div className="absolute left-1/2 top-[46%] h-44 w-44 -translate-x-1/2 rounded-full bg-tropical-yellow/80 blur-xl" />

        {/* Warm shimmering bokeh */}
        <Bokeh
          pos={{ top: "20%", left: "16%" }}
          size="12rem"
          color="rgba(255,170,90,0.4)"
        />
        <Bokeh
          pos={{ top: "30%", left: "72%" }}
          size="10rem"
          color="rgba(255,107,157,0.4)"
          delay="2s"
          anim="animate-drift"
        />

        {/* Palm silhouettes framing the scene */}
        <PlacedLeaf
          size="30rem"
          pos={{ bottom: "-9rem", left: "-7rem" }}
          rotate={20}
          origin="30% 100%"
          opacity={0.95}
        >
          <Frond type="palm" palette="silhouette" showVein={false} />
        </PlacedLeaf>
        <PlacedLeaf
          size="26rem"
          pos={{ bottom: "-8rem", left: "18%" }}
          rotate={-8}
          origin="40% 100%"
          blur={1}
          opacity={0.85}
          sway="animate-sway-slow"
        >
          <Frond type="palm" palette="silhouette" showVein={false} />
        </PlacedLeaf>
        <PlacedLeaf
          size="32rem"
          pos={{ bottom: "-10rem", right: "-8rem" }}
          rotate={-22}
          origin="70% 100%"
          opacity={0.95}
          sway="animate-sway-slow"
        >
          <Frond type="palm" palette="silhouette" showVein={false} />
        </PlacedLeaf>
        <PlacedLeaf
          size="22rem"
          pos={{ top: "-5rem", right: "10%" }}
          rotate={172}
          origin="60% 0%"
          blur={2}
          opacity={0.5}
          sway="animate-drift"
        >
          <Frond type="monstera" palette="silhouette" showVein={false} />
        </PlacedLeaf>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity: containerOpacity }}
      aria-hidden="true"
    >
      {/* Vibrant animated mesh */}
      <div className="absolute inset-0 tropical-aurora" />

      {/* Sun glow */}
      <div
        className={`absolute -top-28 end-[-5rem] h-80 w-80 rounded-full blur-2xl animate-sun ${
          onHero
            ? "bg-gradient-to-br from-tropical-yellow via-tropical-orange to-flamingo"
            : "bg-gradient-to-br from-tropical-yellow/80 via-tropical-orange/70 to-flamingo/60"
        }`}
      />

      {/* Sunlight bokeh — soft, blurred light orbs */}
      <Bokeh
        pos={{ top: "16%", left: "12%" }}
        size="11rem"
        color="rgba(255,213,79,0.45)"
        delay="0s"
      />
      <Bokeh
        pos={{ top: "55%", left: "70%" }}
        size="9rem"
        color="rgba(255,107,157,0.38)"
        delay="2.5s"
        anim="animate-drift"
      />
      <Bokeh
        pos={{ top: "70%", left: "22%" }}
        size="8rem"
        color="rgba(38,198,218,0.4)"
        delay="1.4s"
      />

      {/* Foliage composition — layered for depth */}
      <PlacedLeaf
        size="20rem"
        pos={{ bottom: "-6rem", left: "-5rem" }}
        rotate={-150}
        origin="30% 100%"
        blur={4}
        opacity={onHero ? 0.4 : 0.3}
        sway="animate-sway-slow"
      >
        <Frond type="palm" palette={leafPalette} />
      </PlacedLeaf>

      <PlacedLeaf
        size="23rem"
        pos={{ top: "-4rem", left: "-5rem" }}
        rotate={26}
        origin="32% 0%"
        opacity={onHero ? 0.85 : 0.7}
      >
        <Frond type="palm" palette={leafPalette} />
      </PlacedLeaf>

      <PlacedLeaf
        size="20rem"
        pos={{ top: "-3.5rem", right: "-4rem" }}
        rotate={-18}
        origin="62% 0%"
        blur={1}
        opacity={onHero ? 0.7 : 0.55}
        sway="animate-sway-slow"
      >
        <Frond type="monstera" palette={leafPalette} />
      </PlacedLeaf>

      <PlacedLeaf
        size="26rem"
        pos={{ bottom: "-7rem", right: "-7rem" }}
        rotate={168}
        origin="70% 100%"
        opacity={onHero ? 0.8 : 0.62}
      >
        <Frond type="palm" palette={leafPalette} />
      </PlacedLeaf>

      {/* Coral accent fan for vibrancy */}
      <PlacedLeaf
        size="14rem"
        pos={{ top: "38%", right: "-3rem" }}
        rotate={-95}
        origin="80% 50%"
        blur={2}
        opacity={onHero ? 0.45 : 0.32}
        sway="animate-drift"
      >
        <Frond type="fan" palette="coral" showVein={false} />
      </PlacedLeaf>
    </div>
  );
}

/* ===== Time-of-day global stage ===== */

const PERIOD_CONFIG = {
  morning: {
    leaf: "emerald",
    accent: "gold",
    ocean: {
      body: "linear-gradient(to top, rgba(38,160,190,0.5), rgba(125,224,209,0.12))",
      back: "#26a0be",
      mid: "#1d8fb5",
      front: "#0f6f96",
      foam: "rgba(255,255,255,0.5)",
    },
    glitter: "rgba(255,224,150,0.5)",
  },
  afternoon: {
    leaf: "jungle",
    accent: "coral",
    ocean: {
      body: "linear-gradient(to top, rgba(20,150,200,0.55), rgba(38,198,218,0.12))",
      back: "#22a6c8",
      mid: "#1488b8",
      front: "#0d6699",
      foam: "rgba(255,255,255,0.55)",
    },
    glitter: "rgba(255,255,255,0.5)",
  },
  evening: {
    leaf: "jungle",
    accent: "coral",
    ocean: {
      body: "linear-gradient(to top, rgba(140,70,120,0.5), rgba(255,138,80,0.12))",
      back: "#b5617f",
      mid: "#8f5378",
      front: "#5e3a6a",
      foam: "rgba(255,210,180,0.5)",
    },
    glitter: "rgba(255,170,110,0.55)",
  },
  night: {
    leaf: "emerald",
    accent: "coral",
    ocean: {
      body: "linear-gradient(to top, rgba(10,40,70,0.7), rgba(20,60,90,0.2))",
      back: "#123450",
      mid: "#0d2740",
      front: "#081d32",
      foam: "rgba(150,190,230,0.35)",
    },
    glitter: "rgba(190,215,255,0.4)",
  },
};

function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        top: `${(i * 37) % 60}%`,
        left: `${(i * 53) % 100}%`,
        size: 1 + ((i * 7) % 3),
        delay: `${(i % 6) * 0.6}s`,
        dur: `${2.4 + (i % 4) * 0.8}s`,
      })),
    [],
  );
  return (
    <>
      {/* Moon */}
      <div className="absolute left-[16%] top-[14%]">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-white via-[#fdf3da] to-[#e7d6b0] opacity-90 shadow-[0_0_70px_25px_rgba(255,248,220,0.45)]" />
      </div>
      {/* Stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}
    </>
  );
}

/**
 * App-wide ambient background that shifts with the time of day:
 * sunrise → vivid afternoon → golden hour → moonlit night.
 * Rendered once (fixed, behind all content) so every page feels alive.
 */
export function GlobalBackground() {
  const { period, isNight } = useTimeTheme();
  const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG.afternoon;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      data-period={period}
    >
      {/* Time-based gradient wash (kept luminous in the centre for legibility) */}
      <div className={`absolute inset-0 global-wash global-wash--${period}`} />

      {/* Animated shimmer overlay */}
      <div
        className="absolute inset-0 tropical-aurora"
        style={{ opacity: isNight ? 0.25 : 0.45 }}
      />

      {isNight && <NightSky />}

      {/* Real layered sea along the foot of the page */}
      <Ocean palette={cfg.ocean} />
      <SeaGlitter color={cfg.glitter} left={isNight ? "18%" : "82%"} />

      {/* Sunlight / moonlight bokeh */}
      <Bokeh
        pos={{ top: "18%", left: "10%" }}
        size="13rem"
        color={isNight ? "rgba(120,180,255,0.22)" : "rgba(255,213,79,0.4)"}
      />
      <Bokeh
        pos={{ top: "58%", left: "74%" }}
        size="11rem"
        color={isNight ? "rgba(217,70,160,0.28)" : "rgba(255,107,157,0.34)"}
        delay="2.5s"
        anim="animate-drift"
      />
      <Bokeh
        pos={{ bottom: "12%", left: "18%" }}
        size="9rem"
        color={isNight ? "rgba(38,198,218,0.2)" : "rgba(38,198,218,0.32)"}
        delay="1.3s"
      />

      {/* Foliage frame */}
      <PlacedLeaf
        size="24rem"
        pos={{ top: "-5rem", left: "-6rem" }}
        rotate={24}
        origin="32% 0%"
        opacity={isNight ? 0.6 : 0.62}
        sway="animate-sway-slow"
      >
        <Frond type="palm" palette={isNight ? "silhouette" : cfg.leaf} />
      </PlacedLeaf>

      <PlacedLeaf
        size="20rem"
        pos={{ top: "-3rem", right: "-4rem" }}
        rotate={-18}
        origin="62% 0%"
        blur={1}
        opacity={isNight ? 0.5 : 0.5}
        sway="animate-sway"
      >
        <Frond type="monstera" palette={isNight ? "silhouette" : cfg.leaf} />
      </PlacedLeaf>

      <PlacedLeaf
        size="27rem"
        pos={{ bottom: "-8rem", right: "-7rem" }}
        rotate={170}
        origin="70% 100%"
        opacity={isNight ? 0.7 : 0.55}
        sway="animate-sway-slow"
      >
        <Frond type="palm" palette={isNight ? "silhouette" : cfg.leaf} />
      </PlacedLeaf>

      <PlacedLeaf
        size="22rem"
        pos={{ bottom: "-7rem", left: "-7rem" }}
        rotate={-150}
        origin="30% 100%"
        blur={3}
        opacity={isNight ? 0.5 : 0.4}
        sway="animate-drift"
      >
        <Frond type="palm" palette={isNight ? "silhouette" : cfg.leaf} />
      </PlacedLeaf>

      {!isNight && (
        <PlacedLeaf
          size="13rem"
          pos={{ top: "40%", right: "-3rem" }}
          rotate={-95}
          origin="80% 50%"
          blur={2}
          opacity={0.3}
          sway="animate-drift"
        >
          <Frond type="fan" palette={cfg.accent} showVein={false} />
        </PlacedLeaf>
      )}

      {/* ===== Ocean & sky scene ===== */}
      {isNight ? (
        <>
          {/* Bioluminescent jellyfish drifting up */}
          <Drifter
            pos={{ left: "20%", bottom: "6%" }}
            width="3.5rem"
            anim="animate-ascend"
            duration="22s"
            opacity={0.8}
          >
            <Jellyfish glow="#8fd4ff" />
          </Drifter>
          <Drifter
            pos={{ left: "66%", bottom: "0%" }}
            width="2.75rem"
            anim="animate-ascend"
            duration="28s"
            delay="7s"
            opacity={0.7}
            blur={0.5}
          >
            <Jellyfish glow="#c79bff" />
          </Drifter>

          {/* Moonlit sailboat */}
          <div
            className="absolute bottom-[17%] right-[12%] w-20 animate-bob"
            style={{ opacity: 0.6 }}
            aria-hidden="true"
          >
            <Sailboat sail="rgba(220,230,255,0.5)" hull="rgba(8,20,34,0.85)" />
          </div>

          {/* Seaweed silhouettes swaying */}
          <div
            className="absolute bottom-0 left-[8%] h-56 w-20 animate-sway"
            style={{ opacity: 0.5 }}
            aria-hidden="true"
          >
            <Kelp color="rgba(9,38,44,0.85)" />
          </div>
          <div
            className="absolute bottom-0 right-[26%] h-44 w-16 animate-sway-slow"
            style={{ opacity: 0.45 }}
            aria-hidden="true"
          >
            <Kelp color="rgba(9,38,44,0.8)" />
          </div>
        </>
      ) : (
        <>
          {/* Gliding seabirds */}
          <Drifter
            pos={{ top: "13%" }}
            width="3.25rem"
            anim="animate-glide"
            duration="36s"
            opacity={0.5}
          >
            <SeaBird />
          </Drifter>
          <Drifter
            pos={{ top: "19%" }}
            width="2.4rem"
            anim="animate-glide"
            duration="48s"
            delay="9s"
            opacity={0.4}
          >
            <SeaBird />
          </Drifter>

          {/* Parasailer gliding over the bay */}
          <Drifter
            pos={{ top: "15%" }}
            width="5.25rem"
            anim="animate-glide"
            duration="62s"
            delay="4s"
            opacity={0.68}
          >
            <Parasail canopy={cfg.accent === "gold" ? "#ffce5a" : "#ff6b9d"} />
          </Drifter>

          {/* Sailboat bobbing on the horizon */}
          <div
            className="absolute top-[46%] right-[9%] w-20 animate-bob"
            style={{ opacity: 0.5 }}
            aria-hidden="true"
          >
            <Sailboat />
          </div>

          {/* Swaying seaweed near the seabed */}
          <div
            className="absolute bottom-0 left-[10%] h-48 w-16 animate-sway"
            style={{ opacity: 0.3 }}
            aria-hidden="true"
          >
            <Kelp color="rgba(15,122,92,0.45)" />
          </div>
          <div
            className="absolute bottom-0 right-[28%] h-40 w-14 animate-sway-slow"
            style={{ opacity: 0.28 }}
            aria-hidden="true"
          >
            <Kelp color="rgba(38,150,130,0.4)" />
          </div>

          {/* Rising bubbles */}
          <Bubbles tint="rgba(38,198,218,0.4)" origin="left" />
        </>
      )}
    </div>
  );
}
