"""
update_whats_new.py — Apply translated "What's new" text to every locale listing file.

Usage:
    python update_whats_new.py

Reads whats_new.json (same directory) and patches each <locale>.txt inside
the listing/ folder by replacing the "What's new" block (heading + blank +
two bullets + blank, 5 lines total starting at the heading line).

For a new release, update whats_new.json with the new version's translations
and re-run this script.
"""

import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WHATS_NEW_PATH = os.path.join(SCRIPT_DIR, "whats_new.json")
LISTING_DIR = os.path.join(SCRIPT_DIR, "listing")

# English heading pattern used as a fallback anchor
EN_HEADING_PREFIX = "What's new in version"


def find_heading_index(lines, localized_heading):
    """Return the 0-based index of the line matching the localized heading."""
    for i, line in enumerate(lines):
        if line.strip() == localized_heading:
            return i
    return None


def find_english_heading_index(lines):
    """Fallback: find any line that starts with the English heading prefix."""
    for i, line in enumerate(lines):
        if line.strip().startswith(EN_HEADING_PREFIX):
            return i
    return None


def main():
    if not os.path.isfile(WHATS_NEW_PATH):
        print(f"ERROR: {WHATS_NEW_PATH} not found.")
        sys.exit(1)

    with open(WHATS_NEW_PATH, "r", encoding="utf-8") as f:
        translations = json.load(f)

    # Also check for locale files that have NO entry in whats_new.json
    all_locale_files = sorted(
        f for f in os.listdir(LISTING_DIR) if f.endswith(".txt")
    )
    missing = [
        f for f in all_locale_files if f.removesuffix(".txt") not in translations
    ]
    if missing:
        print(f"WARNING: No translation entry for: {', '.join(missing)}")

    updated = 0
    skipped = 0

    for locale, data in sorted(translations.items()):
        file_path = os.path.join(LISTING_DIR, f"{locale}.txt")
        if not os.path.isfile(file_path):
            print(f"  SKIP (file not found): {locale}.txt")
            skipped += 1
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Try to locate the heading line
        idx = find_heading_index(lines, data["heading"])
        if idx is None:
            idx = find_english_heading_index(lines)
        if idx is None:
            # Last resort: line 26 (0-indexed 25)
            idx = 25

        # Build the replacement block (5 lines)
        new_block = [
            data["heading"] + "\n",
            "\n",
            data["bullet1"] + "\n",
            data["bullet2"] + "\n",
            "\n",
        ]

        end_idx = idx + 5
        lines = lines[:idx] + new_block + lines[end_idx:]

        with open(file_path, "w", encoding="utf-8") as f:
            f.writelines(lines)

        updated += 1
        print(f"  OK   {locale}.txt")

    print(f"\nDone. Updated: {updated}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
