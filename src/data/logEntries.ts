export interface LogItem {
  type: string;
  label: string;
  title: string;
  body: string | null;
  link: string | null;
  linkLabel: string | null;
}

export interface LogDay {
  date: string;
  items: LogItem[];
}

export interface LogWeek {
  week: string;
  days: LogDay[];
}

export const entries: LogWeek[] = [
  {
    week: 'Week of Apr 13, 2026',
    days: [
       {
        date: 'Wed Apr 15',
        items: [
          { type: 'video', label: 'Video', title: 'A visit to Quantinuum\'s Reimei quantum computer at Riken\'s facility in Wako, Japan', body: null, link: 'https://www.youtube.com/watch?v=FSMe1RtnA1Y', linkLabel: 'watch' },
        ],
      },{
        date: 'Tue Apr 14',
        items: [
          { type: 'webinar', label: 'Webinar', title: 'NVIDIA Quantum Day: AI for Applications: Unlocking Quantum Algorithms at Scale (Steve Clark, Head of AI, Quantinuum)', body: null, link: "https://www.nvidia.com/en-us/events/quantum-day/", linkLabel: null },
        ],
      },
     
    ],
  },
  {
    week: 'Week of Mar 23, 2026',
    days: [
      {
        date: 'Thu Mar 27',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1589 docs: Improve docstrings for angles.py', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1589', linkLabel: 'view PR' },
        ],
      },
    ],
  },
  {
    week: 'Week of Mar 9, 2026',
    days: [
      {
        date: 'Fri Mar 13',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1551 fix: Nested modifier propagation', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1551', linkLabel: 'view PR' },
          { type: 'community', label: 'Q-Net', title: 'Q-Net Connect 2026: Day 2: Various Talks', body: null, link: null, linkLabel: null },
        ],
      },
      {
        date: 'Thu Mar 12',
        items: [
          { type: 'community', label: 'Q-Net', title: 'Q-Net Connect 2026: Day 1 — From Qubits to Code: Quantinuum for Developers (Dr. Seyon Sivarajah)', body: null, link: null, linkLabel: null },
        ],
      },
    ],
  },
  {
    week: 'Week of Mar 2, 2026',
    days: [
      {
        date: 'Thu Mar 5',
        items: [
          { type: 'community', label: 'Q-Net', title: 'Joined Q-Net Community', body: null, link: 'https://www.quantinuum.com/q-net', linkLabel: 'learn more' },
          { type: 'webinar',   label: 'Webinar', title: 'Helios Unlocks a New Frontier in Superconductivity', body: null, link: 'https://www.quantinuum.com/webinar/helios-unlocks-a-new-frontier-in-superconductivity', linkLabel: 'watch' },
        ],
      },
    ],
  },
  {
    week: 'Week of Feb 23, 2026',
    days: [
      {
        date: 'Fri Feb 27',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1527 feat: Improve error message for passing non-comptime values into comptime', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1527', linkLabel: 'view PR' },
        ],
      },
    ],
  },
  {
    week: 'Week of Feb 16, 2026',
    days: [
      {
        date: 'Wed Feb 18',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1496 fix: Resolve relative wasm file paths from calling file', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1496', linkLabel: 'view PR' },
          { type: 'pr', label: 'PR', title: 'PR #1501 feat: Improve error message for failed borrows due to failed leaf borrows', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1501', linkLabel: 'view PR' },
        ],
      },
      {
        date: 'Tue Feb 17',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1497 fix: Misleading error message for leaked qubits', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1497', linkLabel: 'view PR' },
          { type: 'pr', label: 'PR', title: 'PR #1498 feat: Add missing bool methods (__rxor__, __rand__, __ror__)', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1498', linkLabel: 'view PR' },
        ],
      },
    ],
  },
  {
    week: 'Week of Feb 9, 2026',
    days: [
      {
        date: 'Tue Feb 10',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1459 feat: Add function to swap two array elements that lowers to hugr swap op', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1459', linkLabel: 'view PR' },
          { type: 'pr', label: 'PR', title: 'PR #1469 feat: Compile time array indexing linearity check for literal indices', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1469', linkLabel: 'view PR' },
        ],
      },
      {
        date: 'Mon Feb 9',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1484 fix: Misleading error message when trying to load a list of numpy integers using comptime', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1484', linkLabel: 'view PR' },
        ],
      },
    ],
  },
  {
    week: 'Week of Jan 26, 2026',
    days: [
      {
        date: 'Wed Jan 28',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1448 feat: Compile time array bounds check for literal indices', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1448', linkLabel: 'view PR' },
        ],
      },
    ],
  },
  {
    week: 'Week of Jan 19, 2026',
    days: [
      {
        date: 'Wed Jan 21',
        items: [
          { type: 'video', label: 'Video', title: 'Introducing Guppy: Our Quantum-first Programming Language', body: null, link: 'https://www.youtube.com/watch?v=0o-NlN5y1hY', linkLabel: 'watch' },
          { type: 'video', label: 'Video', title: 'How Guppy Got Its Name', body: null, link: 'https://www.youtube.com/watch?v=Amm3QJbpKFA', linkLabel: 'watch' },
        ],
      },
    ],
  },
  {
    week: 'Week of Jan 5, 2026',
    days: [
      {
        date: 'Sat Jan 10',
        items: [
          { type: 'pr', label: 'PR', title: 'PR #1428 docs: Added documentation for Issue #1213 — Add API docs for std modules', body: null, link: 'https://github.com/Quantinuum/guppylang/pull/1428', linkLabel: 'view PR' },
        ],
      },
    ],
  },
  {
    week: 'Week of Dec 15, 2025',
    days: [
      {
        date: 'Tue Dec 16',
        items: [
          { type: 'webinar', label: 'Webinar', title: 'Quantum Computing With Real-World Impact', body: null, link: 'https://www.quantinuum.com/webinar/an-overview-of-our-helios-quantum-computer', linkLabel: 'watch' },
          { type: 'webinar', label: 'Webinar', title: "Unpack the Stack: An Introduction to Quantinuum's Next-Generation Software Stack", body: null, link: 'https://www.quantinuum.com/webinar/unpack-the-stack', linkLabel: 'watch' },
        ],
      },
    ],
  },
];

export const typeColors: Record<string, string> = {
  pr:        'var(--accent2)',
  video:     '#7c5cbf',
  webinar:   '#b06d2a',
  community: 'var(--accent)',
};

export const flatEntries = entries.flatMap(w =>
  w.days.flatMap(d =>
    d.items.map(item => ({ weekLabel: w.week, date: d.date, ...item }))
  )
);
