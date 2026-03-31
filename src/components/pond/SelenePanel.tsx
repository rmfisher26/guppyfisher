// src/components/pond/SelenePanel.tsx
import { useState } from 'react';
import type { Program } from '../../data/programs';
import { highlightJson } from '../../utils/highlight';

type SeleneData = Program['selene'];
type TKETData   = Program['tket'];

interface Props {
  data:             SeleneData;
  tket:             TKETData;
  stateStep:        number;
  running:          boolean;
  done:             boolean;
  isActive?:        boolean;
  shots:            number;
  onShotsChange:    (n: number) => void;
  pipelineRunning:  boolean;
  loading?:         boolean;
  empty?:           boolean;
}

function SeleneSkeleton() {
  return (
    <div className="selene-skeleton">
      {/* Qubit blobs row */}
      <div className="ss-qubits">
        {[0, 1, 2].map(i => (
          <div key={i} className="ss-qubit">
            <div className="ss-label sel-skel-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="ss-circle sel-skel-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          </div>
        ))}
      </div>
      {/* Timeline dots */}
      <div className="ss-timeline">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="ss-tick">
            <div className="ss-dot sel-skel-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="ss-tick-label sel-skel-pulse" style={{ animationDelay: `${i * 60 + 30}ms` }} />
          </div>
        ))}
      </div>
      {/* Bar chart placeholder */}
      <div className="ss-bars">
        {[70, 45, 20, 60].map((w, i) => (
          <div key={i} className="ss-bar-row">
            <div className="ss-ket sel-skel-pulse" style={{ animationDelay: `${i * 70}ms` }} />
            <div className="ss-bar-wrap">
              <div className="ss-bar sel-skel-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 70 + 100}ms` }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .selene-skeleton { display:flex; flex-direction:column; gap:14px; padding:12px 16px; }
        .ss-qubits { display:flex; gap:12px; }
        .ss-qubit  { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .ss-label  { width:28px; height:9px; border-radius:3px; background:var(--bg3); }
        .ss-circle { width:50px; height:50px; border-radius:50%; background:var(--bg3); }
        .ss-timeline { display:flex; gap:0; }
        .ss-tick { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:52px; }
        .ss-dot  { width:10px; height:10px; border-radius:50%; background:var(--bg3); }
        .ss-tick-label { width:30px; height:8px; border-radius:3px; background:var(--bg3); }
        .ss-bars { display:flex; flex-direction:column; gap:8px; }
        .ss-bar-row { display:flex; align-items:center; gap:9px; }
        .ss-ket  { width:40px; height:12px; border-radius:3px; background:var(--bg3); flex-shrink:0; }
        .ss-bar-wrap { flex:1; height:10px; background:var(--bg3); border-radius:5px; overflow:hidden; }
        .ss-bar  { height:100%; border-radius:5px; background:var(--border); }
        @keyframes selPulse {
          0%,100% { opacity:0.5; }
          50%      { opacity:1; }
        }
        .sel-skel-pulse { animation: selPulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function StateEvolution({ data, tket, step }: {
  data: SeleneData; tket: TKETData; step: number;
}) {
  const timeline = data.timeline;
  const current  = timeline[Math.min(step, timeline.length - 1)] || timeline[0];
  const nQ       = tket.qubits.length;
  const isEnt    = Boolean(current.entangled);
  const isCls    = Boolean(current.classical);

  return (
    <div className="state-evo">
      <div className="se-step-label">{current.label}</div>

      <div className="se-qubits">
        {Array.from({ length: nQ }, (_, i) => {
          const amp   = current.state[i] ?? 0;
          // Per-qubit superposition: amplitude is between 0 and 1 exclusive
          const isSup = !isEnt && !isCls && amp > 0 && amp < 1;
          const cls   = [
            'se-bloch',
            isSup ? 'se-bloch--sup' : '',
            isEnt ? 'se-bloch--ent' : '',
            isCls ? 'se-bloch--cls' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={i} className="se-qubit">
              <div className="se-qubit-label">{tket.qubits[i]}</div>
              <div className={cls}>
                {isCls
                  ? (amp > 0.5 ? '1' : '0')
                  : isEnt ? '∿'
                  : isSup ? '|+⟩'
                  : amp >= 1 ? '|1⟩' : '|0⟩'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="se-timeline">
        {timeline.map((t, i) => (
          <div key={i} className={`se-tick ${i <= step ? 'se-tick--done' : ''}`}>
            <div className="se-tick-dot" />
            <div className="se-tick-label">{t.label.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShotResults({ data, running, done }: {
  data: SeleneData; running: boolean; done: boolean;
}) {
  const total         = data.results.reduce((s, r) => s + r.count, 0);
  const correlatedCount = data.results.filter(r => r.correlated).reduce((s, r) => s + r.count, 0);
  const noiseCount    = total - correlatedCount;
  const fidelity      = total > 0 ? (correlatedCount / total * 100).toFixed(1) : null;

  return (
    <div className="shot-results">
      <div className="sr-header">
        <span className="sr-sim-badge">{data.simulator}</span>
        <span className="sr-shots">{data.shots} shots</span>
        {running && (
          <span className="sr-running">
            <span className="pulse-dot" /> Simulating…
          </span>
        )}
        {done && <span className="sr-done">✓ Complete</span>}
      </div>

      {done && (
        <div className="sr-bars">
          {data.results.map((r, i) => {
            const pct = r.count / total;
            return (
              <div key={i} className="sr-row"
                style={{ animationDelay: `${i * 80}ms` }}>
                <span className="sr-ket">{r.state ? `|${r.state}⟩` : '—'}</span>
                <div className="sr-bar-wrap">
                  <div className="sr-bar"
                    style={{
                      width: `${pct * 100}%`,
                      background: r.correlated
                        ? 'linear-gradient(90deg,#1a6b4a,#2a9d6a)'
                        : 'linear-gradient(90deg,#8a2020,#c84040)',
                      animationDelay: `${i * 80 + 100}ms`,
                    }}
                  />
                </div>
                <span className="sr-count">{r.count}</span>
                <span className="sr-pct">{(pct * 100).toFixed(0)}%</span>
                {!r.correlated && r.count > 0 && (
                  <span className="sr-noise">noise</span>
                )}
              </div>
            );
          })}
          <div className="sr-note">
            {fidelity !== null && correlatedCount > 0
              ? `Fidelity: ${fidelity}% · ${noiseCount} noise shots`
              : `No correlated states · ${noiseCount} noise shots`}
          </div>
        </div>
      )}

      {!done && !running && (
        <div className="sr-idle">Press ▶ Run Pipeline to simulate</div>
      )}
    </div>
  );
}

export default function SelenePanel({ data, tket, stateStep, running, done, isActive, shots, onShotsChange, pipelineRunning, loading, empty }: Props) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className={`pv-panel ${isActive ? 'pv-panel--active pv-panel--purple' : ''}`}>
      <div className="panel-header">
        <span className="badge badge-purple">◉ Selene</span>
        <span className="panel-name">selene_sim.run_shots()</span>
        {!loading && !showJson && (
          <div className="se-shots-control">
            <span className="se-shots-label">shots</span>
            <input
              type="range" min={10} max={10000} step={10}
              value={shots}
              onChange={e => onShotsChange(Number(e.target.value))}
              disabled={pipelineRunning}
              className="se-shots-slider"
            />
            <span className="se-shots-value">{shots}</span>
          </div>
        )}
        {!loading && (
          <div className="panel-actions">
            <button className={`action-btn ${!showJson ? 'action-btn--on' : ''}`}
              onClick={() => setShowJson(false)}>results</button>
            <button className={`action-btn ${showJson ? 'action-btn--on' : ''}`}
              onClick={() => setShowJson(true)}>json</button>
          </div>
        )}
      </div>

      {loading ? (
        <SeleneSkeleton />
      ) : empty ? (
        <div className="panel-empty">
          <span className="panel-empty-icon" style={{ color: 'var(--purple)' }}>◉</span>
          <p>Run the pipeline to simulate with Selene</p>
        </div>
      ) : showJson ? (
        <pre className="selene-json-pre"
          dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(data, null, 2)) }} />
      ) : (
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StateEvolution data={data} tket={tket} step={stateStep} />
          <ShotResults    data={data} running={running} done={done} />
          <div className="selene-desc">
            Selene is Quantinuum's emulator — it runs the compiled circuit repeatedly, sampling measurement outcomes to build up a shot distribution.
          </div>
        </div>
      )}

      <style>{`
        /* ── State evolution ── */
        .state-evo { display: flex; flex-direction: column; gap: 10px; }
        .se-step-label {
          font-family: var(--font-mono); font-size: 11px; color: var(--gold);
        }
        .se-qubits { display: flex; gap: 12px; flex-wrap: wrap; }
        .se-qubit  { display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .se-qubit-label {
          font-family: var(--font-mono); font-size: 10px; color: var(--muted);
        }
        .se-bloch {
          width: 50px; height: 50px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          border: 2px solid var(--green); background: rgba(26,107,74,0.08); color: var(--green);
          transition: all 0.4s ease;
        }
        .se-bloch--sup {
          background: rgba(184,134,11,0.08); border-color: var(--gold); color: var(--gold);
          animation: superpos 1s ease infinite alternate;
        }
        .se-bloch--ent {
          background: rgba(74,128,200,0.08); border-color: var(--blue); color: var(--blue);
          animation: entangle 1.5s ease infinite;
        }
        .se-bloch--cls {
          background: rgba(160,64,200,0.08); border-color: var(--purple); color: var(--purple);
        }

        .se-timeline { display: flex; overflow-x: auto; }
        .se-tick {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          opacity: 0.3; transition: opacity 0.35s; min-width: 52px;
          position: relative;
        }
        .se-tick::before {
          content: ""; position: absolute; top: 5px; left: -50%;
          width: 100%; height: 1px; background: var(--border);
        }
        .se-tick:first-child::before { display: none; }
        .se-tick--done { opacity: 1; }
        .se-tick-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--border); border: 2px solid var(--border);
        }
        .se-tick--done .se-tick-dot {
          background: var(--green); border-color: var(--green);
        }
        .se-tick-label {
          font-family: var(--font-mono); font-size: 9px;
          color: var(--muted); text-align: center;
        }

        /* ── Shot results ── */
        .shot-results { display: flex; flex-direction: column; gap: 10px; }
        .sr-header {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .sr-sim-badge {
          font-family: var(--font-mono); font-size: 12px;
          color: var(--purple); background: rgba(160,64,200,0.08);
          border: 1px solid color-mix(in srgb,var(--purple) 40%,transparent);
          padding: 2px 10px; border-radius: 5px;
        }
        .sr-shots { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
        .sr-running {
          display: flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 11px; color: var(--gold);
        }
        .pulse-dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--gold);
          animation: pulse 1s ease infinite;
        }
        .sr-done { font-family: var(--font-mono); font-size: 11px; color: var(--green); }

        .sr-bars { display: flex; flex-direction: column; gap: 8px; }
        .sr-row {
          display: flex; align-items: center; gap: 9px;
          animation: slideIn 0.3s ease both;
        }
        .sr-ket   { font-family: var(--font-mono); font-size: 13px; width: 46px; }
        .sr-bar-wrap { flex: 1; height: 10px; background: var(--bg3); border-radius: 5px; overflow: hidden; }
        .sr-bar   { height: 100%; border-radius: 5px; animation: grow 0.7s ease both; }
        .sr-count { font-family: var(--font-mono); font-size: 11px; color: var(--muted); width: 30px; text-align: right; }
        .sr-pct   { font-family: var(--font-mono); font-size: 11px; color: var(--text); width: 36px; }
        .sr-noise {
          font-family: var(--font-mono); font-size: 9px;
          color: var(--red); background: rgba(200,64,64,0.08);
          padding: 1px 6px; border-radius: 3px;
        }
        .sr-note  {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--muted); margin-top: 6px;
          padding-top: 8px; border-top: 1px solid var(--border);
        }
        .se-shots-control {
          display: flex; align-items: center; gap: 7px; margin-left: auto;
        }
        .se-shots-label {
          font-family: var(--font-mono); font-size: 10px; color: var(--muted);
        }
        .se-shots-slider {
          width: 90px; accent-color: var(--purple); cursor: pointer;
        }
        .se-shots-slider:disabled { opacity: 0.4; cursor: not-allowed; }
        .se-shots-value {
          font-family: var(--font-mono); font-size: 11px; color: var(--purple);
          min-width: 42px; text-align: right;
        }
        .sr-idle  {
          font-family: var(--font-mono); font-size: 12px;
          color: #9ca3af; padding: 12px 0;
        }
        .selene-desc {
          border-top: 1px solid var(--border); padding-top: 8px;
          font-family: var(--font-mono); font-size: 10px; color: var(--muted); line-height: 1.6;
        }
        .selene-json-pre {
          margin: 0; padding: 14px 16px; background: #f6f8fa;
          font-family: var(--font-mono); font-size: 11px; line-height: 1.7;
          color: #0d0f14; overflow: auto; max-height: 370px; white-space: pre;
          width: 100%; box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
