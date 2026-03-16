# Article Split Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split seven-pillars.html into two cross-referenced articles (The Lookup Table + The Endgame) with new diagrams and hero images, updating all site references.

**Architecture:** Two standalone HTML article pages following cloudpublica.org's existing patterns (build.js partials injection, Tailwind CSS via self-hosted stylesheet, `content-area` class for article body styling). Diagrams as inline SVG/HTML rather than PNG mermaid renders. Cross-references woven into body text like psychology-of-authoritarian-control.html.

**Tech Stack:** HTML, Tailwind CSS (build-time via `npx tailwindcss`), build.js (Node), self-hosted Inter font, no external requests.

**Spec:** `docs/superpowers/specs/2026-03-16-article-split-design.md`

**Source files:**
- Friend's rewrite: `structurally-curious/investigations/The Lookup Table v3.docx` (read via screenshots in conversation)
- New markdown: `structurally-curious/investigations/comprehensive-analysis-footnoted.md`
- Existing article for patterns: `article/psychology-of-authoritarian-control.html`

---

## Chunk 1: Site Cleanup and Article 1 (The Lookup Table)

### Task 1: Search and document all seven-pillars references

**Files:**
- Read: all HTML files in cloudpublica.org

- [ ] **Step 1: Search entire site for seven-pillars references**

Run: `grep -r "seven-pillars" cloudpublica.org/ --include="*.html" -l`

Document every file that references `seven-pillars.html` so we know what to update later.

- [ ] **Step 2: Search for hero-seven-pillars image references**

Run: `grep -r "hero-seven-pillars\|diagram-seven-pillars" cloudpublica.org/ --include="*.html" -l`

---

### Task 2: Create The Lookup Table HTML

**Files:**
- Create: `article/the-lookup-table.html`
- Reference: `article/psychology-of-authoritarian-control.html` (for HTML structure patterns)
- Reference: `article/seven-pillars.html` (for existing content to migrate)

- [ ] **Step 1: Write the article header (head, meta, JSON-LD, breadcrumb)**

Follow the exact pattern from psychology-of-authoritarian-control.html:
- `<title>`: "The Lookup Table: How the Federal Government Is Building a Profile of Every American — Cloud Publica"
- `og:title`, `twitter:title`: "The Lookup Table: How the Federal Government Is Building a Profile of Every American"
- `og:description`: "The US federal government is assembling a surveillance and control infrastructure through individually justified data collections that, when connected, create population-scale leverage. 50+ primary sources cited."
- `og:url`: `https://cloudpublica.org/article/the-lookup-table.html`
- `og:image`: `/assets/img/hero-the-lookup-table.jpg`
- `article:published_time`: `2026-03-16`
- JSON-LD: same schema as psychology article, headline updated
- `build:config {"nav":"investigations"}`
- Breadcrumb: Home / Articles / The Lookup Table
- Category badge: "Featured Investigation" (red, like seven-pillars)
- Date: March 16, 2026
- Source count: "50+ primary sources"
- Byline: placeholder div with comment `<!-- Byline: to be added -->`

- [ ] **Step 2: Write the opening section with inline cross-references**

Opening paragraph that establishes thesis and cross-references The Endgame:

> The US federal government is assembling a surveillance and control infrastructure through individually justified data collections that, when connected, create population-scale leverage. No single action is illegal. The capability emerges from the connections between databases, not from any individual database. Every fact in this analysis is drawn from public sources — court filings, whistleblower complaints, government documents, and investigative reporting.

Second paragraph with cross-reference:

> The ontology architecture that gives this data meaning — who counts as a threat, what confidence score triggers an arrest, what the system decides a marriage or a neighborhood *is* — is documented in [The Endgame](/article/the-endgame.html). This article documents what the system knows. That article documents what the system does with it.

- [ ] **Step 3: Write Key Findings box ("What Connects Them")**

Migrate from seven-pillars.html lines 114-155. Update to 8 steps (add Immigration & Enforcement). Keep the numbered circle UI pattern. Add step 8:

> 8. **Target and detain** — Elite app assigns confidence scores, 3,000 arrests/day quota, $38.3B detention infrastructure, 92,600 beds, Office of Remigration

- [ ] **Step 4: Write "The Pattern" section**

Migrate from seven-pillars.html lines 163-168. This is the thesis paragraph.

- [ ] **Step 5: Write Pillar 1 — Data Infrastructure**

