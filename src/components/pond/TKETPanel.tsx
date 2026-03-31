// src/components/pond/TKETPanel.tsx
import { useState } from 'react';
import type { Program } from '../../data/programs';
import { highlightJson } from '../../utils/highlight';

type TKETData = Program['tket'];

interface Props {
  data: TKETData;
  isActive?: boolean;
  loading?: boolean;
}

function TKETSkeleton() {
  // Simulate a circuit with wires + gate blobs
  const nWires = 3;
  const ROW = 44, PAD_T = 20, PAD_L = 52, COL = 62;
  const W = PAD_L + 5 * COL + 32;
  const H = PAD_T + nWires * ROW + 28;
  const qy = (i: number) => PAD_T + i * ROW + ROW / 2;
  const gx = (c: number) => PAD_L + c * COL + COL / 2;
  // gate positions to sketch
  const gates = [
    { col: 0, q: 0 }, { col: 0, q: 2 },
    { col: 1, q: 0 }, { col: 1, q: 1 },
    { col: 2, q: 1 }, { col: 2, q: 2 },
    { col: 3, q: 0 }, { col: 3, q: 1 }, { col: 3, q: 2 },
  ];
  return (
    <div className="tket-skeleton">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: 200 }}>
        {Array.from({ length: nWires }, (_, i) => (
          <g key={i}>
            <line x1={PAD_L - 6} y1={qy(i)} x2={W - 12} y2={qy(i)}
              stroke="var(--border)" strokeWidth="1.5" strokeOpacity="0.6" />
            <rect x={4} y={qy(i) - 7} width={38} height={14} rx="3"
              fill="var(--bg3)" className="tket-skel-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          </g>
        ))}
        {gates.map((g, gi) => (
          <rect key={gi}
            x={gx(g.col) - 13} y={qy(g.q) - 11} width={26} height={22} rx="4"
            fill="var(--bg3)" className="tket-skel-pulse"
            style={{ animationDelay: `${gi * 50}ms` }} />
        ))}
      </svg>
      <div className="tket-skel-stats">
        {[50, 40, 34].map((w, i) => (
          <div key={i} className="tket-skel-stat tket-skel-pulse"
            style={{ width: w, animationDelay: `${i * 70}ms` }} />
        ))}
      </div>
    </div>
  );
}

const GATE_STYLES: Record<string, { fill: string; label: string }> = {
  H:       { fill: '#1a6b4a', label: 'H'   },
  CX:      { fill: '#4a80c8', label: '⊕'   },
  ZZMax:   { fill: '#c84040', label: 'ZZ'  },
  Rz:      { fill: '#c8a040', label: 'Rz'  },
  Measure: { fill: '#a040c8', label: 'M'   },
};

type TKETGate = TKETData['gates'][number];

function resolveGateColumns(input: TKETGate[]): TKETGate[] {
  const gates = input.map(g => ({ ...g }));
  let changed = true;
  while (changed) {
    changed = false;
    const passthroughs = new Set<string>();
    for (const g of gates) {
      if (g.type === 'CX' || g.type === 'ZZMax') {
        const minQ = Math.min(g.qubits[0], g.qubits[1]);
        const maxQ = Math.max(g.qubits[0], g.qubits[1]);
        for (let q = minQ + 1; q < maxQ; q++) passthroughs.add(`${g.col},${q}`);
      }
    }
    for (const g of gates) {
      if (g.type !== 'CX' && g.type !== 'ZZMax' && passthroughs.has(`${g.col},${g.qubits[0]}`)) {
        g.col += 1;
        changed = true;
      }
    }
  }
  return gates;
}

