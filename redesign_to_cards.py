#!/usr/bin/env python3

# ======================
# FORMULARE.HTML - Als Kachel-Grid
# ======================

formulare_new_style = """        .formulare-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
        }

        .formular-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.3s;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            display: block;
        }

        .formular-card:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }

        .formular-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
        }

        .formular-icon {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #1a472a 0%, #2d7a47 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
            color: white;
        }

        .formular-title {
            font-weight: 600;
            font-size: 15px;
            color: #1d1d1f;
            line-height: 1.4;
        }"""

formulare_new_render = """            const html = filtered.map(f => {
                return `
                    <a href="${escapeHtml(f.link)}" 
                       class="formular-card" 
                       target="_blank"
                       rel="noopener noreferrer">
                        <div class="formular-card-header">
                            <div class="formular-icon">📋</div>
                            <div class="formular-title">${escapeHtml(f.title)}</div>
                        </div>
                    </a>
                `;
            }).join('');

            listElement.innerHTML = html;"""

# Lese formulare.html
with open('gemeinde-verwaltung/formulare.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Ersetze CSS
content = content.replace('.formulare-list {', '.formulare-grid {')
content = content.replace('class="formulare-list"', 'class="formulare-grid"')

# Finde und ersetze die alten .formular-item Styles
import re
old_styles_pattern = r'\.formular-item \{[^}]+\}[^}]*\.formular-item:last-child[^}]+\}[^}]*\.formular-item:hover[^}]+\}[^}]*\.formular-icon \{[^}]+\}[^}]*\.formular-content[^}]+\}[^}]*\.formular-title[^}]+\}[^}]*\.formular-arrow[^}]+\}'
content = re.sub(old_styles_pattern, formulare_new_style, content, flags=re.DOTALL)

# Ersetze render-Code
old_render = r'const html = filtered\.map\(f => \{[^}]+return `[^`]+`;\s+\}\);'
content = re.sub(old_render, formulare_new_render, content, flags=re.DOTALL)

with open('gemeinde-verwaltung/formulare.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ formulare.html - Als Kachel-Grid umgestaltet")

# ======================
# ABTEILUNGEN.HTML - Vereinfachen
# ======================

print("✅ abteilungen.html - Bereits gut strukturiert (behalten)")

# ======================
# GEMEINDEBETRIEBE.HTML - Als kompakte Kacheln
# ======================

betriebe_new_style = """        .betriebe-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }

        .betrieb-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.3s;
        }

        .betrieb-card:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }

        .betrieb-name {
            font-weight: 600;
            font-size: 16px;
            color: #1d1d1f;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .betrieb-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #1a472a 0%, #2d7a47 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
            color: white;
        }

        .betrieb-info {
            font-size: 14px;
            color: #86868b;
            line-height: 1.6;
        }

        .betrieb-link {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: #1a472a;
            text-decoration: none;
            font-size: 14px;
            margin-top: 10px;
            font-weight: 500;
        }

        .betrieb-link:hover {
            text-decoration: underline;
        }"""

with open('gemeinde-verwaltung/gemeindebetriebe.html', 'r', encoding='utf-8') as f:
    betriebe_content = f.read()

# Ersetze betriebe-list zu betriebe-grid
betriebe_content = betriebe_content.replace('class="betriebe-list"', 'class="betriebe-grid"')
betriebe_content = betriebe_content.replace('.betriebe-list {', '.betriebe-grid {')

# Füge neue Styles hinzu (ersetze alte)
betriebe_old_pattern = r'\.betrieb-item \{[^}]+\}[^}]*\.betrieb-item:last-child[^}]+\}[^}]*\.betrieb-item:hover[^}]+\}[^}]*\.betrieb-name[^}]+\}[^}]*\.betrieb-info[^}]+\}[^}]*\.betrieb-link[^}]+\}'
betriebe_content = re.sub(betrieb_old_pattern, betriebe_new_style, betriebe_content, flags=re.DOTALL)

with open('gemeinde-verwaltung/gemeindebetriebe.html', 'w', encoding='utf-8') as f:
    f.write(betriebe_content)

print("✅ gemeindebetriebe.html - Als kompakte Kacheln umgestaltet")

print("\n🎉 Redesign abgeschlossen!")
print("\n📋 Änderungen:")
print("   - Formulare: Listen → Kachel-Grid (wie Mitarbeiter)")
print("   - Betriebe: Listen → Kompakte Kacheln")
print("   - Ämter: Bereits gut (keine Änderung)")
