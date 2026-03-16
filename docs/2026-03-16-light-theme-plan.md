# CloudPublica Light Theme + Privacy-Hardened Deploy Plan

**Date:** 2026-03-16
**Status:** IN PROGRESS
**Deadline:** Mozilla application — March 16, 11:59pm PT
**Goal:** CloudPublica looks professional, reads well, and makes zero external requests when Mozilla reviewers click the demo links.

---

## Current State

- **Body bg:** Changed to `#f5f5f5` on index.html only. Article/research pages still have dark inline content styles (white text on what is now a light bg — broken).
- **Tracking:** Tailwind CDN (`cdn.tailwindcss.com`) and Google Fonts (`fonts.googleapis.com`) on every page. Both phone home. Contradicts "No tracking" promise.
- **Flagship article:** Still `seven-pillars.html` with old content. New ontology architecture markdown is written but not converted to HTML yet.
- **Nav:** Working on desktop (hidden on mobile until hamburger clicked). Links are white on dark header — correct.
- **Footer:** Updated to remove "platform." Still dark — correct.
- **Hero (index.html):** Updated with "Investigations · Research · Civic Infrastructure" tagline, white text on dark gradient — correct.

---

## Phase 1: Privacy Hardening (do before deploy)

### 1a. Self-host Inter font
- Copy `inter-latin.woff2` and `inter-latin-ext.woff2` from justNICE.us to `cloudpublica.org/assets/fonts/`
- Add `@font-face` declarations to CSS (same pattern as justNICE `input.css`)

### 1b. Build-time Tailwind
- Install tailwindcss as dev dependency: `npm install -D tailwindcss`
- Create `tailwind.config.js` with cp-teal/cp-cyan/cp-dark/cp-muted colors and Inter font
- Create `assets/css/input.css` with `@tailwind base/components/utilities` + `@font-face` declarations
- Add build script to package.json: `"css": "npx tailwindcss -i assets/css/input.css -o assets/css/style.css --minify"`
- Update build.js to run CSS build first, or run manually before `node build.js`

### 1c. Remove external requests from all HTML files
- Remove `<script src="https://cdn.tailwindcss.com/3.4.17"></script>` and the inline `tailwind.config` script block
- Remove `<link rel="preconnect" href="https://fonts.googleapis.com">` and related Google Fonts `<link>` tags
- Replace with `<link rel="stylesheet" href="/assets/css/style.css">`
- **All 16 source HTML files** need this change

### 1d. Verify zero external requests
- Open in browser dev tools → Network tab
- Confirm no requests to googleapis.com, gstatic.com, cdn.tailwindcss.com, or any other external domain
- Only requests should be to localhost (or cloudpublica.org in production)

---

## Phase 2: Light Theme — Content Pages

### 2a. Create shared content-area CSS
Instead of inline `<style>` blocks in every article, create shared styles in `input.css`:

```css
/* Light theme content area */
.content-area table thead th {
  background-color: #206795;
  color: #fff;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #206795;
}
.content-area table tbody td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}
.content-area table tbody tr { background-color: #ffffff; }
.content-area table tbody tr:nth-child(even) { background-color: #f9fafb; }
.content-area table tbody tr:hover { background-color: rgba(32, 103, 149, 0.06); }

.content-area blockquote {
  border-left: 4px solid #206795;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  background-color: #f0f7fa;
  border-radius: 0 0.5rem 0.5rem 0;
  color: #374151;
}

.content-area a { color: #206795; text-decoration: none; }
.content-area a:hover { text-decoration: underline; }

.content-area hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2.5rem 0;
}

.source-label { font-size: 0.85rem; color: #6b7280; }
.source-label a { color: #206795; }

.diagram-figure .diagram-container {
  border: 1px solid #e5e7eb;
}
.diagram-figure .diagram-container::after {
  background: linear-gradient(transparent, #f5f5f5);
}
```

### 2b. Update Tailwind classes in all pages
For every article/research/about page, replace dark-theme Tailwind classes:

| Dark class | Light replacement |
|-----------|------------------|
| `text-white` (in content) | `text-gray-900` |
| `text-white/80` | `text-gray-700` |
| `text-white/60` | `text-gray-500` |
| `text-white/50` | `text-gray-400` |
| `text-white/30` | `text-gray-300` |
| `bg-white/5` | `bg-white` |
| `border-white/10` | `border-gray-200` |
| `bg-gradient-to-br from-[#0f2027] via-[#1a3347] to-[#0d1a24]` | Keep for hero sections only |
| `hover:border-cp-cyan/40` | `hover:border-cp-teal/60` |

**Keep dark:** Header (`bg-[#0f1a24]`), footer (`bg-[#0a1218]`), hero gradient sections, "About callout" CTA box.

