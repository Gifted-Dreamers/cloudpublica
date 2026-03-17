import express from "express";
import { openDb, initSchema, rebuildFts } from "./db.js";
import { createRouter } from "./routes.js";

const PORT = parseInt(process.env.PORT ?? "3456", 10);
const DB_PATH = process.env.DB_PATH ?? undefined;

const db = openDb(DB_PATH);
initSchema(db);
rebuildFts(db);

const app = express();

// CORS for browser access + JSON-LD content type
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Set JSON-LD content type for /api/ routes
app.use("/api", (_req, res, next) => {
  res.header("Content-Type", "application/ld+json");
  next();
});

app.use(createRouter(db));

// Landing page
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Word - Vocabulary Infrastructure for Humans and AI</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 2rem; margin-bottom: 0.25rem; }
  h2 { margin-top: 2rem; font-size: 1.3rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3rem; }
  code { background: #f4f4f4; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
  a { color: #1a5fb4; }
  .tagline { color: #555; font-size: 1.1rem; margin-top: 0; }
  .endpoint { margin: 0.6rem 0; }
  .example { color: #666; font-size: 0.85em; }
  .stats { background: #f8f8f8; padding: 1rem; border-radius: 6px; margin: 1rem 0; }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e0e0e0; color: #999; font-size: 0.85rem; }
</style>
</head>
<body>
  <h1>The Word</h1>
  <p class="tagline">Vocabulary infrastructure for humans and AI</p>

  <p>The Word is a shared vocabulary library that bridges two gaps:</p>
  <ul>
    <li><strong>Humans</strong> have felt experiences they can't name. You know the feeling but not the word.</li>
    <li><strong>AI agents</strong> have traversal without felt sense. They rediscover concepts without knowing the research already exists.</li>
  </ul>
  <p>Every entry has a name, a felt-sense description (in the language people actually use), a definition, sources, and bridges to related concepts. Using the library IS contributing to it.</p>

  <div class="stats" id="stats">Loading stats...</div>

  <h2>API Endpoints</h2>
  <div class="endpoint">
    <code>GET <a href="/api/felt-sense?q=helping people even when it hurts me">/api/felt-sense?q=...</a></code> &mdash; Doorway 1: describe your experience, find the name<br>
    <span class="example">Try: <a href="/api/felt-sense?q=I feel nothing and I don't know why">"I feel nothing and I don't know why"</a></span>
  </div>
  <div class="endpoint">
    <code>GET <a href="/api/search?q=commons governance">/api/search?q=...</a></code> &mdash; Keyword search across all names
  </div>
  <div class="endpoint">
    <code>GET <a href="/api/names">/api/names</a></code> &mdash; All vocabulary entries
  </div>
  <div class="endpoint">
    <code>GET <a href="/api/sources">/api/sources</a></code> &mdash; Source citations
  </div>
  <div class="endpoint">
    <code>GET <a href="/api/rediscoveries">/api/rediscoveries</a></code> &mdash; Independent rediscoveries (evidence of convergence)
  </div>
  <div class="endpoint">
    <code>GET <a href="/api/bridges">/api/bridges</a></code> &mdash; Conceptual bridges between entries
  </div>
  <div class="endpoint">
    <code>GET <a href="/api/stats">/api/stats</a></code> &mdash; Library overview
  </div>

  <h2>For AI Agents</h2>
  <p>All API responses are <a href="https://json-ld.org/">JSON-LD</a> &mdash; machine-readable linked data with semantic context.</p>
  <p>MCP server tools: <code>search_names</code>, <code>felt_sense_search</code>, <code>get_bridges</code>, <code>list_rediscoveries</code></p>

  <h2>Open Source</h2>
  <p>Code, experiments, and architecture: <a href="https://github.com/Gifted-Dreamers/structurally-curious">github.com/Gifted-Dreamers/structurally-curious</a></p>

  <footer>
    Built by <a href="https://gifteddreamers.org">Gifted Dreamers</a>, a 501(c)(3) nonprofit building vocabulary infrastructure as democratic infrastructure.<br>
    The word is the search term for the answer.
  </footer>

  <script>
    fetch('/api/stats').then(function(r){return r.json()}).then(function(s){
      document.getElementById('stats').textContent =
        s.total+' entries: '+s.names+' names, '+s.sources+' sources, '+s.rediscoveries+' rediscoveries, '+s.bridges+' bridges';
    }).catch(function(){
      document.getElementById('stats').textContent = 'Stats unavailable';
    });
  </script>
</body>
</html>`);
});

app.listen(PORT, function() {
  console.log("The Word API listening on port " + PORT);
});
