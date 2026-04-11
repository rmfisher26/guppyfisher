// src/components/pond/HUGRPanel.tsx
import { useState } from 'react';
import type { HUGRNode, HUGREdge } from '../../data/programs';
import { highlightJson } from '../../utils/highlight';
import HUGRVisualizer from './HUGRVisualizer';

interface Props {
  nodes: HUGRNode[];
  edges: HUGREdge[];
  json: string;
  isActive?: boolean;
  loading?: boolean;
  empty?: boolean;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}



export default function HUGRPanel({ nodes, edges, json, isActive, loading, empty, isFullscreen, onFullscreenToggle }: Props) {
  const [view, setView] = useState<'visualizer' | 'json'>('visualizer');

  return (
    <>
      <div className={`pv-panel ${isActive ? 'pv-panel--active pv-panel--blue' : ''} ${isFullscreen ? 'pv-panel--fullscreen' : ''}`}>
      <div className="panel-header">
        <span className="badge badge-blue">HUGR IR</span>
        <span className="panel-name">main.compile()</span>
        {!loading && (
          <div className="panel-actions">
            <button
              className={`action-btn ${view === 'visualizer' ? 'action-btn--on' : ''}`}
              onClick={() => setView('visualizer')}>
              visualizer
            </button>
            <button
              className={`action-btn ${view === 'json' ? 'action-btn--on' : ''}`}
              onClick={() => setView('json')}>
              json
            </button>
          </div>
        )}
        {onFullscreenToggle && (
          <button className="panel-fs-btn" onClick={onFullscreenToggle}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {isFullscreen ? (
                <path d="M5 1v4H1M12 5H8V1M8 12V8h4M1 8h4v4"/>
              ) : (
                <path d="M1 5V1h4M8 1h4v4M12 8v4H8M5 12H1V8"/>
              )}
            </svg>
          </button>
        )}
      </div>

      {empty ? (
        <div className="panel-empty">
          <span className="panel-empty-icon" style={{ color: 'var(--blue)' }}></span>
          <p>Run the pipeline to generate the HUGR IR graph</p>
        </div>
      ) : view === 'visualizer' ? (
        <HUGRVisualizer />
      ) : (
        <pre className="json-pre"
          dangerouslySetInnerHTML={{ __html: highlightJson(json) }} />
      )}

      <style>{`
        .json-pre {
          background: #f6f8fa;
          margin: 0; padding: 14px 16px;
          font-family: 'Roboto Mono', monospace; font-size: 11px; line-height: 1.7;
          color: #0d0f14; overflow: auto; max-height: 310px; white-space: pre;
          width: 100%; box-sizing: border-box;
        }
      `}</style>
    </div>
    </>
  );
}