### 2c. Remove inline `<style>` blocks from articles
Once shared CSS is in `style.css`, remove the `<style>...</style>` blocks from each article page to keep them DRY.

---

## Phase 3: Ontology Architecture Article

### 3a. Convert markdown to HTML
- Source: `investigations/comprehensive-analysis-footnoted.md`
- Target: `article/ontology-architecture.html`
- Use the article template structure from seven-pillars.html (breadcrumb, hero, key findings box, content-area, footnotes)
- Update all internal links

### 3b. Update index.html flagship card
- Already done: card points to seven-pillars.html but shows new title/description
- Change `href` to `ontology-architecture.html` once the new page exists
- Keep seven-pillars.html as a redirect to the new URL

### 3c. Generate diagrams
- 5 Mermaid diagrams (ontology architecture, domain connections, cogwar spectrum, assembled profile, timeline)
- Render via local `mmdc` CLI to PNG
- Place in `assets/diagrams/`
- Embed in ontology-architecture.html with click-to-expand

### 3d. Update article index page
- `article/index.html` — add ontology-architecture as featured, demote seven-pillars or redirect

---

## Phase 4: The Word Page (for Mozilla demo)

### 4a. Create research page or dedicated page for The Word
- Source: `naming-library-architecture.md` + `living-library-v2-architecture.md` + `contribution-architecture-draft.md`
- Audience: Mozilla reviewers seeing the demo link
- Content: What The Word is, the symmetric problem it solves, the 8 doorways, the 360-degree contribution flow
- Link to live demo: word.cloudpublica.org

---

## Phase 5: Deploy

### 5a. Build
```bash
npx tailwindcss -i assets/css/input.css -o assets/css/style.css --minify
node build.js
```

### 5b. Push to GitHub
- `git add . && git commit && git push origin main`
- GitHub Actions auto-deploys to CF Pages

### 5c. Verify behind dev lock
- CF Access dev lock (only bee@justnice.us) — already configured
- Access app ID: `b230ce64-9fb6-48fd-b256-fc9b145c6260`
- Test all pages render correctly

### 5d. Remove dev lock for Mozilla submission
- Temporarily open CF Access so Mozilla reviewers can see the site
- Or: add specific Mozilla reviewer emails to the access policy

---

## File Inventory (source pages to update)

| File | Status |
|------|--------|
| `index.html` | Body bg updated. Hero updated. Cards updated to light. |
| `article/index.html` | Body bg updated. Content styles need light theme. |
| `article/seven-pillars.html` | Body bg updated. Inline styles still dark. Needs redirect or content update. |
| `article/ontology-architecture.html` | **DOES NOT EXIST YET** — Phase 3 |
| `article/5gw-research.html` | Body bg updated. Inline styles still dark. |
| `article/ai-chat-legal-risks.html` | Body bg updated. Inline styles still dark. |
| `article/anti-surveillance-tech-market.html` | Body bg updated. Inline styles still dark. |
| `article/data-privacy-sovereignty-best-practices.html` | Body bg updated. Inline styles still dark. |
| `article/open-source-transparency-tools.html` | Body bg updated. Inline styles still dark. |
| `article/psychology-of-authoritarian-control.html` | Body bg updated. Inline styles still dark. |
| `research/index.html` | Body bg updated. Content styles need light theme. |
| `research/connecting-isolated-voices.html` | Body bg updated. Inline styles still dark. |
| `research/naming-what-you-feel.html` | Body bg updated. Inline styles still dark. |
| `research/privacy-protection-nicholas-merrill.html` | Body bg updated. Inline styles still dark. |
| `research/rebuilding-resilience.html` | Body bg updated. Inline styles still dark. |
| `research/vocabulary-is-infrastructure.html` | Body bg updated. Inline styles still dark. |
| `about/index.html` | Body bg updated. Content styles need light theme. |
| `_partials/nav.html` | Dark header — correct, no change needed. |
| `_partials/footer.html` | Dark footer — correct. "Platform" removed. |
| `_partials/scripts.html` | Mobile menu toggle — no change needed. |

---

## Priority Order (for Mozilla deadline)

1. **Phase 1** (privacy hardening) — MUST before deploy
2. **Phase 2** (light theme content pages) — MUST before deploy
3. **Phase 3a-b** (ontology article HTML) — SHOULD for Mozilla
4. **Phase 4** (The Word page) — SHOULD for Mozilla
5. **Phase 3c** (diagrams) — NICE TO HAVE
6. **Phase 5** (deploy) — MUST

## Resume Prompt
> "Continue CloudPublica light theme + deploy per `docs/2026-03-16-light-theme-plan.md`. Phase 1 first (self-host fonts, build-time Tailwind, remove external requests). Then Phase 2 (light content styles). Then Phase 3 (ontology article HTML). Dev server already running at localhost:8080."
