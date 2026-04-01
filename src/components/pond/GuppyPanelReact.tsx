// src/components/pond/GuppyPanelReact.tsx
// React version of GuppyPanel — used when program switches client-side.

import { highlightGuppy } from '../../utils/highlight';

interface Props {
  code: string;
  name: string;
  description: string;
  isActive?: boolean;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

const ExpandIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 5V1h4M8 1h4v4M12 8v4H8M5 12H1V8"/>
  </svg>
);
const CollapseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M5 1v4H1M12 5H8V1M8 12V8h4M1 8h4v4"/>
  </svg>
);

export default function GuppyPanelReact({ code, name, description, isActive, isFullscreen, onFullscreenToggle }: Props) {
  const highlighted = highlightGuppy(code);

  const header = (
    <div className="panel-header">
      <span className="badge badge-green">Guppy</span>
      <span className="panel-name">{name}</span>
      <span className="panel-desc">{description}</span>
      <button className="panel-fs-btn" onClick={onFullscreenToggle}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
        {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
      </button>
    </div>
  );

  const content = (
    <>
      <div style={{ padding: 0 }}>
        <pre className="guppy-code-pre" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
      <div className="guppy-desc">
        Guppy is Quantinuum's Python-embedded quantum language — functions decorated with <span className="guppy-desc-code">@module.guppy</span> are type-checked and compiled directly to HUGR IR.
      </div>
    </>
  );

  return (
    <>
      <div className={`pv-panel ${isActive ? 'pv-panel--active pv-panel--green' : ''} ${isFullscreen ? 'pv-panel--fullscreen' : ''}`}>
        {header}
        {content}
      </div>

      <style>{`
        .guppy-code-pre {
          background: #f6f8fa;
          margin: 0;
          padding: 16px;
          font-family: 'Roboto Mono', monospace;
          font-size: 12px;
          line-height: 1.75;
          color: #0d0f14;
          overflow-x: auto;
          white-space: pre;
          border: none;
        }
        .panel-desc {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--muted);
          margin-left: auto;
        }
        .guppy-desc {
          padding: 8px 14px; border-top: 1px solid var(--border);
          font-family: var(--font-mono); font-size: 10px; color: var(--muted); line-height: 1.6;
        }
        .guppy-desc-code {
          background: rgba(0,0,0,0.06); border-radius: 3px; padding: 1px 4px;
          font-family: var(--font-mono); font-size: 10px; color: var(--green);
        }
      `}</style>
    </>
  );
}
