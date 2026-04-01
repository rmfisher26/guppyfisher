// src/utils/highlight.ts
// Lightweight regex-based syntax highlighters for Guppy and HUGR JSON
// No external deps — works in both SSR (Astro) and client (React)

export function highlightGuppy(code: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Single-pass: match all token types in priority order so already-wrapped
  // spans are never re-processed by a later regex.
  return escaped.replace(
    /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@[\w.]+)|\b(from|import|def|return|tuple|if|else|for|in|as|not|and|or|True|False|None)\b|\b(qubit|int|bool|float|GuppyModule|array|str)\b|\b(\d[\d.e-]*)\b|([a-z_]\w*)(?=\s*\()/g,
    (_m, com, str, dec, kw, typ, num, fn) => {
      if (com !== undefined) return `<span class="hl-com">${com}</span>`;
      if (str !== undefined) return `<span class="hl-str">${str}</span>`;
      if (dec !== undefined) return `<span class="hl-dec">${dec}</span>`;
      if (kw  !== undefined) return `<span class="hl-kw">${kw}</span>`;
      if (typ !== undefined) return `<span class="hl-typ">${typ}</span>`;
      if (num !== undefined) return `<span class="hl-num">${num}</span>`;
      if (fn  !== undefined) return `<span class="hl-fn">${fn}</span>`;
      return _m;
    }
  );
}

export function highlightJson(json: string): string {
  return json
    .replace(/("(?:type|name|parent|input|output|qubits|qubit|t|edges|nodes|op|signature)")\s*:/g,
             m => `<span class="hl-jkey">${m}</span>`)
    .replace(/:\s*(".*?")/g, (_, v) => `: <span class="hl-jstr">${v}</span>`)
    .replace(/:\s*(\d+)/g,   (_, v) => `: <span class="hl-jnum">${v}</span>`)
    .replace(/\b(true|false|null)\b/g, m => `<span class="hl-jkw">${m}</span>`);
}
