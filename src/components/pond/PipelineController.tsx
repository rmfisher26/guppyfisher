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
  const [liveHugrJson, setLiveHugrJson] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
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
    setLiveHugrJson(null); setCompileError(null);
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
      try {
        const res = await fetch(`${BACKEND_URL}/api/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: prog.guppy }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && data.hugr_json) {
          setLiveHugrJson(JSON.stringify(data.hugr_json, null, 2));
        } else {
          const errorLines = (data.lines ?? [])
            .filter((l: { t: string; text: string }) => l.t === 'error' || l.t === 'hint')
            .map((l: { t: string; text: string }) => l.text)
            .join('\n');
          setCompileError(errorLines || 'Compilation failed');
          setRunning(false);
          return;
        }
      } catch (e) {
        setCompileError(`Backend unreachable at ${BACKEND_URL}`);
        setRunning(false);
        return;
      }
      setRunning(false);
    }

    animatePipeline(prog.selene.timeline.length - 1);
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
<button className="pc-run-btn" onClick={runPipeline} disabled={running}>
            {running ? <><span className="spinner" /> Running…</> : <>▶ Run Pipeline</>}
          </button>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="pc-stages">
        {STAGES.map((s, i) => {
          const meta = STAGE_META[s];
          const reached = reachedIdx >= i;
          const active  = activeIdx === i;
          return (
            <div key={s} className="pc-stage-group">
              <button
                className={`pc-stage ${active ? 'pc-stage--active' : ''} ${reached ? 'pc-stage--reached' : ''}`}
                style={{ color: active ? 'var(--accent)' : reached ? meta.color : undefined }}
                onClick={() => reached && setActiveIdx(i)}
                disabled={!reached} title={`${meta.label} — press ${i+1}`}>
                <span className="pc-stage-icon">{meta.icon}</span>
                <span className="pc-stage-label" style={{ color: active ? 'var(--accent)' : undefined }}>{meta.label}</span>
                <span className="pc-stage-status">{reached ? 'ready' : 'pending'}</span>
              </button>
              {i < STAGES.length - 1 && (
                <div className={`pc-arrow ${reachedIdx > i ? 'pc-arrow--active' : ''}`}>
                  <svg width="38" height="14" viewBox="0 0 38 14">
                    <defs>
                      <linearGradient id={`ag-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stopColor={STAGE_META[STAGES[i]].color}   stopOpacity={reachedIdx > i ? 1 : 0.2}/>
                        <stop offset="100%" stopColor={STAGE_META[STAGES[i+1]].color} stopOpacity={reachedIdx > i ? 1 : 0.2}/>
                      </linearGradient>
                    </defs>
                    <line x1="2" y1="7" x2="30" y2="7" stroke={`url(#ag-${i})`} strokeWidth="2"
                      strokeDasharray={reachedIdx > i ? 'none' : '4,3'}/>
                    <polygon points="28,3 38,7 28,11"
                      fill={reachedIdx > i ? STAGE_META[STAGES[i+1]].color : '#2a3040'}/>
                  </svg>
                  <span className="pc-arrow-label">{FLOW_LABELS[i]}</span>
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

      {/* Progress bar */}
      <div className="pc-progress">
        <div className="pc-progress-fill"
          style={{ width: reachedIdx < 0 ? '0%' : `${((reachedIdx+1)/STAGES.length)*100}%` }}/>
      </div>

      {/* Four-panel grid */}
      <div className="pc-grid">
        <GuppyPanelReact code={prog.guppy} name={prog.name} description={prog.description} isActive={activeIdx === 0}/>
        <div style={{ opacity: reachedIdx >= 1 ? 1 : 0.35, transition: 'opacity 0.5s' }}>
          <HUGRPanel nodes={prog.hugr.nodes} edges={prog.hugr.edges} json={liveHugrJson ?? prog.hugr.json} isActive={activeIdx === 1}/>
        </div>
        <div style={{ opacity: reachedIdx >= 2 ? 1 : 0.35, transition: 'opacity 0.5s' }}>
          <TKETPanel data={prog.tket} isActive={activeIdx === 2}/>
        </div>
        <div style={{ opacity: reachedIdx >= 3 ? 1 : 0.35, transition: 'opacity 0.5s' }}>
          <SelenePanel data={prog.selene} tket={prog.tket} stateStep={stateStep}
            running={seleneRun && !seleneDone} done={seleneDone} isActive={activeIdx === 3}/>
        </div>
      </div>

      {/* Footer */}
      <div className="pc-footer">
        {LIVE_BACKEND
          ? <><span className="pc-live-dot" />Connected to {BACKEND_URL}</>
          : <span>Live backend disabled — set PUBLIC_LIVE_BACKEND=true to connect</span>
        }
        <span className="pc-footer-sep">·</span>
        <a href="/about" className="pc-footer-link">About</a>
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
.pc-run-btn { display:flex; align-items:center; gap:8px; background:var(--green); color:#fff; border:none; border-radius:8px; padding:8px 20px; font-family:var(--font-body); font-size:14px; font-weight:700; cursor:pointer; transition:all 0.15s; }
        .pc-run-btn:hover:not(:disabled) { background:#22a06b; transform:translateY(-1px); }
        .pc-run-btn:disabled { background:var(--bg3); color:var(--muted); cursor:not-allowed; transform:none; }

        .pc-stages { display:flex; align-items:center; padding:14px 20px 0; gap:0; overflow-x:auto; }
        .pc-stage-group { display:flex; align-items:center; }
        .pc-stage { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 16px; border-radius:9px; cursor:pointer; border:1px solid transparent; background:none; transition:all 0.18s; min-width:76px; color:var(--muted); }
        .pc-stage:hover:not(:disabled) { background:rgba(0,0,0,0.04); }
        .pc-stage--active { background:var(--paper); border-color:#dfdddb; }
        .pc-stage:disabled { cursor:default; }
        .pc-stage-icon  { font-size:16px; line-height:1; }
        .pc-stage-label { font-family:var(--font-mono); font-size:11px; font-weight:500; white-space:nowrap; }
        .pc-stage-status { font-family:var(--font-mono); font-size:9px; letter-spacing:0.05em; }
        .pc-stage--reached .pc-stage-status { color:var(--green); }
        .pc-stage:not(.pc-stage--reached) .pc-stage-status { color:var(--muted); }
        .pc-arrow { display:flex; flex-direction:column; align-items:center; gap:2px; padding:0 3px; margin-bottom:6px; }
        .pc-arrow-label { font-family:var(--font-mono); font-size:9px; color:var(--muted); white-space:nowrap; }


        .pc-progress { height:2px; background:#dfdddb; margin:10px 20px 0; border-radius:1px; overflow:hidden; }
        .pc-progress-fill { height:100%; background:linear-gradient(90deg,var(--green),var(--blue)); transition:width 0.55s ease; }

        .pc-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; padding:14px 20px 0; }

        .pv-panel { background:var(--bg1); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:border-color 0.25s,box-shadow 0.25s; }
        .pv-panel--green.pv-panel--active  { border-color:var(--green);  box-shadow:0 0 28px color-mix(in srgb,var(--green) 12%,transparent); }
        .pv-panel--blue.pv-panel--active   { border-color:var(--blue);   box-shadow:0 0 28px color-mix(in srgb,var(--blue) 12%,transparent); }
        .pv-panel--red.pv-panel--active    { border-color:var(--red);    box-shadow:0 0 28px color-mix(in srgb,var(--red) 12%,transparent); }
        .pv-panel--purple.pv-panel--active { border-color:var(--purple); box-shadow:0 0 28px color-mix(in srgb,var(--purple) 12%,transparent); }

        .panel-header { display:flex; align-items:center; gap:10px; padding:11px 16px; border-bottom:1px solid var(--border); background:var(--bg2); flex-wrap:wrap; }
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
