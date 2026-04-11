import { useState, useRef, useEffect, useCallback } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const HUGR_NODES = [
  { id: 0,  op: "Module",        parent: null },
  { id: 1,  op: "FuncDefn",      name: "None.main",  parent: 0 },
  { id: 2,  op: "Input",         parent: 1,  types: [] },
  { id: 3,  op: "Output",        parent: 1,  types: [] },
  { id: 4,  op: "CFG",           parent: 1,  sig: "[] → []" },
  { id: 5,  op: "DataflowBlock", parent: 4 },
  { id: 6,  op: "Input",         parent: 5,  types: [] },
  { id: 7,  op: "Output",        parent: 5,  types: ["Sum·Unit(1)"] },
  { id: 8,  op: "ExitBlock",     parent: 4 },
  { id: 9,  op: "FuncDefn",      name: "None.bell", parent: 0 },
  { id: 10, op: "Input",         parent: 9,  types: [] },
  { id: 11, op: "Output",        parent: 9,  types: ["Q", "Q"] },
  { id: 12, op: "Call",          parent: 5,  target: "None.bell", sig: "[] → [Q, Q]" },
  { id: 13, op: "MakeTuple",     parent: 5,  ext: "prelude",       types: "[Q, Q]" },
  { id: 14, op: "UnpackTuple",   parent: 5,  ext: "prelude",       types: "[Q, Q]" },
  { id: 15, op: "MeasureFree",   parent: 5,  ext: "tket.quantum",  sig: "Q → bool" },
  { id: 16, op: "MeasureFree",   parent: 5,  ext: "tket.quantum",  sig: "Q → bool" },
  { id: 17, op: "Tag",           parent: 5,  tag: 0 },
  { id: 18, op: "CFG",           parent: 9,  sig: "[] → [Q, Q]" },
  { id: 19, op: "DataflowBlock", parent: 18 },
  { id: 20, op: "Input",         parent: 19, types: [] },
  { id: 21, op: "Output",        parent: 19, types: ["Sum·Unit(1)", "Q", "Q"] },
  { id: 22, op: "ExitBlock",     parent: 18 },
  { id: 23, op: "QAlloc",        parent: 19, ext: "tket.quantum",  sig: "→ Q" },
  { id: 24, op: "QAlloc",        parent: 19, ext: "tket.quantum",  sig: "→ Q" },
  { id: 25, op: "MakeTuple",     parent: 19, ext: "prelude",       types: "[Q, Q]" },
  { id: 26, op: "UnpackTuple",   parent: 19, ext: "prelude",       types: "[Q, Q]" },
  { id: 27, op: "H",             parent: 19, ext: "tket.quantum",  sig: "Q → Q" },
  { id: 28, op: "MakeTuple",     parent: 19, ext: "prelude",       types: "[]" },
  { id: 29, op: "CX",            parent: 19, ext: "tket.quantum",  sig: "[Q, Q] → [Q, Q]" },
  { id: 30, op: "MakeTuple",     parent: 19, ext: "prelude",       types: "[]" },
  { id: 31, op: "MakeTuple",     parent: 19, ext: "prelude",       types: "[Q, Q]" },
  { id: 32, op: "UnpackTuple",   parent: 19, ext: "prelude",       types: "[Q, Q]" },
  { id: 33, op: "Tag",           parent: 19, tag: 0 },
];

// ─── Colour system ───────────────────────────────────────────────────────────

const PALETTES = {
  container:  { bg: "#0d1117", fill: "#161b22", stroke: "#30363d", text: "#e6edf3", badge: "#1f6feb" },
  flow:       { fill: "#0d2136", stroke: "#1f6feb", text: "#79c0ff", badge: "#1f6feb" },
  quantum:    { fill: "#0a1f1a", stroke: "#3fb950", text: "#56d364", badge: "#238636" },
  data:       { fill: "#1a1400", stroke: "#d29922", text: "#e3b341", badge: "#9e6a03" },
  io:         { fill: "#161b22", stroke: "#484f58", text: "#8b949e", badge: "#30363d" },
};

