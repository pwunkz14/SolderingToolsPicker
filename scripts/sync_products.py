#!/usr/bin/env python3
"""
Sync data/products.csv → products.json + links.json (+ optional links.csv)

HOW TO ADD / EDIT PRODUCTS
--------------------------
1. Open data/products.csv in Excel or Google Sheets
2. Edit rows or add new ones at the bottom
3. Save as CSV (UTF-8)
4. Run:  python3 scripts/sync_products.py
5. Refresh the website

Columns:
  id             Unique number (use next free id when adding)
  category       tools | parts
  sub_category   station | portable | iron | tips | handles | hotair |
                 combo | wick | pump | flux | solder |
                 PS5 | PS4 | XBOX | Switch pro | Switch
  brand          Brand name
  model          Model name
  power          e.g. 200W (optional)
  compatibility  Tip code (1.1, 1.2, 4, 5…) or JOYSTICK / HDMI / Modding for parts
  ESD            OK | carefull | danger (optional, not shown on site)
  link           Affiliate URL
  image          Direct image URL (optional)
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "products.csv"
PRODUCTS_JSON = ROOT / "data" / "products.json"
LINKS_JSON = ROOT / "data" / "links.json"
LINKS_CSV = ROOT / "data" / "links.csv"

REQUIRED = ["id", "category", "sub_category"]


def main():
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing {CSV_PATH}")

    products = []
    links = {}
    link_rows = []
    seen_ids = set()

    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):
            # skip fully empty rows
            if not any((v or "").strip() for v in row.values()):
                continue

            pid_raw = (row.get("id") or "").strip()
            if not pid_raw:
                print(f"  skip line {i}: missing id")
                continue
            try:
                pid = int(float(pid_raw))
            except ValueError:
                print(f"  skip line {i}: bad id {pid_raw!r}")
                continue

            if pid in seen_ids:
                print(f"  warning: duplicate id {pid} (line {i}) — last wins")
            seen_ids.add(pid)

            category = (row.get("category") or "").strip()
            sub = (row.get("sub_category") or "").strip()
            if not category or not sub:
                print(f"  skip id {pid}: category and sub_category are required")
                continue

            product = {
                "id": pid,
                "category": category,
                "sub_category": sub,
                "brand": (row.get("brand") or "").strip() or None,
                "model": (row.get("model") or "").strip(),
                "power": (row.get("power") or "").strip(),
                "compatibility": (row.get("compatibility") or "").strip(),
                "ESD": (row.get("ESD") or "").strip(),
            }
            products.append(product)

            link = (row.get("link") or "").strip()
            image = (row.get("image") or "").strip()
            links[str(pid)] = {"link": link, "image": image}
            link_rows.append({
                "id": pid,
                "brand": product["brand"] or "",
                "model": product["model"],
                "sub_category": sub,
                "link": link,
                "image": image,
            })

    products.sort(key=lambda p: p["id"])

    with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    with open(LINKS_JSON, "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2, ensure_ascii=False)

    with open(LINKS_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id", "brand", "model", "sub_category", "link", "image"])
        w.writeheader()
        w.writerows(link_rows)

    print(f"OK — {len(products)} products")
    print(f"  → {PRODUCTS_JSON}")
    print(f"  → {LINKS_JSON}")
    print(f"  → {LINKS_CSV}")
    print()
    print("Next free id:", (max(seen_ids) + 1) if seen_ids else 1)


if __name__ == "__main__":
    main()
