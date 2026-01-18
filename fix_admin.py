#!/usr/bin/env python3
import re

# Lese index.html
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# FIX 1: Finde die Zeile mit directLink und füge externalLink danach ein
for i, line in enumerate(lines):
    if "if (subcategory.directLink) {" in line:
        # Finde die schließende Klammer dieser if-Bedingung
        j = i
        while j < len(lines):
            if "return;" in lines[j] and j > i:
                # Füge nach dem return; Block den externalLink Check ein
                lines.insert(j + 2, """
            // Check for external link - if exists, open in same window
            if (subcategory.externalLink) {
                window.location.href = subcategory.externalLink;
                return;
            }
""")
                break
            j += 1
        break

# Schreibe zurück
with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ externalLink Support hinzugefügt!")
