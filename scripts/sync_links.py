#!/usr/bin/env python3
"""
Sync data/links.csv → data/links.json

Edit links.csv in Excel / Google Sheets (easy to update affiliate links & images),
then run this script before deploying / refreshing the site.

Usage:
  python3 scripts/sync_links.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "links.csv"
JSON_PATH = ROOT / "data" / "links.json"

def main():
    links = {}
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = str(row["id"]).strip()
            links[pid] = {
                "link": (row.get("link") or "").strip(),
                "image": (row.get("image") or "").strip(),
            }
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2, ensure_ascii=False)
    print(f"Synced {len(links)} entries → {JSON_PATH}")

if __name__ == "__main__":
    main()
