// src/components/pond/GuppyPanelReact.tsx
// React version of GuppyPanel — used when program switches client-side.

import { highlightGuppy } from '../../utils/highlight';

interface Props {
  code: string;
  name: string;
  description: string;
  isActive?: boolean;
}

export default function GuppyPanelReact({ code, name, description, isActive }: Props) {
  const highlighted = highlightGuppy(code);

  return (
    <div className={`pv-panel ${isActive ? 'pv-panel--active pv-panel--green' : ''}`}>
      <div className="panel-header">
        <span className="badge badge-green">⬡ Guppy</span>
        <span className="panel-name">{name}</span>
        <span className="panel-desc">{description}</span>
      </div>
      <div style={{ padding: 0 }}>
        <pre
          className="guppy-code-pre"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
      <div className="guppy-desc">
        Guppy is Quantinuum's Python-embedded quantum language — functions decorated with <span className="guppy-desc-code">@module.guppy</span> are type-checked and compiled directly to HUGR IR.
      </div>

      <style>{`
        .guppy-code-pre {
          background: #f6f8fa;
          margin: 0;
          padding: 16px;
          font-family: var(--font-mono);
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
    </div>
  );
}