function nodeCategory(op) {
  if (["Module", "FuncDefn"].includes(op)) return "container";
  if (["CFG", "DataflowBlock", "ExitBlock"].includes(op)) return "flow";
  if (["QAlloc", "H", "CX", "MeasureFree"].includes(op)) return "quantum";
  if (["MakeTuple", "UnpackTuple", "Tag", "Call"].includes(op)) return "data";
  return "io";
}

function palette(op) { return PALETTES[nodeCategory(op)]; }

// ─── Layouts ─────────────────────────────────────────────────────────────────

const W = 680;

const LAYOUTS = {
  all: {
    title: "Module overview",
    nodes: [
      { id: 0,  x: 265, y: 14,  w: 150, h: 36 },
      { id: 1,  x: 60,  y: 90,  w: 150, h: 36 },
      { id: 4,  x: 60,  y: 160, w: 100, h: 30 },
      { id: 5,  x: 20,  y: 220, w: 110, h: 30 },
      { id: 12, x: 20,  y: 280, w: 110, h: 30 },
      { id: 15, x: 20,  y: 336, w: 105, h: 30 },
      { id: 16, x: 140, y: 336, w: 105, h: 30 },
      { id: 9,  x: 450, y: 90,  w: 160, h: 36 },
      { id: 18, x: 460, y: 160, w: 100, h: 30 },
      { id: 19, x: 400, y: 220, w: 115, h: 30 },
      { id: 23, x: 350, y: 280, w: 80,  h: 30 },
      { id: 24, x: 445, y: 280, w: 80,  h: 30 },
      { id: 27, x: 350, y: 336, w: 60,  h: 30 },
      { id: 29, x: 430, y: 336, w: 60,  h: 30 },
    ],
    edges: [
      [0, 1], [0, 9], [1, 4], [4, 5], [5, 12], [12, 15], [12, 16],
      [9, 18], [18, 19], [19, 23], [19, 24], [23, 27], [24, 29],
    ],
  },
  main: {
    title: "None.main",
    nodes: [
      { id: 1,  x: 230, y: 12,  w: 160, h: 36 },
      { id: 2,  x: 60,  y: 76,  w: 80,  h: 30 },
      { id: 3,  x: 500, y: 76,  w: 80,  h: 30 },
      { id: 4,  x: 215, y: 76,  w: 80,  h: 30 },
      { id: 5,  x: 140, y: 140, w: 120, h: 30 },
      { id: 6,  x: 30,  y: 210, w: 80,  h: 30 },
      { id: 7,  x: 510, y: 210, w: 80,  h: 30 },
      { id: 8,  x: 380, y: 140, w: 90,  h: 30 },
      { id: 12, x: 90,  y: 280, w: 100, h: 30 },
      { id: 13, x: 205, y: 280, w: 100, h: 30 },
      { id: 14, x: 320, y: 280, w: 100, h: 30 },
      { id: 15, x: 175, y: 350, w: 100, h: 30 },
      { id: 16, x: 295, y: 350, w: 100, h: 30 },
      { id: 17, x: 435, y: 280, w: 70,  h: 30 },
    ],
    edges: [
      [1, 2], [1, 3], [1, 4], [4, 5], [4, 8], [5, 6], [5, 7],
      [5, 12], [12, 13], [13, 14], [12, 15], [14, 15], [15, 16], [17, 7],
    ],
  },
  bell: {
    title: "None.bell",
    nodes: [
      { id: 9,  x: 230, y: 12,  w: 160, h: 36 },
      { id: 10, x: 60,  y: 76,  w: 80,  h: 30 },
      { id: 11, x: 500, y: 76,  w: 80,  h: 30 },
      { id: 18, x: 215, y: 76,  w: 80,  h: 30 },
      { id: 19, x: 130, y: 140, w: 130, h: 30 },
      { id: 20, x: 30,  y: 210, w: 80,  h: 30 },
      { id: 21, x: 510, y: 210, w: 80,  h: 30 },
      { id: 22, x: 370, y: 140, w: 90,  h: 30 },
      { id: 23, x: 50,  y: 280, w: 80,  h: 30 },
      { id: 24, x: 150, y: 280, w: 80,  h: 30 },
      { id: 25, x: 250, y: 280, w: 90,  h: 30 },
      { id: 26, x: 360, y: 280, w: 100, h: 30 },
      { id: 27, x: 110, y: 350, w: 60,  h: 30 },
      { id: 29, x: 185, y: 350, w: 60,  h: 30 },
      { id: 31, x: 270, y: 350, w: 90,  h: 30 },
      { id: 32, x: 375, y: 350, w: 100, h: 30 },
      { id: 33, x: 490, y: 280, w: 60,  h: 30 },
      { id: 28, x: 50,  y: 350, w: 55,  h: 30 },
    ],
    edges: [
      [9, 10], [9, 11], [9, 18], [18, 19], [18, 22], [19, 20], [19, 21],
      [19, 23], [19, 24], [23, 25], [24, 25], [25, 26], [26, 27], [27, 29],
      [26, 29], [29, 31], [29, 32], [31, 32], [33, 21], [18, 11],
    ],
  },
};

