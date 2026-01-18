#!/usr/bin/env python3

# === ABTEILUNGEN.HTML ===
with open('gemeinde-verwaltung/abteilungen.html', 'r', encoding='utf-8') as f:
    abt_content = f.read()

# Füge Zurück-Button direkt nach dem Header ein
back_button = '''    <!-- Zurück zur Hauptseite -->
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

'''

# Suche <div class="container"> und füge danach ein
if '← Zurück' not in abt_content:
    abt_content = abt_content.replace(
        '<div class="container">',
        '<div class="container">\n' + back_button
    )

# Fixe Grid-Einstellung für Abteilungen
abt_content = abt_content.replace(
    'grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));',
    'grid-template-columns: repeat(auto-fill, minmax(350px, 450px));'
)

with open('gemeinde-verwaltung/abteilungen.html', 'w', encoding='utf-8') as f:
    f.write(abt_content)

print("✅ abteilungen.html - Zurück-Button + Grid fixed")

# === GEMEINDEBETRIEBE.HTML ===
with open('gemeinde-verwaltung/gemeindebetriebe.html', 'r', encoding='utf-8') as f:
    bet_content = f.read()

# Füge Zurück-Button ein
if '← Zurück' not in bet_content:
    bet_content = bet_content.replace(
        '<div class="container">',
        '<div class="container">\n' + back_button
    )

# Entferne doppeltes display: none;
import re
bet_content = re.sub(
    r'\.betrieb-details \{ display: none; margin-top: 20px;[^}]+display: none;\s+\}',
    '.betrieb-details { display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f0f0f0; }',
    bet_content
)

# Stelle sicher, dass expanded State da ist
if '.betrieb-card.expanded .betrieb-details' not in bet_content:
    bet_content = bet_content.replace(
        '.betrieb-details { display: none;',
        '''.betrieb-details { display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
        
        .betrieb-card.expanded .betrieb-details { display: block; }
        
        .old-betrieb-details { display: none;'''
    )

with open('gemeinde-verwaltung/gemeindebetriebe.html', 'w', encoding='utf-8') as f:
    f.write(bet_content)

print("✅ gemeindebetriebe.html - Zurück-Button + Display fixed")
print("\n🎉 Alle Zurück-Buttons sollten jetzt da sein!")
