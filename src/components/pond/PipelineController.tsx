// src/components/pond/PipelineController.tsx
// Root React island — orchestrates all four panels and pipeline animation.

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Program } from '../../data/programs';
import { PROGRAMS } from '../../data/programs';
import GuppyPanelReact from './GuppyPanelReact';
import HUGRPanel       from './HUGRPanel';
import TKETPanel       from './TKETPanel';
import SelenePanel     from './SelenePanel';

const LIVE_BACKEND = import.meta.env.PUBLIC_LIVE_BACKEND === 'true';
const BACKEND_URL  = (import.meta.env.PUBLIC_BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '');

const STAGES = ['guppy', 'hugr', 'tket', 'selene'] as const;
type Stage = typeof STAGES[number];

const STAGE_META: Record<Stage, { label: string; icon: string; color: string }> = {
  guppy:  { label: 'Guppy',   icon: '⬡', color: '#1a6b4a' },
  hugr:   { label: 'HUGR IR', icon: '◈', color: '#4a80c8' },
  tket:   { label: 'TKET',    icon: '◻', color: '#c84040' },
  selene: { label: 'Selene',  icon: '◉', color: '#a040c8' },
};

const FLOW_LABELS = ['compile→', 'lower→', 'emulate→'];

interface Props {
  initialProgram?: string;
}

function getInitialProgram(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const p = new URLSearchParams(window.location.search).get('program');
  return p && PROGRAMS[p] ? p : fallback;
}