function CircuitSVG({ data, optimised }: { data: TKETData; optimised: boolean }) {
  const gates  = resolveGateColumns(optimised ? data.optimised.gates : data.gates);
  const nQ     = data.qubits.length;
  const ROW = 44, COL = 62, PAD_L = 52, PAD_T = 20;
  const maxCol = Math.max(...gates.map(g => g.col));
  const W = PAD_L + (maxCol + 1) * COL + 32;
  const H = PAD_T + nQ * ROW + 28;

  const qy = (i: number) => PAD_T + i * ROW + ROW / 2;
  const gx = (c: number) => PAD_L + c * COL + COL / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: 200 }}>
      {/* Wires */}
      {data.qubits.map((q, i) => (
        <g key={i}>
          <line x1={PAD_L - 6} y1={qy(i)} x2={W - 12} y2={qy(i)}
            stroke="#c0c8d0" strokeWidth="1.5" />
          <text x={PAD_L - 8} y={qy(i)} textAnchor="end" dominantBaseline="middle"
            fill="#6b7280" fontSize="10" fontFamily="'Fira Code',monospace">{q}</text>
        </g>
      ))}

      {/* Gates */}
      {gates.map((g, gi) => {
        const style = GATE_STYLES[g.type] || { fill: '#666', label: g.type };
        const x = gx(g.col);

        // Two-qubit gates
        if (g.type === 'CX' || g.type === 'ZZMax') {
          const y0 = qy(g.qubits[0]), y1 = qy(g.qubits[1]);
          const lineColor = g.native ? '#c84040' : '#4a80c8';
          const minQ = Math.min(g.qubits[0], g.qubits[1]);
          const maxQ = Math.max(g.qubits[0], g.qubits[1]);
          const skippedQubits = Array.from({ length: maxQ - minQ - 1 }, (_, k) => minQ + k + 1);
          return (
            <g key={gi}>
              <line x1={x} y1={y0} x2={x} y2={y1}
                stroke={lineColor} strokeWidth="1.5" />
              {skippedQubits.map(qi => (
                <circle key={qi} cx={x} cy={qy(qi)} r={5}
                  fill="var(--bg1)" stroke={lineColor} strokeWidth="1.5" />
              ))}
              {g.type === 'CX' ? (
                <>
                  <circle cx={x} cy={y0} r={6} fill="#4a80c8" />
                  <circle cx={x} cy={y1} r={13} fill="none"
                    stroke="#4a80c8" strokeWidth="1.5" />
                  <line x1={x-10} y1={y1} x2={x+10} y2={y1}
                    stroke="#4a80c8" strokeWidth="1.5"/>
                  <line x1={x} y1={y1-10} x2={x} y2={y1+10}
                    stroke="#4a80c8" strokeWidth="1.5"/>
                </>
              ) : (
                <>
                  {[y0, y1].map((yy, ii) => (
                    <g key={ii}>
                      <rect x={x-14} y={yy-10} width={28} height={20} rx="4"
                        fill="#c8404028" stroke="#c84040" strokeWidth="1.5"/>
                      <text x={x} y={yy} textAnchor="middle" dominantBaseline="middle"
                        fill="#c84040" fontSize="8" fontWeight="700"
                        fontFamily="'Fira Code',monospace">ZZMax</text>
                    </g>
                  ))}
                </>
              )}
            </g>
          );
        }

        // Single-qubit gates
        const y = qy(g.qubits[0]);
        const isMeasure = g.type === 'Measure';
        return (
          <g key={gi}>
            <rect x={x-13} y={y-11} width={26} height={22} rx="4"
              fill={style.fill + '28'} stroke={style.fill} strokeWidth="1.5" />
            {isMeasure ? (
              <>
                <path d={`M ${x-7} ${y+3} Q ${x} ${y-6} ${x+7} ${y+3}`}
                  fill="none" stroke="#a040c8" strokeWidth="1.5"/>
                <line x1={x} y1={y+3} x2={x+6} y2={y-4}
                  stroke="#a040c8" strokeWidth="1.5"/>
              </>
            ) : (
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                fill={style.fill} fontSize="10" fontWeight="700"
                fontFamily="'Fira Code',monospace">{style.label}</text>
            )}
            {g.native && (
              <circle cx={x+12} cy={y-10} r={3} fill="#c84040" />
            )}
          </g>
        );
      })}

      {/* Time markers */}
      {Array.from({ length: maxCol + 1 }, (_, c) => (
        <text key={c} x={gx(c)} y={H - 6} textAnchor="middle"
          fill="#9ca3af" fontSize="8" fontFamily="'Fira Code',monospace">
          t{c}
        </text>
      ))}
    </svg>
  );
}