Migrate from seven-pillars.html. Sections:
- DOGE Database Consolidation (IRS, SSA NUMIDENT, DOGE Supreme Court, LexisNexis, DHS Protester Database)
- State Voter Data Collection
- Selective Service / Draft Database
- Palantir: The Integration Layer (with subsections: Stated Ambition, Health Data, DOGE-Palantir Pipeline, Internal Language)
- ICE Surveillance Ecosystem (table from seven-pillars)
- LeakBase Seizure
- Epstein Files as Leverage
- The Assembled Profile (table)

Add inline cross-references:
- At Palantir section: link to [Anti-Surveillance Tech Market](/article/anti-surveillance-tech-market.html) for market data
- At LeakBase/Epstein: link to [AI Chat Legal Risks](/article/ai-chat-legal-risks.html) re: discoverable data
- At surveillance table: link to [Data Privacy & Sovereignty](/article/data-privacy-sovereignty-best-practices.html) for defense

Add new material from markdown:
- Cellebrite $118M breakdown (footnote 5a)
- ATS (Automated Targeting System) — add to surveillance table
- Carpenter v. United States context

- [ ] **Step 6: Write Pillar 2 — Legal Architecture**

Migrate from seven-pillars.html. Add inline cross-references:
- At NSPM-7: "The [BITE Model maps precisely](/article/psychology-of-authoritarian-control.html) to how these controls operate on individuals"
- At AI preemption: link to Data Privacy for personal defense
- Add EU AI Act contrast table from markdown (lines 540-549)

- [ ] **Step 7: Write Pillar 3 — Military Deployment**

Migrate from seven-pillars.html (QRF, Insurrection Act). Add cross-reference:
- "NATO's cognitive warfare doctrine, documented in our [5GW research](/article/5gw-research.html), operates at three levels..."

- [ ] **Step 8: Write Pillar 4 — Hemisphere War**

Migrate from seven-pillars.html (Operation Southern Spear, Iran costs, Noem).

- [ ] **Step 9: Write Pillar 5 — Election Control**

Migrate from seven-pillars.html. Add cross-reference:
- "The [spiral of silence](/article/psychology-of-authoritarian-control.html) — 86% who perceive minority opinion refuse to speak — explains why these mechanisms work even when the underlying legal basis is thin."

- [ ] **Step 10: Write Pillar 6 — Oversight Destruction**

Migrate from seven-pillars.html. Add cross-references:
- At DEF CON Franklin: "[The tools already exist](/article/open-source-transparency-tools.html) to make power visible — 60+ free instruments for investigation, monitoring, and accountability."
- At DOGE FOIA: link to MuckRock in transparency tools
- "When institutions fail, [community resilience frameworks](/research/rebuilding-resilience.html) become the remaining defense."

- [ ] **Step 11: Write Pillar 7 — Financial Architecture**

Migrate from seven-pillars.html (Board of Peace, Russia sanctions, ballroom donors). Add new material:
- White House ballroom full donor list from markdown
- DOE SPARK $1.9B program from markdown

- [ ] **Step 12: Write Pillar 8 — Immigration & Enforcement (NEW)**

New pillar from markdown material. Sections:
- **Stephen Miller — The Policy Chain**: role, Palantir stock ($100K-$250K), conflict of interest, arrest quotas (3,000/day "floor not ceiling"), Alex Pretti killing
- **Office of Remigration**: Renaud Camus origin, State Department creation, "remigration" vocabulary
- **Denaturalization**: Miller's "turbocharged" post, DOJ directive
- **Birthright citizenship**: "atrocity," Supreme Court case
- **Elite in Practice**: M-J-M-A v. Wamsley sworn testimony, "could say 100% and it's wrong"
- **Palantir Immigration Platforms**: ImmigrationOS, VOWS, ICM
- **Biometric Entry/Exit: 75-Year Retention**: final rule details
- **The $38.3 Billion Detention Infrastructure**: warehouses, 92,600 beds, untested contractors, military cargo planes, 390,000+ deported
- **Pregnant Children in Detention**: San Benito Texas, ages 13-17, half from rape
- **Irwin County**: "uterus collector" facility reopened
- **Chavarria v. DHS**: school superintendent detained, devices seized
- **CBP Directive 3340-049B**: expanded device search scope, 15-year retention in ATS

