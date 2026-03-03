# GuppyFisher 🐟

> Learning Guppylang compiler internals in public.

A blog built with [Astro](https://astro.build) and MDX. Each post is a `.mdx` file
in `src/content/posts/` — write in Markdown, drop in custom components wherever you need them.

## Quick start

```bash
npm install
npm run dev      # localhost:4321
npm run build    # outputs to dist/
npm run preview  # preview the build locally
```

## Writing a new post

Create a file in `src/content/posts/your-slug.mdx`:

```mdx
---
title: "Your Post Title"
description: "One sentence summary shown in cards."
series: compiler          # concepts | compiler | deep-dives
seriesNumber: 4           # position within the series
pubDate: 2025-03-01
readingTime: "10 min"
prRef: "PR #1234"         # optional — links post to a GitHub PR
sourceFile: "guppylang/checker/foo.py"  # optional
---

import Callout from '../../components/Callout.astro';
import SourceRef from '../../components/SourceRef.astro';

Your content here. Standard Markdown works everywhere.

## A section heading

<Callout type="note" label="My note">
Use callouts for asides, warnings, and open questions.
</Callout>

<SourceRef file="guppylang/checker/linearity.py" lines="42-67" />

```python
# Syntax-highlighted code via Shiki
@guppy
def example(q: qubit) -> qubit:
    return q
```
```

## Components

| Component | Usage | Props |
|-----------|-------|-------|
| `<Callout>` | Highlighted aside | `type`: `note` \| `warning` \| `question`, `label` |
| `<SourceRef>` | Link to GitHub source | `file`, `lines`, `repo`: `guppylang` \| `hugr` |

## Deploy to GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

## Structure

```
src/
  components/
    Header.astro        # site header + nav
    PostCard.astro      # card used in the post grid
    Callout.astro       # MDX callout boxes
    SourceRef.astro     # links to GitHub source files
    SeriesNav.astro     # in-post series navigation
  content/
    config.ts           # post schema (frontmatter types)
    posts/              # your .mdx posts go here
  layouts/
    Base.astro          # HTML shell
    PostLayout.astro    # individual post page
  pages/
    index.astro         # homepage
    posts/[slug].astro  # dynamic post route
  styles/
    global.css          # design tokens + prose styles
```