export default function PipelineController({ initialProgram = 'bell' }: Props) {
  const [programKey, setProgramKey] = useState(() => getInitialProgram(initialProgram));
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [reachedIdx, setReachedIdx] = useState(-1);
  const [running,    setRunning]    = useState(false);
  const [stateStep,  setStateStep]  = useState(0);
  const [seleneRun,   setSeleneRun]   = useState(false);
  const [seleneDone,  setSeleneDone]  = useState(false);
  const [shots,          setShots]          = useState(200);
  const [fetching,       setFetching]       = useState(false);
  const [compileError,   setCompileError]   = useState<string | null>(null);
  const [programResults, setProgramResults] = useState<Record<string, {
    hugrJson:   string;
    tketData:   Program['tket'];
    seleneData: Program['selene'];
  }>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prog: Program = PROGRAMS[programKey] ?? PROGRAMS['bell'];

  // URL sync
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('program', programKey);
    window.history.replaceState({}, '', url.toString());
  }, [programKey]);


  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const resetPipeline = useCallback(() => {
    clearTimer();
    setRunning(false); setReachedIdx(-1); setActiveIdx(0);
    setStateStep(0); setSeleneRun(false); setSeleneDone(false);
    setCompileError(null);
  }, []);

  useEffect(() => { resetPipeline(); }, [programKey]);
  useEffect(() => () => clearTimer(), []);

  const animatePipeline = (seleneMax: number) => {
    setRunning(true); setActiveIdx(0); setReachedIdx(0);
    const advance = (idx: number, delay: number) => {
      timerRef.current = setTimeout(() => {
        setActiveIdx(idx); setReachedIdx(idx);
        if (idx === 3) {
          setSeleneRun(true);
          let step = 0;
          const tick = () => {
            timerRef.current = setTimeout(() => {
              step++; setStateStep(step);
              if (step < seleneMax) tick();
              else { setSeleneDone(true); setRunning(false); }
            }, 620);
          };
          tick();
        } else { advance(idx + 1, 1100); }
      }, delay);
    };
    advance(1, 700);
  };

  const runPipeline = async () => {
    resetPipeline();
    await new Promise(r => setTimeout(r, 80));

    if (LIVE_BACKEND) {
      setRunning(true);
      setFetching(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: prog.guppy, selene_shots: shots }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && data.hugr_json) {
          console.log('[HUGR response]', data.hugr_json);
          console.log('[TKET response]', data.tket);
          console.log('[Selene response]', data.selene);
          const key = programKey;
          setProgramResults(prev => ({
            ...prev,
            [key]: {
              hugrJson:   JSON.stringify(data.hugr_json, null, 2),
              tketData:   (data.tket ?? prog.tket) as Program['tket'],
              seleneData: (data.selene ?? prog.selene) as Program['selene'],
            },
          }));
          setFetching(false);
        } else {
          const errorLines = (data.lines ?? [])
            .filter((l: { t: string; text: string }) => l.t === 'error' || l.t === 'hint')
            .map((l: { t: string; text: string }) => l.text)
            .join('\n');
          setCompileError(errorLines || 'Compilation failed');
          setFetching(false);
          setRunning(false);
          return;
        }
      } catch (e) {
        setCompileError(`Backend unreachable at ${BACKEND_URL}`);
        setFetching(false);
        setRunning(false);
        return;
      }
      setRunning(false);
    }

    if (!LIVE_BACKEND) {
      setProgramResults(prev => ({
        ...prev,
        [programKey]: { hugrJson: prog.hugr.json, tketData: prog.tket, seleneData: prog.selene },
      }));
    }
    const seleneData = programResults[programKey]?.seleneData ?? prog.selene;
    animatePipeline(seleneData.timeline.length - 1);
  };


  return (
    <>
      {/* Top bar */}
      <div className="pc-topbar">
        <div className="pc-prog-tabs">
          {Object.entries(PROGRAMS).map(([key, p]) => (
            <button key={key}
              className={`pc-tab ${programKey === key ? 'pc-tab--active' : ''}`}
              onClick={() => setProgramKey(key)}>{p.name}</button>
          ))}
        </div>
        <div className="pc-actions">
          <div className="pc-shots">
            <span className="pc-shots-label">shots</span>
            <input type="range" min={10} max={1000} step={10}
              value={shots} onChange={e => setShots(Number(e.target.value))}
              disabled={running} className="pc-shots-slider" />
            <span className="pc-shots-value">{shots}</span>
          </div>
          <button className="pc-run-btn" onClick={runPipeline} disabled={running}>
            {running ? <><span className="spinner" /> Running…</> : <>▶ Run Pipeline</>}
          </button>
        </div>
      </div>

      {/* Stage track */}
      <div className="pc-stages">
        {STAGES.map((s, i) => {
          const meta    = STAGE_META[s];
          const reached = reachedIdx >= i;
          const active  = activeIdx === i;
          return (
            <div key={s} className="pc-stage-group">
              <button
                className={`pc-node ${active ? 'pc-node--active' : ''} ${reached ? 'pc-node--reached' : ''}`}
                onClick={() => reached && setActiveIdx(i)}
                disabled={!reached}
                title={meta.label}>
                <div className="pc-node-ring" style={{
                  borderColor: reached ? meta.color : undefined,
                  background:  active  ? meta.color + '1a' : undefined,
                  boxShadow:   active  ? `0 0 0 3px ${meta.color}22` : undefined,
                }}>
                  <span className="pc-node-icon" style={{ color: reached ? meta.color : undefined }}>{meta.icon}</span>
                </div>
                <span className="pc-node-label" style={{ color: active ? meta.color : reached ? 'var(--text)' : undefined }}>
                  {meta.label}
                </span>
                <span className="pc-node-status" style={{ color: reached ? meta.color : undefined }}>
                  {reached ? '● ready' : '○ pending'}
                </span>
              </button>
              {i < STAGES.length - 1 && (
                <div className="pc-track">
                  <div className="pc-track-rail">
                    <div className="pc-track-fill" style={{
                      transform: reachedIdx > i ? 'scaleX(1)' : 'scaleX(0)',
                      background: `linear-gradient(90deg,${STAGE_META[STAGES[i]].color},${STAGE_META[STAGES[i+1]].color})`,
                    }}/>
                  </div>
                  <span className="pc-track-label">{FLOW_LABELS[i]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compile error banner */}
      {compileError && (
        <div className="pc-error-banner">
          <span className="pc-error-icon">✗</span>
          <pre className="pc-error-text">{compileError}</pre>
        </div>
      )}

      {/* Four-panel grid */}
      {(() => {
        const r = programResults[programKey] ?? null;
        return (
          <div className="pc-grid">
            <GuppyPanelReact code={prog.guppy} name={prog.name} description={prog.description} isActive={activeIdx === 0}/>
            <div style={{ opacity: reachedIdx >= 1 ? 1 : 0.35, transition: 'opacity 0.5s' }}>
              <HUGRPanel nodes={prog.hugr.nodes} edges={prog.hugr.edges}
                json={r?.hugrJson ?? prog.hugr.json} isActive={activeIdx === 1}
                loading={fetching || (running && reachedIdx < 1)} empty={!r && !running}/>
            </div>
            <div style={{ opacity: reachedIdx >= 2 ? 1 : 0.35, transition: 'opacity 0.5s' }}>
              <TKETPanel data={r?.tketData ?? prog.tket} isActive={activeIdx === 2}
                loading={fetching || (running && reachedIdx < 2)} empty={!r && !running}/>
            </div>
            <div style={{ opacity: reachedIdx >= 3 ? 1 : 0.35, transition: 'opacity 0.5s' }}>
              <SelenePanel data={r?.seleneData ?? prog.selene} tket={r?.tketData ?? prog.tket}
                stateStep={stateStep} running={seleneRun && !seleneDone} done={seleneDone}
                isActive={activeIdx === 3} loading={fetching || (running && reachedIdx < 3)} empty={!r && !running}/>
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <div className="pc-footer">
        {LIVE_BACKEND
          ? <><span className="pc-live-dot" />Connected to {BACKEND_URL}</>
          : <span>Live backend disabled — set PUBLIC_LIVE_BACKEND=true to connect</span>
        }
      </div>

      <style>{`
        .pc-topbar { background:var(--paper); border-bottom:1px solid #dfdddb; padding:12px 20px; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        .pc-mark { color:var(--green); }
        .pc-title { font-size:15px; font-weight:700; letter-spacing:-0.01em; }
        .pc-prog-tabs { display:flex; gap:6px; flex-wrap:wrap; }
        .pc-tab { background:var(--paper); border:1px solid #dfdddb; border-radius:7px; padding:5px 13px; font-family:var(--font-mono); font-size:12px; color:#989898; cursor:pointer; transition:all 0.15s; }
        .pc-tab:hover { color:var(--ink); border-color:#989898; background:rgba(0,0,0,0.04); }
        .pc-tab--active { border-color:var(--accent); color:var(--accent); background:rgba(48,160,142,0.08); }
        .pc-actions { display:flex; align-items:center; gap:8px; margin-left:auto; }
        .pc-shots { display:flex; align-items:center; gap:7px; }
        .pc-shots-label { font-family:var(--font-mono); font-size:11px; color:var(--muted); }
        .pc-shots-slider { width:110px; accent-color:#30a08e; cursor:pointer; -webkit-appearance:none; appearance:none; background:transparent; height:16px; }
        .pc-shots-slider::-webkit-slider-runnable-track { background:#d1d5db; border-radius:4px; height:4px; }
        .pc-shots-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:14px; height:14px; border-radius:50%; background:#30a08e; margin-top:-5px; cursor:pointer; }
        .pc-shots-slider::-moz-range-track { background:#d1d5db; border-radius:4px; height:4px; }
        .pc-shots-slider::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:#30a08e; border:none; cursor:pointer; }
        .pc-shots-slider:disabled { opacity:0.4; cursor:not-allowed; }
        .pc-shots-value { font-family:var(--font-mono); font-size:11px; color:#30a08e; min-width:38px; }
.pc-run-btn { display:flex; align-items:center; gap:8px; background:#30a08e; color:#fff; border:none; border-radius:8px; padding:8px 20px; font-family:var(--font-body); font-size:14px; font-weight:700; cursor:pointer; transition:all 0.15s; }
        .pc-run-btn:hover:not(:disabled) { background:#279080; transform:translateY(-1px); }
        .pc-run-btn:disabled { background:var(--bg3); color:var(--muted); cursor:not-allowed; transform:none; }

        .pc-stages { display:flex; align-items:center; padding:16px 20px 8px; box-sizing:border-box; }
        .pc-stage-group { display:flex; align-items:center; flex:1; }
        .pc-stage-group:last-child { flex:0 0 auto; }

        .pc-node { flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:5px; background:none; border:none; cursor:pointer; padding:6px 10px; border-radius:10px; transition:background 0.15s; }
        .pc-node:hover:not(:disabled) { background:rgba(0,0,0,0.05); }
        .pc-node:disabled { cursor:default; }
        .pc-node-ring { width:42px; height:42px; border-radius:50%; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; transition:all 0.3s ease; }
        .pc-node-icon { font-size:17px; line-height:1; color:var(--muted); transition:color 0.3s ease; }
        .pc-node-label { font-family:var(--font-mono); font-size:11px; font-weight:600; white-space:nowrap; color:var(--muted); transition:color 0.3s ease; }
        .pc-node-status { font-family:var(--font-mono); font-size:9px; letter-spacing:0.04em; color:var(--muted); transition:color 0.3s ease; }

        .pc-track { flex:1; display:flex; flex-direction:column; align-items:stretch; gap:5px; padding:0 6px; margin-bottom:22px; }
        .pc-track-rail { position:relative; height:2px; background:var(--border); border-radius:1px; overflow:hidden; }
        .pc-track-fill { position:absolute; inset:0; border-radius:1px; transform-origin:left; transition:transform 0.55s ease; }
        .pc-track-label { text-align:center; font-family:var(--font-mono); font-size:9px; color:var(--muted); white-space:nowrap; letter-spacing:0.03em; }


.pc-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; padding:18px 20px 0; }
        .pc-grid > * { min-width: 0; }

        .pv-panel {
          background:#fff;
          border:1px solid rgba(0,0,0,0.07);
          border-radius:16px;
          overflow:hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06);
          transition: border-color 0.25s, box-shadow 0.3s, transform 0.2s;
        }
        .pv-panel:hover {
          box-shadow: 0 4px 10px rgba(0,0,0,0.07), 0 12px 32px rgba(0,0,0,0.09);
          transform: translateY(-1px);
        }
        .pv-panel--green.pv-panel--active  { border-color:var(--green);  box-shadow:0 4px 12px rgba(0,0,0,0.07), 0 0 0 1px var(--green), 0 8px 36px color-mix(in srgb,var(--green) 16%,transparent); }
        .pv-panel--blue.pv-panel--active   { border-color:var(--blue);   box-shadow:0 4px 12px rgba(0,0,0,0.07), 0 0 0 1px var(--blue),  0 8px 36px color-mix(in srgb,var(--blue)  16%,transparent); }
        .pv-panel--red.pv-panel--active    { border-color:var(--red);    box-shadow:0 4px 12px rgba(0,0,0,0.07), 0 0 0 1px var(--red),   0 8px 36px color-mix(in srgb,var(--red)   16%,transparent); }
        .pv-panel--purple.pv-panel--active { border-color:var(--purple); box-shadow:0 4px 12px rgba(0,0,0,0.07), 0 0 0 1px var(--purple),0 8px 36px color-mix(in srgb,var(--purple) 16%,transparent); }

        .panel-header { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid rgba(0,0,0,0.06); background:rgba(0,0,0,0.015); flex-wrap:wrap; }
        .panel-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:40px 20px; min-height:180px; }
        .panel-empty-icon { font-size:28px; opacity:0.3; }
        .panel-empty p { font-family:var(--font-mono); font-size:11px; color:var(--muted); text-align:center; margin:0; }
        .panel-name { font-size:13px; font-weight:600; color:var(--text); flex:1; min-width:80px; }
        .panel-body { padding:12px 16px; }
        .badge { font-family:var(--font-mono); font-size:11px; font-weight:600; padding:2px 9px; border-radius:5px; letter-spacing:0.04em; white-space:nowrap; }
        .badge-green  { background:color-mix(in srgb,var(--green) 20%,transparent);  color:var(--green); }
        .badge-blue   { background:color-mix(in srgb,var(--blue) 20%,transparent);   color:var(--blue); }
        .badge-red    { background:color-mix(in srgb,var(--red) 20%,transparent);    color:var(--red); }
        .badge-purple { background:color-mix(in srgb,var(--purple) 20%,transparent); color:var(--purple); }
        .panel-actions { display:flex; gap:5px; margin-left:auto; }
        .action-btn { background:var(--bg3); border:1px solid var(--border); border-radius:5px; padding:3px 10px; font-family:var(--font-mono); font-size:10px; color:var(--muted); cursor:pointer; transition:all 0.12s; }
        .action-btn:hover { color:var(--text); border-color:var(--muted); }
        .action-btn--on { color:var(--gold); border-color:var(--gold); background:rgba(184,134,11,0.08); }

        .pc-footer { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:14px 20px; font-family:var(--font-mono); font-size:11px; color:var(--muted); border-top:1px solid #dfdddb; margin-top:14px; }
        .pc-footer a { color:var(--green); text-decoration:none; }
        .pc-footer a:hover { text-decoration:underline; }
        .pc-footer-sep { color:var(--border); }
        .pc-footer-link { color:var(--muted) !important; }
        .pc-footer-link:hover { color:var(--text) !important; }

        .spinner { width:12px; height:12px; border:2px solid transparent; border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; display:inline-block; }

        .pc-error-banner { display:flex; align-items:flex-start; gap:10px; background:rgba(200,64,64,0.08); border:1px solid rgba(200,64,64,0.3); border-radius:8px; padding:10px 16px; margin:10px 20px 0; }
        .pc-error-icon { color:var(--red); font-size:14px; line-height:1.6; flex-shrink:0; }
        .pc-error-text { margin:0; font-family:var(--font-mono); font-size:11px; color:var(--red); white-space:pre-wrap; line-height:1.6; }

        .pc-live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--green); margin-right:6px; animation:pulse 2s ease-in-out infinite; }

        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeIn   { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; } }
        @keyframes slideIn  { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; } }
        @keyframes grow     { from { width: 0%; } }
        @keyframes pulse    { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
        @keyframes superpos { from{ box-shadow:0 0 0 0 #c8a04020; } to{ box-shadow:0 0 12px 4px #c8a04040; } }
        @keyframes entangle { 0%,100%{ box-shadow:0 0 0 0 #4a80c820; } 50%{ box-shadow:0 0 14px 4px #4a80c840; } }

        @media(max-width:720px) { .pc-grid{grid-template-columns:1fr;} .pc-kbd-hint{display:none;} }
      `}</style>
    </>
  );
}
