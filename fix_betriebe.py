#!/usr/bin/env python3

with open('gemeinde-verwaltung/gemeindebetriebe.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Einfach die Klassen umbenennen
content = content.replace('class="betriebe-list"', 'class="betriebe-grid"')
content = content.replace('.betriebe-list {', '''.betriebe-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .betriebe-list-old {''')

# betrieb-item zu betrieb-card
content = content.replace('class="betrieb-item"', 'class="betrieb-card"')
content = content.replace('.betrieb-item {', '.betrieb-card {')
content = content.replace('.betrieb-item:', '.betrieb-card:')

with open('gemeinde-verwaltung/gemeindebetriebe.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ gemeindebetriebe.html - Grid-Layout aktiviert")
