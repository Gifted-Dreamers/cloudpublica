#!/usr/bin/env python3
"""OSINT Tool Poller v3 — with proper rate limiting."""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

DELAY = 5  # seconds between external API calls

def fetch_json(url, headers=None, data=None, timeout=30):
    req = urllib.request.Request(url, data=data, headers=headers or {
        "User-Agent": "GD-Research-Bot/1.0 (transparency research; contact bee@justnice.us)"
    })
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return None

def fetch_text(url, timeout=20):
    req = urllib.request.Request(url, headers={
        "User-Agent": "GD-Research-Bot/1.0 (transparency research; contact bee@justnice.us)"
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode(errors="replace")
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return None

# ── POLLERS ──────────────────────────────────────────────────────

def poll_usaspending(query):
    print(f"[USAspending] {query}...")
    url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
    payload = json.dumps({
        "filters": {
            "recipient_search_text": [query],
            "time_period": [{"start_date": "2025-01-01", "end_date": "2026-12-31"}],
            "award_type_codes": ["A", "B", "C", "D"]
        },
        "fields": ["Award ID", "Recipient Name", "Award Amount",
                    "Awarding Agency", "Start Date", "Description"],
        "page": 1, "limit": 10, "sort": "Start Date", "order": "desc"
    }).encode()
    data = fetch_json(url, data=payload)
    if data and "results" in data:
        results = data["results"]
        total = data.get("page_metadata", {}).get("total", len(results))
        print(f"  {total} total awards")
        for r in results[:3]:
            print(f"    ${r.get('Award Amount', 0):>15,.2f} | {r.get('Awarding Agency', '?')} | {(r.get('Description') or '')[:60]}")
        return {"source": "usaspending", "query": query, "total": total, "results": results}
    return None

def poll_gdelt(query, label):
    print(f"[GDELT] {label}...")
    encoded = urllib.request.quote(query)
    url = f"https://api.gdeltproject.org/api/v2/doc/doc?query={encoded}&mode=ArtList&maxrecords=10&format=json&sort=DateDesc&timespan=7d"
    text = fetch_text(url)
    if text:
        try:
            data = json.loads(text)
            articles = data.get("articles", [])
            print(f"  {len(articles)} articles (7d)")
            for a in articles[:3]:
                print(f"    {a.get('title', '?')[:70]}")
            return {"source": "gdelt", "query": label, "count": len(articles),
                    "results": [{"title": a.get("title",""), "url": a.get("url",""),
                                 "date": a.get("seendate","")} for a in articles]}
        except json.JSONDecodeError:
            print("  No results or non-JSON response")
    return None

def poll_icemicahlee():
    print("[ICE Contracts] Micah Lee...")
    import re
    text = fetch_text("https://micahflee.github.io/ice-contracts/")
    if text:
        rows = len(re.findall(r'<tr', text))
        print(f"  Accessible, ~{rows} rows")
        return {"source": "ice_contracts", "accessible": True, "approx_rows": rows}
    return None

def poll_silencedidthis():
    print("[SilenceDidThis] Checking new drops...")
    new_found = []
    for n in range(5, 8):
        text = fetch_text(f"https://silencedidthis.com/?file=Drop{n}.csv&v=gallery")
        if text and len(text) > 1000 and "records" in text.lower():
            print(f"  NEW: Drop{n}!")
            new_found.append(n)
        else:
            break
        time.sleep(2)
    print(f"  {'New drops: ' + str(new_found) if new_found else 'No new drops beyond Drop4'}")
    return {"source": "silencedidthis", "known_drops": 4, "new_drops": new_found}

def poll_aleph(query):
    print(f"[Aleph] {query}...")
    encoded = urllib.request.quote(query)
    # Aleph public search (no auth needed for basic queries)
    data = fetch_json(f"https://aleph.occrp.org/api/2/entities?q={encoded}&limit=5",
                      headers={"Accept": "application/json",
                               "User-Agent": "GD-Research-Bot/1.0"})
    if data:
        total = data.get("total", 0)
        print(f"  {total} entities")
        return {"source": "aleph", "query": query, "total": total}
    return None

# ── MAIN ─────────────────────────────────────────────────────────

def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f"=== OSINT Poll: {now} ===\n")

    pollers = [
        ("USAspending Palantir",    lambda: poll_usaspending("Palantir")),
        ("USAspending Anduril",     lambda: poll_usaspending("Anduril")),
        ("USAspending Clearview",   lambda: poll_usaspending("Clearview AI")),
        ("GDELT Palantir",          lambda: poll_gdelt("palantir military OR palantir defense", "palantir_military")),
        ("GDELT ICE surveillance",  lambda: poll_gdelt("ICE surveillance technology", "ice_surveillance")),
        ("ICE Contracts",           poll_icemicahlee),
        ("SilenceDidThis",          poll_silencedidthis),
        ("Aleph Palantir",          lambda: poll_aleph("Palantir Technologies")),
    ]

    results = []
    for i, (name, fn) in enumerate(pollers):
        try:
            r = fn()
            if r:
                results.append(r)
        except Exception as e:
            print(f"  EXCEPTION: {e}", file=sys.stderr)
        print()
        if i < len(pollers) - 1:
            time.sleep(DELAY)

    # Write logs
    log_dir = os.path.expanduser("~/osint-agent/logs")
    os.makedirs(log_dir, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    
    report = {"timestamp": now, "pollers_run": len(pollers),
              "results_returned": len(results), "results": results}
    with open(f"{log_dir}/poll-{ts}.json", "w") as f:
        json.dump(report, f, indent=2, default=str)

    with open(f"{log_dir}/latest-summary.txt", "w") as f:
        f.write(f"OSINT Poll — {now}\n{'='*60}\n\n")
        for r in results:
            src, q = r.get("source","?"), r.get("query","")
            cnt = r.get("total", r.get("count", "?"))
            f.write(f"[{src}] {q}: {cnt} results\n")
            if src == "usaspending":
                for a in r.get("results",[])[:5]:
                    f.write(f"  ${a.get('Award Amount',0):>15,.2f} | {a.get('Awarding Agency','?')} | {(a.get('Description') or '')[:50]}\n")
            elif src == "gdelt":
                for a in r.get("results",[])[:5]:
                    f.write(f"  {a.get('title','?')[:70]}\n")
                    f.write(f"    {a.get('url','')}\n")
            elif src == "silencedidthis" and r.get("new_drops"):
                f.write(f"  *** NEW DROPS: {r['new_drops']} ***\n")
            f.write("\n")

    print(f"=== {len(results)}/{len(pollers)} pollers returned data ===")
    print(f"=== Logs: {log_dir}/poll-{ts}.json ===")

if __name__ == "__main__":
    main()
