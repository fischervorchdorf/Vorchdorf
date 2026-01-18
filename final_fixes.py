#!/usr/bin/env python3
import re

files = {
    'gemeinde-verwaltung/formulare.html': 'Formulare & Anträge',
    'gemeinde-verwaltung/abteilungen.html': 'Ämter & Abteilungen',
    'gemeinde-verwaltung/mitarbeiter.html': 'Mitarbeiter-Verzeichnis',
    'gemeinde-verwaltung/gemeindebetriebe.html': 'Gemeindebetriebe'
}

# Zurück-Button HTML
back_button_html = '''    <!-- Zurück zur Hauptseite -->
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

for filepath, title in files.items():
    print(f"\n🔄 Bearbeite {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. ZURÜCK-BUTTON: Einfügen nach dem Header
    if '← Zurück' not in content:
        # Suche nach dem Header-Ende und füge Button ein
        content = re.sub(
            r'(</div>\s*</div>\s*<!-- Ende Header -->)',
            r'\1\n' + back_button_html,
            content
        )
        # Falls kein Kommentar, suche nach header + search-box Pattern
        if '← Zurück' not in content:
            content = re.sub(
                r'(</div>\s*<div class="search-box">)',
                back_button_html + r'\1',
                content
            )
        print(f"   ✅ Zurück-Button hinzugefügt")
    
    # 2. ÄMTER: Grid max-width begrenzen
    if 'abteilungen' in filepath:
        # Begrenze die Karten-Breite
        content = re.sub(
            r'grid-template-columns: repeat\(auto-fill, minmax\(\d+px, 1fr\)\);',
            'grid-template-columns: repeat(auto-fill, minmax(350px, 450px));',
            content
        )
        print(f"   ✅ Kachel-Breite begrenzt (max 450px)")
    
    # 3. BETRIEBE: Grid max-width begrenzen + Details standardmäßig ausgeblendet
    if 'gemeindebetriebe' in filepath:
        # Begrenze die Karten-Breite
        content = re.sub(
            r'grid-template-columns: repeat\(auto-fill, minmax\(\d+px, 1fr\)\);',
            'grid-template-columns: repeat(auto-fill, minmax(320px, 400px));',
            content
        )
        
        # Stelle sicher, dass .betrieb-details standardmäßig ausgeblendet ist
        if '.betrieb-details {' in content:
            content = re.sub(
                r'\.betrieb-details \{([^}]*)\}',
                r'.betrieb-details {\1\n            display: none;\n        }',
                content
            )
            # Füge expanded State hinzu
            if '.expanded .betrieb-details' not in content:
                content = re.sub(
                    r'(\.betrieb-details \{[^}]+\})',
                    r'\1\n\n        .betrieb-card.expanded .betrieb-details {\n            display: block;\n        }',
                    content
                )
        print(f"   ✅ Kachel-Breite begrenzt + Details ausblenden")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ {title} fertig")

print("\n🎉 Alle Fixes abgeschlossen!")
print("\n📋 Änderungen:")
print("   1. Zurück-Buttons bei allen 4 Seiten")
print("   2. Ämter-Kacheln: Max 450px Breite")
print("   3. Betriebe-Kacheln: Max 400px Breite + Details ausgeblendet")
