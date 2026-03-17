// Reads data/export.json (created by Claude via Anytype MCP) and populates SQLite
// Note: all .exec() calls are better-sqlite3 DDL, not child_process
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { openDb, initSchema, rebuildFts } from "../db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ExportEntry {
  type: "name" | "source" | "rediscovery" | "bridge";
  id: string;
  name: string;
  properties: Record<string, unknown>;
}

// Coerce any value to a string suitable for SQLite TEXT columns
function str(v: unknown): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function importData(): void {
  const exportPath = join(__dirname, "..", "..", "data", "export.json");
  const raw = readFileSync(exportPath, "utf-8");
  const entries: ExportEntry[] = JSON.parse(raw);

  const dbPath = join(__dirname, "..", "..", "data", "word.db");
  const db = openDb(dbPath);
  initSchema(db);

  // Clear existing data for clean reimport
  db.prepare("DELETE FROM names").run();
  db.prepare("DELETE FROM sources").run();
  db.prepare("DELETE FROM rediscoveries").run();
  db.prepare("DELETE FROM bridges").run();
  db.prepare("DELETE FROM metadata").run();

  const insertName = db.prepare(`
    INSERT OR REPLACE INTO names (id, name, felt_sense, definition, why_it_matters,
      source_year, source_author, domain, human_search_terms, agent_search_terms,
      created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSource = db.prepare(`
    INSERT OR REPLACE INTO sources (id, name, author, year, source_type, url,
      description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRediscovery = db.prepare(`
    INSERT OR REPLACE INTO rediscoveries (id, name, observed_by, platform,
      description, maps_to_id, date_observed, evidence_url, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBridge = db.prepare(`
    INSERT OR REPLACE INTO bridges (id, name, from_name, to_name, relationship,
      description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMeta = db.prepare("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)");

  const counts = { names: 0, sources: 0, rediscoveries: 0, bridges: 0 };

  const tx = db.transaction(() => {
    for (const entry of entries) {
      const p = entry.properties;
      switch (entry.type) {
        case "name":
          insertName.run(entry.id, entry.name, str(p.felt_sense), str(p.definition),
            str(p.why_it_matters), str(p.source_year), str(p.source_author), str(p.domain),
            str(p.human_search_terms), str(p.agent_search_terms), str(p.created_at), str(p.updated_at));
          counts.names++;
          break;
        case "source":
          insertSource.run(entry.id, entry.name, str(p.author), str(p.year), str(p.source_type),
            str(p.url), str(p.description), str(p.created_at), str(p.updated_at));
          counts.sources++;
          break;
        case "rediscovery": {
          // maps_to can be a list of object IDs — take first
          const mapsTo = Array.isArray(p.maps_to) ? p.maps_to[0] ?? null : str(p.maps_to);
          insertRediscovery.run(entry.id, entry.name, str(p.observed_by), str(p.platform),
            str(p.description), mapsTo, str(p.date_observed), str(p.evidence_url), str(p.notes),
            str(p.created_at), str(p.updated_at));
          counts.rediscoveries++;
          break;
        }
        case "bridge":
          insertBridge.run(entry.id, entry.name, str(p.from_name), str(p.to_name),
            str(p.relationship), str(p.description), str(p.created_at), str(p.updated_at));
          counts.bridges++;
          break;
      }
    }

    insertMeta.run("exported_at", new Date().toISOString());
    insertMeta.run("entry_count", String(entries.length));
    insertMeta.run("counts", JSON.stringify(counts));
  });

  tx();
  rebuildFts(db);
  db.close();

  console.log("Imported:", JSON.stringify(counts));
}

importData();