Cross-references:
- "The first person to challenge a National Security Letter in court — [Nicholas Merrill](/research/privacy-protection-nicholas-merrill.html) — fought for eleven years..."
- "The [vocabulary for naming](/research/vocabulary-is-infrastructure.html) what 'remigration' actually means — forcible removal of non-ethnically-European immigrants regardless of citizenship — is itself a defense against euphemism."
- Link to The Endgame for Miller's ideological background (SPLC emails, habeas corpus)

- [ ] **Step 13: Write remaining sections**

From seven-pillars.html, migrate:
- Project 2025: 53% Complete
- The Legal Record (all cases with docket numbers)
- Where The Money Goes
- AI Chat History: No Legal Protection
- Active Threats
- Methodology (update: "eight independently justified pillars")
- Appendix: Tools for Making Power Visible

Add cross-references:
- At AI Chat section: link to [AI Chat Legal Risks](/article/ai-chat-legal-risks.html)
- At Tools appendix: link to [Open-Source Transparency Tools](/article/open-source-transparency-tools.html)
- "[Naming what you experience](/research/naming-what-you-feel.html) — putting words to what you feel — changes your brain's response to it. The neuroscience confirms what this investigation documents: vocabulary is infrastructure."
- "[Fragmented communities rediscover each other](/research/connecting-isolated-voices.html) when the infrastructure for connection exists."

- [ ] **Step 14: Write Related Reading section and footer**

Related Reading list (all site articles):
- The Endgame
- 5GW Research
- Psychology of Authoritarian Control
- Open-Source Transparency Tools
- AI Chat Legal Risks
- Anti-Surveillance Tech Market
- Data Privacy & Sovereignty
- Vocabulary Is Infrastructure
- Naming What You Feel
- Connecting Isolated Voices
- Rebuilding Resilience
- Nicholas Merrill Story

Footer: `<!-- build:footer -->` and `<!-- build:scripts -->`

- [ ] **Step 15: Write all footnotes**

Convert all footnotes from the friend's rewrite + new material. Use the same HTML pattern as seven-pillars.html footnotes (or inline source-label pattern).

- [ ] **Step 16: Verify build**

Run: `cd cloudpublica.org && node build.js`

Expected: Build complete, no leftover tokens, the-lookup-table.html appears in dist/article/

- [ ] **Step 17: Verify in browser**

Open: `http://localhost:8080/article/the-lookup-table.html`

Check:
- All text renders (no white-on-white, no dark theme remnants)
- Cross-reference links work
- Tables render with proper styling
- Source labels visible
- Nav and footer injected correctly
- Mobile responsive

---

## Chunk 2: Article 2 (The Endgame)

### Task 3: Create The Endgame HTML

**Files:**
- Create: `article/the-endgame.html`
- Source: `structurally-curious/investigations/comprehensive-analysis-footnoted.md` (lines not used in Lookup Table)

- [ ] **Step 1: Write article header**

Same pattern as Task 2 Step 1:
- `<title>`: "The Endgame: How the Federal Government Deploys an Ontology Architecture That Defines What Is Real — Cloud Publica"
- `og:description`: "The US federal government is deploying an ontology architecture — a system that defines what entities exist, what relationships are valid, and what actions are permitted — across every domain of public life. 150+ primary sources cited."
- `og:url`: `https://cloudpublica.org/article/the-endgame.html`
- `og:image`: `/assets/img/hero-the-endgame.jpg`
- `article:published_time`: `2026-03-16`
- Source count: "150+ primary sources"
- Byline: Kristine Socall, MBA International Economic Development

- [ ] **Step 2: Write opening with cross-reference to The Lookup Table**

Summary paragraph from markdown line 7, then:

> The data infrastructure feeding this ontology — the assembled profile of every American built from individually legal database connections — is documented in [The Lookup Table](/article/the-lookup-table.html). This article documents the machine that decides what that data means.

- [ ] **Step 3: Write "The Model" section**

From markdown lines 13-38. Competitive authoritarianism, Levitsky quotes, Hungary model, 9-point system overview. This is the Key Findings equivalent.

Cross-reference:
- "The [psychological mechanisms of authoritarian control](/article/psychology-of-authoritarian-control.html) have been mapped for sixty years — from cults to cognitive warfare."

- [ ] **Step 4: Write "The Architect: Stephen Miller" section**

From markdown lines 43-64. The Endgame gets the IDEOLOGICAL material:
- Leaked SPLC emails (900 emails, VDARE, Camp of the Saints, Richard Spencer)
- Habeas corpus ("actively looking at")
- Democrats as "domestic extremist organization" → NSPM-7
- 1965 Immigration Act ("ruined America")