// ─── Canvas renderer ─────────────────────────────────────────────────────────

function drawGraph(canvas, layout, selectedId, hoverNodeId) {
  const dpr = window.devicePixelRatio || 1;
  const W_px = canvas.clientWidth;
  const H_px = canvas.clientHeight;
  canvas.width = W_px * dpr;
  canvas.height = H_px * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W_px, H_px);

  const nodeMap = Object.fromEntries(HUGR_NODES.map(n => [n.id, n]));

  // Edges
  for (const [aId, bId] of layout.edges) {
    const a = layout.nodes.find(n => n.id === aId);
    const b = layout.nodes.find(n => n.id === bId);
    if (!a || !b) continue;
    const ax = a.x + a.w / 2, ay = a.y + a.h;
    const bx = b.x + b.w / 2, by = b.y;
    const midY = (ay + by) / 2;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.bezierCurveTo(ax, midY, bx, midY, bx, by);
    ctx.strokeStyle = "rgba(110,118,129,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // arrowhead
    ctx.beginPath();
    const tip = by, tipX = bx;
    ctx.moveTo(tipX - 5, tip - 8);
    ctx.lineTo(tipX, tip - 1);
    ctx.lineTo(tipX + 5, tip - 8);
    ctx.strokeStyle = "rgba(110,118,129,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Nodes
  for (const pos of layout.nodes) {
    const n = nodeMap[pos.id];
    if (!n) continue;
    const pal = palette(n.op);
    const isSel = selectedId === pos.id;
    const isHov = hoverNodeId === pos.id;

    // shadow glow on hover/select
    if (isSel || isHov) {
      ctx.save();
      ctx.shadowColor = pal.stroke;
      ctx.shadowBlur = isSel ? 14 : 8;
      ctx.beginPath();
      roundRect(ctx, pos.x, pos.y, pos.w, pos.h, 6);
      ctx.fillStyle = pal.fill;
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    roundRect(ctx, pos.x, pos.y, pos.w, pos.h, 6);
    ctx.fillStyle = pal.fill;
    ctx.fill();
    ctx.strokeStyle = isSel ? pal.stroke : isHov ? pal.stroke + "bb" : pal.stroke + "66";
    ctx.lineWidth = isSel ? 1.5 : 0.75;
    ctx.stroke();

    // left accent bar
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(pos.x, pos.y + 6, 3, pos.h - 12, 2)
      : roundRect(ctx, pos.x, pos.y + 6, 3, pos.h - 12, 2);
    ctx.fillStyle = pal.stroke;
    ctx.fill();

    // label
    const label = shortLabel(n);
    ctx.fillStyle = pal.text;
    ctx.font = `${isSel ? "500" : "400"} 11px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      label.length > 15 ? label.slice(0, 14) + "…" : label,
      pos.x + pos.w / 2 + 2,
      pos.y + pos.h / 2,
    );
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function shortLabel(n) {
  if (n.op === "FuncDefn") return n.name || "FuncDefn";
  if (n.op === "Call") return "call: bell";
  return n.op;
}

function hitTest(layout, gx, gy) {
  for (const pos of layout.nodes) {
    if (gx >= pos.x && gx <= pos.x + pos.w && gy >= pos.y && gy <= pos.y + pos.h) {
      return pos.id;
    }
  }
  return null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CategoryBadge({ op }) {
  const cat = nodeCategory(op);
  const labels = { container: "container", flow: "flow", quantum: "quantum", data: "data", io: "i/o" };
  const colors = {
    container: { bg: "#1f2d3d", color: "#79c0ff" },
    flow:      { bg: "#1f2d3d", color: "#1f6feb" },
    quantum:   { bg: "#0a2a1a", color: "#3fb950" },
    data:      { bg: "#2a1e00", color: "#d29922" },
    io:        { bg: "#1c2128", color: "#8b949e" },
  };
  const c = colors[cat];
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 4,
      background: c.bg, color: c.color,
      fontFamily: '"JetBrains Mono", monospace',
      border: `0.5px solid ${c.color}44`,
      letterSpacing: "0.04em",
    }}>
      {labels[cat]}
    </span>
  );
}

function DetailPanel({ nodeId }) {
  if (!nodeId) {
    return (
      <div style={{ padding: "14px 16px", color: "#484f58", fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
        — click a node to inspect —
      </div>
    );
  }
  const n = HUGR_NODES.find(x => x.id === nodeId);
  if (!n) return null;
  const pal = palette(n.op);
  const rows = [
    ["node id", n.id],
    ["op", n.op],
    n.name   ? ["name",      n.name]   : null,
    n.ext    ? ["extension", n.ext]    : null,
    n.sig    ? ["signature", n.sig]    : null,
    n.target ? ["calls",     n.target] : null,
    n.types  ? ["types",     Array.isArray(n.types) ? (n.types.join(", ") || "(none)") : n.types] : null,
    n.tag !== undefined ? ["tag", n.tag] : null,
    ["parent id", n.parent !== null ? n.parent : "(root)"],
  ].filter(Boolean);

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, fontSize: 13, color: pal.text }}>
          {shortLabel(n)}
        </span>
        <CategoryBadge op={n.op} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: "4px 12px" }}>
        {rows.map(([k, v]) => (
          <>
            <span key={k + "k"} style={{ fontSize: 11, color: "#6e7681", fontFamily: '"JetBrains Mono", monospace' }}>{k}</span>
            <span key={k + "v"} style={{ fontSize: 11, color: "#c9d1d9", fontFamily: '"JetBrains Mono", monospace', wordBreak: "break-all" }}>{String(v)}</span>
          </>
        ))}
      </div>
    </div>
  );
}

function Tooltip({ node, x, y, visible }) {
  if (!node || !visible) return null;
  const pal = palette(node.op);
  return (
    <div style={{
      position: "absolute", left: x + 12, top: y + 12,
      background: "#0d1117", border: `0.5px solid ${pal.stroke}88`,
      borderRadius: 6, padding: "8px 12px", fontSize: 11,
      fontFamily: '"JetBrains Mono", monospace',
      color: "#c9d1d9", pointerEvents: "none", zIndex: 20,
      maxWidth: 200,
    }}>
      <div style={{ fontWeight: 500, color: pal.text, marginBottom: 4 }}>{shortLabel(node)}</div>
      {node.ext && <div style={{ color: "#6e7681" }}>ext: <span style={{ color: "#c9d1d9" }}>{node.ext}</span></div>}
      {node.sig && <div style={{ color: "#6e7681" }}>sig: <span style={{ color: "#c9d1d9" }}>{node.sig}</span></div>}
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

const LEGEND = [
  { cat: "container", label: "Container",   color: "#1f6feb" },
  { cat: "flow",      label: "Flow ctrl",   color: "#388bfd" },
  { cat: "quantum",   label: "Quantum op",  color: "#3fb950" },
  { cat: "data",      label: "Data op",     color: "#d29922" },
  { cat: "io",        label: "I/O",         color: "#6e7681" },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function HUGRVisualizer() {
  const [view, setView] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [tooltip, setTooltip] = useState({ node: null, x: 0, y: 0, visible: false });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const layout = LAYOUTS[view];

  // Redraw whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W_px = canvas.clientWidth;
    const H_px = canvas.clientHeight;
    canvas.width = W_px * dpr;
    canvas.height = H_px * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W_px, H_px);
    ctx.save();
    ctx.translate(pan.x + 20, pan.y + 20);
    ctx.scale(zoom, zoom);
    drawGraph(canvas, layout, selectedId, hoverNodeId);
    ctx.restore();

    // Redo with transform applied properly
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W_px, H_px);
    ctx.save();
    ctx.translate(pan.x + 20, pan.y + 20);
    ctx.scale(zoom, zoom);

    const nodeMap = Object.fromEntries(HUGR_NODES.map(n => [n.id, n]));

    // Edges
    for (const [aId, bId] of layout.edges) {
      const a = layout.nodes.find(n => n.id === aId);
      const b = layout.nodes.find(n => n.id === bId);
      if (!a || !b) continue;
      const ax = a.x + a.w / 2, ay = a.y + a.h;
      const bx = b.x + b.w / 2, by = b.y;
      const midY = (ay + by) / 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.bezierCurveTo(ax, midY, bx, midY, bx, by);
      ctx.strokeStyle = "rgba(110,118,129,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // arrowhead
      ctx.beginPath();
      ctx.moveTo(bx - 5, by - 8);
      ctx.lineTo(bx, by - 1);
      ctx.lineTo(bx + 5, by - 8);
      ctx.strokeStyle = "rgba(110,118,129,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Nodes
    for (const pos of layout.nodes) {
      const n = nodeMap[pos.id];
      if (!n) continue;
      const pal = palette(n.op);
      const isSel = selectedId === pos.id;
      const isHov = hoverNodeId === pos.id;

      if (isSel || isHov) {
        ctx.save();
        ctx.shadowColor = pal.stroke;
        ctx.shadowBlur = isSel ? 16 : 9;
        ctx.beginPath();
        roundRect(ctx, pos.x, pos.y, pos.w, pos.h, 6);
        ctx.fillStyle = pal.fill;
        ctx.fill();
        ctx.restore();
      }

      ctx.beginPath();
      roundRect(ctx, pos.x, pos.y, pos.w, pos.h, 6);
      ctx.fillStyle = pal.fill;
      ctx.fill();
      ctx.strokeStyle = isSel ? pal.stroke : isHov ? pal.stroke + "bb" : pal.stroke + "55";
      ctx.lineWidth = isSel ? 1.5 : 0.75;
      ctx.stroke();

      // accent bar
      ctx.beginPath();
      roundRect(ctx, pos.x, pos.y + 6, 3, pos.h - 12, 2);
      ctx.fillStyle = pal.stroke;
      ctx.fill();

      // label
      const label = shortLabel(n);
      ctx.fillStyle = isSel ? "#ffffff" : pal.text;
      ctx.font = `${isSel ? "500" : "400"} 11px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        label.length > 15 ? label.slice(0, 14) + "…" : label,
        pos.x + pos.w / 2 + 2,
        pos.y + pos.h / 2,
      );
    }

    ctx.restore();
  }, [view, selectedId, hoverNodeId, zoom, pan, layout]);

  const graphCoords = useCallback((clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x - 20) / zoom,
      y: (clientY - rect.top  - pan.y - 20) / zoom,
    };
  }, [pan, zoom]);

  const handleMouseMove = useCallback((e) => {
    if (dragging.current) {
      setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
    const g = graphCoords(e.clientX, e.clientY);
    const h = hitTest(layout, g.x, g.y);
    setHoverNodeId(h);
    if (h !== null) {
      const rect = wrapRef.current.getBoundingClientRect();
      setTooltip({
        node: HUGR_NODES.find(n => n.id === h),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    } else {
      setTooltip(t => ({ ...t, visible: false }));
    }
  }, [graphCoords, layout]);

  const handleMouseDown = useCallback((e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback((e) => {
    dragging.current = false;
    const g = graphCoords(e.clientX, e.clientY);
    const h = hitTest(layout, g.x, g.y);
    if (h !== null) setSelectedId(h);
  }, [graphCoords, layout]);

  const handleMouseLeave = useCallback(() => {
    dragging.current = false;
    setHoverNodeId(null);
    setTooltip(t => ({ ...t, visible: false }));
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  }, []);

  const switchView = (v) => {
    setView(v);
    setSelectedId(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const root = {
    background: "#010409",
    borderRadius: 10,
    overflow: "hidden",
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    border: "0.5px solid #30363d",
    minWidth: 0,
  };

  const header = {
    background: "#0d1117",
    borderBottom: "0.5px solid #21262d",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  };

  const dotStyle = (color) => ({
    width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
  });

  const tabBtn = (active) => ({
    fontSize: 11, padding: "3px 10px", borderRadius: 4, cursor: "pointer",
    border: `0.5px solid ${active ? "#388bfd" : "#30363d"}`,
    background: active ? "#1f2d3d" : "transparent",
    color: active ? "#79c0ff" : "#8b949e",
    transition: "all 0.15s",
    letterSpacing: "0.03em",
  });

  const iconBtn = {
    fontSize: 11, padding: "3px 8px", borderRadius: 4, cursor: "pointer",
    border: "0.5px solid #30363d", background: "transparent", color: "#6e7681",
  };

  const canvasWrap = {
    position: "relative",
    background: "#010409",
    cursor: hoverNodeId !== null ? "pointer" : dragging.current ? "grabbing" : "grab",
    borderBottom: "0.5px solid #21262d",
  };

  const legendBar = {
    display: "flex", gap: 14, padding: "7px 14px",
    borderBottom: "0.5px solid #21262d",
    background: "#0d1117",
    flexWrap: "wrap",
  };

  const detailPanel = {
    background: "#0d1117",
    minHeight: 56,
  };

  // Canvas grid dots background via CSS
  const gridBg = {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(circle, #21262d 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    opacity: 0.6,
  };

  return (
    <div style={root}>
      {/* Header / toolbar */}
      <div style={header}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 6 }}>
          <div style={dotStyle("#ff5f57")} />
          <div style={dotStyle("#febc2e")} />
          <div style={dotStyle("#28c840")} />
        </div>
        <span style={{ fontSize: 11, color: "#6e7681", marginRight: 8 }}>hugr-visualizer</span>
        {["all", "main", "bell"].map(v => (
          <button key={v} style={tabBtn(view === v)} onClick={() => switchView(v)}>
            {v === "all" ? "overview" : v === "main" ? "none.main" : "none.bell"}
          </button>
        ))}
        <button style={iconBtn} onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}>
          reset
        </button>
        <span style={{ fontSize: 11, color: "#484f58", marginLeft: "auto" }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Legend */}
      <div style={legendBar}>
        {LEGEND.map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#6e7681" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity: 0.8 }} />
            {label}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div ref={wrapRef} style={canvasWrap}>
        <div style={gridBg} />
        <Tooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} visible={tooltip.visible} />
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: 400 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />
      </div>

      {/* Detail panel */}
      <div style={detailPanel}>
        <DetailPanel nodeId={selectedId} />
      </div>
    </div>
  );
}
