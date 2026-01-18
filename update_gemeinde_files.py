#!/usr/bin/env python3
import re

# Farb-Mapping: Blau -> Grün (Vorchdorf-Farben)
color_map = {
    '#667eea': '#1a472a',  # Dunkelblau -> Dunkelgrün
    '#764ba2': '#2d7a47',  # Lila -> Hellgrün
    '#f4b923': '#f4b923',  # Gelb bleibt
}

# Zurück-Button HTML
back_button = """    <!-- Zurück-Button -->
    <div style="margin-bottom: 20px;">
        <button onclick="window.history.back()" style="
            background: white;
            border: 2px solid #1a472a;
            color: #1a472a;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        " onmouseover="this.style.background='#1a472a'; this.style.color='white';" 
           onmouseout="this.style.background='white'; this.style.color='#1a472a';">
            ← Zurück
        </button>
    </div>

"""

files_to_update = [
    'gemeinde-verwaltung/formulare.html',
    'gemeinde-verwaltung/abteilungen.html',
    'gemeinde-verwaltung/mitarbeiter.html',
    'gemeinde-verwaltung/gemeindebetriebe.html'
]

for filename in files_to_update:
    print(f"\n🔄 Bearbeite {filename}...")
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Ersetze Farben
    for old_color, new_color in color_map.items():
        content = content.replace(old_color, new_color)
    
    # 2. Füge Zurück-Button ein (nach <div class="container">)
    if '<!-- Zurück-Button -->' not in content:
        content = content.replace(
            '<div class="container">',
            '<div class="container">\n' + back_button
        )
    
    # 3. Schreibe zurück
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ Farben geändert (Blau->Grün)")
    print(f"   ✅ Zurück-Button hinzugefügt")

print("\n🎉 Alle Dateien aktualisiert!")
print("\n📋 Änderungen:")
print("   - Farben: #667eea -> #1a472a (Dunkelgrün)")
print("   - Farben: #764ba2 -> #2d7a47 (Hellgrün)")
print("   - Zurück-Button bei allen 4 Seiten")