Cross-reference to Lookup Table for operational material:
- "Miller's operational role — the arrest quotas, the Palantir stock, the policy chain that killed two US citizens — is documented in [The Lookup Table](/article/the-lookup-table.html)."

- [ ] **Step 5: Write Part 1 — The Architecture**

From markdown lines 67-109. Sections:
- What Is an Ontology (software definition)
- How the Ontology Works (4 columns x 3 layers)
- Why This Matters ("confidence score is not a fact — it is a decision")
- The Federal Technology Stack (Palantir, Salesforce, AWS, Anthropic's Claude)

Cross-reference:
- At Claude/Anthropic mention: "[AI conversations have no legal privilege](/article/ai-chat-legal-risks.html) — a federal court has ruled they are discoverable in any proceeding."

- [ ] **Step 6: Write Part 2 — The Domains**

9 domains. Domains 1, 6, 7, 8 are BRIEF with links to Lookup Table. Domains 2, 3, 4, 5, 9 have full detail.

**Domain 1 — Data Infrastructure (brief):**
> The data infrastructure is fully documented in [The Lookup Table](/article/the-lookup-table.html). Eight databases — SSA, IRS, voter rolls, data brokers, Medicaid, platform data, Selective Service, SAVE — assemble a profile of every American. No law authorized the assembly. The ontology gives the data meaning.

**Domain 2 — Immigration & Enforcement:**
From markdown lines 174-247. Elite sworn testimony, VOWS, biometrics, detention, pregnant minors, Remigration. Cross-reference Lookup Table for full surveillance table and Miller operational details.

**Domain 3 — Military & Cognitive Warfare:**
From markdown lines 250-345. Full detail: Maven/AIP, Karp quotes (all three — a16z summit, CNBC, Lonsdale), Operation Southern Spear, NATO CogWar ($44.3M CEMA, newsletters, AI challenge), three operational levels, social influence bias, spiral of silence.

Cross-references:
- "NATO's cognitive warfare doctrine — documented in our [5GW research](/article/5gw-research.html) — identifies three operational levels..."
- "The [anti-surveillance technology market](/article/anti-surveillance-tech-market.html) — $36.75 billion in facial recognition alone — is the commercial infrastructure Palantir integrates."

**Domain 4 — Knowledge & Education (FULL, new material):**
From markdown lines 348-476. McMahon, DOE elimination, DEI, university funding settlements, NIH/NSF, Title IX, curriculum, book bans, K-12 surveillance, education as cognitive warfare.

Cross-references:
- "The [vocabulary for naming what's happening](/research/vocabulary-is-infrastructure.html) — intersectionality, systemic oppression, structural racism — is exactly what's being removed from curricula."
- "10,046 book ban instances. The [BITE Model](/article/psychology-of-authoritarian-control.html) calls this Information Control."

**Domain 5 — Healthcare:**
From markdown lines 479-491. Brief but standalone.

**Domain 6 — Election Control (brief):**
> The nine components converging on November 2026 are documented in [The Lookup Table](/article/the-lookup-table.html).

**Domain 7 — Legal Architecture (brief + EU contrast):**
Brief with link to Lookup Table, but includes the EU AI Act contrast table (markdown lines 540-549) because it's analytical, not factual.

**Domain 8 — Oversight Destruction (brief):**
> Documented in [The Lookup Table](/article/the-lookup-table.html).

**Domain 9 — Financial Architecture (brief + SPARK):**
Brief with link, adds SPARK $1.9B (markdown lines 632-636).

- [ ] **Step 7: Write Part 3 — The Cognitive Warfare Dimension**

From markdown lines 640-673. Sections:
- One Architecture, Three Scales (institutional/international/domestic)
- The BITE Model Connection (mapping B/I/T/E to the 9 domains)
- AI Safety Metrics Do Not Measure What They Claim

Cross-references:
- "The BITE Model — [mapped in full](/article/psychology-of-authoritarian-control.html) across sixty years of cult research — provides the individual-level diagnostic."
- "[Naming what you experience](/research/naming-what-you-feel.html) — affect labeling — is the neurological mechanism that makes the BITE Model's Information Control dangerous: when you can't name what's happening, your brain processes it differently."
- "[Fragmented communities](/research/connecting-isolated-voices.html) that can't find each other cannot mount collective resistance. This is the social level of cognitive warfare."

- [ ] **Step 8: Write Part 4 — What Connects Them**

From markdown lines 676-711. The assembled profile table (19 rows — expanded from Lookup Table's 8 with education, biometric, CBP, cognitive warfare rows). PEADs. Project 2025: 53%.

Cross-reference:
- "The core assembled profile — the eight databases that build the dossier — is documented in [The Lookup Table](/article/the-lookup-table.html). The table below adds what the ontology contributes: classification, scoring, retention, and action."

- [ ] **Step 9: Write remaining sections**

- The Legal Record (full 15+ cases, including education litigation table from markdown lines 761-774)
- AI Chat History: No Legal Protection
- Methodology (includes framing shift from "Seven Pillars" to "ontology architecture")
- Appendix: Tools for Making Power Visible
- Related Reading (all articles + The Lookup Table)
- Footnotes (full ~60)

Cross-references:
- At methodology: "Whoever controls the ontology controls what questions can be asked. Whoever maintains [shared vocabulary](/research/vocabulary-is-infrastructure.html) restores the ability to ask them. That is [why The Word exists](/word/)."
- At tools: "[Open-Source Transparency Tools](/article/open-source-transparency-tools.html) — 60+ free instruments for investigation, monitoring, and accountability."
- "[For personal data defense](/article/data-privacy-sovereignty-best-practices.html) — reducing what is collected, limiting who can access it, and keeping data within jurisdictions you trust."

- [ ] **Step 10: Verify build**

Run: `cd cloudpublica.org && node build.js`

- [ ] **Step 11: Verify in browser**

Open: `http://localhost:8080/article/the-endgame.html`

Same checks as Task 2 Step 17.

---

## Chunk 3: Site Updates, Diagrams, and Cleanup

### Task 4: Update index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update flagship card**

Replace seven-pillars flagship (lines 60-73) with The Endgame:
- `href="/article/the-endgame.html"`
- `hero-the-endgame.jpg` (or gradient fallback until image exists)
- Title: "The Endgame: How the Federal Government Deploys an Ontology Architecture That Defines What Is Real"
- Description: updated from spec
- Source count: "150+ sources"
- Date: "Mar 16, 2026"

- [ ] **Step 2: Add The Lookup Table as second featured card**

Add a second card between the flagship and the 3-column grid. Style like the flagship but smaller (or as first card in the grid, spanning `md:col-span-2` if that looks better):
- `href="/article/the-lookup-table.html"`
- Title: "The Lookup Table: How the Federal Government Is Building a Profile of Every American"
- Badge: "Featured Investigation"
- Date: "Mar 16, 2026"
- Source count: "50+ sources"

---

### Task 5: Update article/index.html

**Files:**
- Modify: `article/index.html`

- [ ] **Step 1: Replace seven-pillars flagship entry**

Replace the seven-pillars card (lines 36-50) with The Endgame as flagship.

- [ ] **Step 2: Add The Lookup Table card**

Add as second featured card (before the regular grid), same `md:col-span-2` pattern or as first grid item.

---

### Task 6: Update cross-references in existing articles

**Files:**
- Modify: any files found in Task 1 that reference `seven-pillars.html`

- [ ] **Step 1: Update all seven-pillars links**

For each file referencing `seven-pillars.html`:
- If the reference is about data/surveillance/lookup: change to `/article/the-lookup-table.html`
- If the reference is about architecture/ontology/system: change to `/article/the-endgame.html`
- If ambiguous: link to The Endgame (it's the flagship)

---

### Task 7: Delete seven-pillars.html

**Files:**
- Delete: `article/seven-pillars.html`

- [ ] **Step 1: Verify no remaining references**

Run: `grep -r "seven-pillars" cloudpublica.org/ --include="*.html" -l`

Expected: no results (or only in dist/ which gets rebuilt)

- [ ] **Step 2: Delete the file**

Run: `rm cloudpublica.org/article/seven-pillars.html`

---

### Task 8: Generate diagrams for The Lookup Table

**Files:**
- Create: inline SVG/HTML diagrams within `the-lookup-table.html`

These are HTML/CSS/SVG diagrams rendered inline (not external PNGs). They should match the site's light theme (bg-[#f5f5f5], cp-teal #206795, cp-cyan #38c1e0, red-700 for danger items, gray-200 borders).

- [ ] **Step 1: Hub-and-spoke diagram (8 pillars + assembled profile center)**

Recreate friend's diagram in HTML/CSS. 8 boxes around a central "ASSEMBLED PROFILE" circle. Dashed connecting lines. Caption: "Each pillar feeds the next. War justifies emergency powers; emergency powers enable surveillance; surveillance enables election control; election control prevents correction."

- [ ] **Step 2: Assembled profile flow diagram (databases → one dossier)**

8 database boxes on left flowing into "ONE AMERICAN" box on right. Red callout: "NO LAW AUTHORIZED THIS." Caption: "Each database has an independent legal justification. The profile emerges from the connections — not from any individual database."

- [ ] **Step 3: Election convergence diagram (9 components → Nov 2026)**

9 boxes radiating from central "NOV 2026" circle. Caption: "Nine independently justified components — voter ID, surveillance tools, armed deployment, security elimination, legislative leverage — all converge on the same election."

- [ ] **Step 4: Oversight destruction timeline (Jan 2025 → Mar 2026)**

Horizontal timeline with events plotted. Caption: "Every self-correcting mechanism — oversight agencies, election security, civil service protections, cybersecurity sharing — was degraded or eliminated in the same 14-month window."

---

### Task 9: Generate diagrams for The Endgame

**Files:**
- Create: inline SVG/HTML diagrams within `the-endgame.html`

- [ ] **Step 1: Ontology matrix diagram (4 columns x 3 layers)**

Grid showing Data/Logic/Action/Security columns and Language/Engine/Toolchain layers. Each cell has a brief label (e.g., Language+Data = "definitions, categories"). Caption: "The ontology defines what entities exist, what relationships are valid, and what actions are permitted."

- [ ] **Step 2: Three scales diagram (institutional/international/domestic)**

Three concentric rings or three connected boxes showing how the same architecture operates at institutional (Palantir), international (NATO CogWar), and domestic (education) scales. Caption: "One architecture, three scales."

- [ ] **Step 3: BITE Model mapping diagram**

4-quadrant layout: Behavior/Information/Thought/Emotional. Each quadrant lists 2-3 domain examples. Caption: "The BITE Model maps what cognitive warfare looks like at individual and institutional scale."

- [ ] **Step 4: EU AI Act contrast diagram**

Two-column comparison: "EU BANS" (with prohibition articles) vs "US SUBSIDIZES" (with equivalent US programs). Red/green color coding. Caption: "What Europe criminalizes, America subsidizes."

---

### Task 10: Generate hero images

**Files:**
- Create: `assets/img/hero-the-lookup-table.jpg`
- Create: `assets/img/hero-the-endgame.jpg`

- [ ] **Step 1: Create hero image for The Lookup Table**

Use CSS gradient as placeholder in the HTML (`bg-gradient-to-br from-[#1a3347] to-[#0d1a24]`). The `onerror` fallback pattern is already in use on other cards.

Note: actual image generation requires external tool (Canva MCP or similar). For now, use gradient placeholder.

- [ ] **Step 2: Create hero image for The Endgame**

Same approach: CSS gradient placeholder.

---

### Task 11: Rebuild CSS and final build

**Files:**
- Modify: `assets/css/style.css` (if new Tailwind classes used)

- [ ] **Step 1: Rebuild Tailwind CSS**

Run: `cd cloudpublica.org && npx tailwindcss -i assets/css/input.css -o assets/css/style.css --minify`

- [ ] **Step 2: Run full build**

Run: `cd cloudpublica.org && node build.js`

Expected: Build complete, no leftover tokens, both new articles in dist/

- [ ] **Step 3: Full site verification**

Open each page and verify:
- `http://localhost:8080/` — flagship card points to The Endgame, Lookup Table card visible
- `http://localhost:8080/article/` — both new articles listed, seven-pillars gone
- `http://localhost:8080/article/the-lookup-table.html` — renders correctly, all cross-references work
- `http://localhost:8080/article/the-endgame.html` — renders correctly, all cross-references work
- `http://localhost:8080/article/seven-pillars.html` — returns 404
- All existing articles — verify no broken seven-pillars links remain

- [ ] **Step 4: Commit**

```bash
git add article/the-lookup-table.html article/the-endgame.html index.html article/index.html
git add -u  # picks up deleted seven-pillars.html and modified files
git commit -m "feat: split seven-pillars into The Lookup Table + The Endgame

Two cross-referenced investigations replacing the single seven-pillars article.
The Lookup Table: data infrastructure, 8 pillars, assembled profile.
The Endgame: ontology architecture, cognitive warfare, education, BITE mapping.
Inline cross-references woven across all 12 site articles."
```