export default function TKETPanel({ data, isActive, loading }: Props) {
  const [optimised, setOptimised] = useState(false);
  const [showJson,  setShowJson]  = useState(false);
  const stats = optimised ? data.optimised.stats : data.stats;
  const jsonData = optimised
    ? { qubits: data.qubits, bits: data.bits, ...data.optimised }
    : { qubits: data.qubits, bits: data.bits, gates: data.gates, stats: data.stats };

  return (
    <div className={`pv-panel ${isActive ? 'pv-panel--active pv-panel--red' : ''}`}>
      <div className="panel-header">
        <span className="badge badge-red">◻ TKET</span>
        <span className="panel-name">pytket Circuit</span>
        {!loading && !showJson && (
          <label className={`opt-toggle ${optimised ? 'opt-toggle--on' : ''}`}>
            <input type="checkbox" checked={optimised}
              onChange={e => setOptimised(e.target.checked)} />
            H2-native optimisation
          </label>
        )}
        {!loading && (
          <div className="panel-actions">
            <button className={`action-btn ${!showJson ? 'action-btn--on' : ''}`}
              onClick={() => setShowJson(false)}>circuit</button>
            <button className={`action-btn ${showJson ? 'action-btn--on' : ''}`}
              onClick={() => setShowJson(true)}>json</button>
          </div>
        )}
      </div>

      {loading ? (
        <TKETSkeleton />
      ) : showJson ? (
        <pre className="tket-json-pre"
          dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(jsonData, null, 2)) }} />
      ) : (
        <div className="panel-body">
          <CircuitSVG data={data} optimised={optimised} />
          <div className="tket-stats">
            <span>Gates: <b>{stats.gates}</b></span>
            <span>Depth: <b>{stats.depth}</b></span>
            <span>2Q: <b>{stats.twoQ}</b></span>
            {stats.note && <span className="stat-note">{stats.note}</span>}
            {optimised && (
              <span className="native-key">
                <span className="native-dot" /> = native gate
              </span>
            )}
          </div>
        </div>
      )}

      <style>{`
        .tket-skeleton { padding: 8px; }
        .tket-skel-stats {
          display:flex; gap:14px; padding:8px 16px;
          border-top:1px solid var(--border);
        }
        .tket-skel-stat { height:10px; border-radius:4px; background:var(--bg3); }
        @keyframes tketPulse {
          0%,100% { opacity:0.5; }
          50%      { opacity:1; }
        }
        .tket-skel-pulse { animation: tketPulse 1.4s ease-in-out infinite; }

        .opt-toggle {
          display: flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px;
          color: var(--muted); cursor: pointer;
          margin-left: auto;
        }
        .opt-toggle input { accent-color: var(--red); cursor: pointer; }
        .opt-toggle--on { color: var(--red); }

        .tket-stats {
          display: flex; gap: 14px; flex-wrap: wrap;
          padding: 8px 16px;
          font-family: var(--font-mono); font-size: 11px;
          color: var(--muted);
          border-top: 1px solid var(--border);
        }
        .tket-stats b { color: var(--text); }
        .stat-note { color: var(--red); }
        .native-key { display: flex; align-items: center; gap: 5px; color: var(--red); }
        .native-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--red);
        }
        .tket-json-pre {
          margin: 0; padding: 14px 16px; background: #f6f8fa;
          font-family: var(--font-mono); font-size: 11px; line-height: 1.7;
          color: #0d0f14; overflow: auto; max-height: 310px; white-space: pre;
          width: 100%; box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
