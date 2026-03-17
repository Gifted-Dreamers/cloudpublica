import { Router } from "express";
import type { Request, Response } from "express";
import type Database from "better-sqlite3";
import {
  wrapCollection, wrapName, wrapSource, wrapRediscovery, wrapBridge
} from "./jsonld.js";

type Row = Record<string, unknown>;

// Convert a natural-language query into FTS5 OR-joined tokens
// "helping people even when it hurts" → "helping OR people OR even OR when OR hurts"
function toFtsQuery(q: string): string {
  const stopWords = new Set([
    "i", "me", "my", "the", "a", "an", "and", "or", "but", "in", "on",
    "at", "to", "for", "of", "it", "is", "was", "be", "do", "that",
    "this", "with", "not", "from", "have", "has", "had", "when", "even"
  ]);
  const tokens = q
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 1 && !stopWords.has(t));
  if (tokens.length === 0) return q;
  return tokens.join(" OR ");
}

export function createRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/names
  router.get("/api/names", (_req: Request, res: Response) => {
    const rows = db.prepare("SELECT * FROM names ORDER BY name").all() as Row[];
    res.json(wrapCollection("Name", rows.map(wrapName)));
  });

  // GET /api/names/:id
  router.get("/api/names/:id", (req: Request, res: Response) => {
    const row = db.prepare("SELECT * FROM names WHERE id = ?").get(req.params.id) as Row | undefined;
    if (!row) { res.status(404).json({ error: "Name not found" }); return; }
    res.json(wrapName(row));
  });

  // GET /api/search?q=commons+governance — keyword search
  router.get("/api/search", (req: Request, res: Response) => {
    const q = req.query.q;
    if (!q || typeof q !== "string") { res.status(400).json({ error: "?q= required" }); return; }
    const rows = db.prepare(`
      SELECT names.* FROM names_fts
      JOIN names ON names.rowid = names_fts.rowid
      WHERE names_fts MATCH ?
      ORDER BY rank
      LIMIT 20
    `).all(q) as Row[];
    res.json(wrapCollection("SearchResult", rows.map(wrapName)));
  });

  // GET /api/felt-sense?q=I+keep+helping+people+even+when+it+hurts
  // Doorway 1: natural language → OR-joined FTS query
  router.get("/api/felt-sense", (req: Request, res: Response) => {
    const q = req.query.q;
    if (!q || typeof q !== "string") { res.status(400).json({ error: "?q= required" }); return; }
    const ftsQuery = toFtsQuery(q);
    const rows = db.prepare(`
      SELECT names.* FROM names_fts
      JOIN names ON names.rowid = names_fts.rowid
      WHERE names_fts MATCH ?
      ORDER BY rank
      LIMIT 10
    `).all(ftsQuery) as Row[];
    res.json(wrapCollection("FeltSenseResult", rows.map(wrapName)));
  });

  // GET /api/sources
  router.get("/api/sources", (_req: Request, res: Response) => {
    const rows = db.prepare("SELECT * FROM sources ORDER BY name").all() as Row[];
    res.json(wrapCollection("Source", rows.map(wrapSource)));
  });

  // GET /api/sources/:id
  router.get("/api/sources/:id", (req: Request, res: Response) => {
    const row = db.prepare("SELECT * FROM sources WHERE id = ?").get(req.params.id) as Row | undefined;
    if (!row) { res.status(404).json({ error: "Source not found" }); return; }
    res.json(wrapSource(row));
  });

  // GET /api/rediscoveries
  router.get("/api/rediscoveries", (_req: Request, res: Response) => {
    const rows = db.prepare("SELECT * FROM rediscoveries ORDER BY date_observed DESC").all() as Row[];
    res.json(wrapCollection("Rediscovery", rows.map(wrapRediscovery)));
  });

  // GET /api/rediscoveries/:id
  router.get("/api/rediscoveries/:id", (req: Request, res: Response) => {
    const row = db.prepare("SELECT * FROM rediscoveries WHERE id = ?").get(req.params.id) as Row | undefined;
    if (!row) { res.status(404).json({ error: "Rediscovery not found" }); return; }
    res.json(wrapRediscovery(row));
  });

  // GET /api/bridges
  router.get("/api/bridges", (_req: Request, res: Response) => {
    const rows = db.prepare("SELECT * FROM bridges ORDER BY name").all() as Row[];
    res.json(wrapCollection("Bridge", rows.map(wrapBridge)));
  });

  // GET /api/bridges/:id
  router.get("/api/bridges/:id", (req: Request, res: Response) => {
    const row = db.prepare("SELECT * FROM bridges WHERE id = ?").get(req.params.id) as Row | undefined;
    if (!row) { res.status(404).json({ error: "Bridge not found" }); return; }
    res.json(wrapBridge(row));
  });

  // GET /api/stats
  router.get("/api/stats", (_req: Request, res: Response) => {
    const names = (db.prepare("SELECT COUNT(*) as c FROM names").get() as { c: number }).c;
    const sources = (db.prepare("SELECT COUNT(*) as c FROM sources").get() as { c: number }).c;
    const rediscoveries = (db.prepare("SELECT COUNT(*) as c FROM rediscoveries").get() as { c: number }).c;
    const bridges = (db.prepare("SELECT COUNT(*) as c FROM bridges").get() as { c: number }).c;
    const meta = db.prepare("SELECT key, value FROM metadata").all() as { key: string; value: string }[];
    res.json({
      names, sources, rediscoveries, bridges,
      total: names + sources + rediscoveries + bridges,
      metadata: Object.fromEntries(meta.map(m => [m.key, m.value]))
    });
  });

  return router;
}
