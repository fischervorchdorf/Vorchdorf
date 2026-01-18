#!/usr/bin/env python3

# Lese Datei
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Finde renderContent Funktion und füge mixed type hinzu
old_render = """        // Render Content
        function renderContent(category) {
            // Handle list type (like education)
            if (category.content.type === 'list') {"""

new_render = """        // Render Content
        function renderContent(category) {
            // Handle mixed type (like administration with intro + subcategories)
            if (category.content.type === 'mixed') {
                return `
                    <div class="detail-view fade-in">
                        <h2>${category.icon} ${category.title}</h2>
                        ${category.content.intro ? category.content.intro.map(item => `
                            <div class="info-item">
                                <h4>${item.title}</h4>
                                ${item.info.map(info => `<p>${info}</p>`).join('')}
                                ${item.link ? `<p><a href="${item.link}" target="_blank">→ Mehr Informationen</a></p>` : ''}
                            </div>
                        `).join('') : ''}
                        ${category.subcategories ? `
                            <h3 style="margin-top: 30px;">Bereiche & Services</h3>
                            <div class="subcategory-list">
                                ${Object.values(category.subcategories).map(sub => `
                                    <div class="subcategory-item" onclick="navigateToSubcategory('${category.id}', '${sub.id}')">
                                        <h4>${sub.title}</h4>
                                        <p>${sub.description || ''}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            // Handle list type (like education)
            if (category.content.type === 'list') {"""

content = content.replace(old_render, new_render)

# Schreibe zurück
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ renderContent Funktion erweitert!")
print("   - Unterstützt jetzt type: 'mixed'")
print("   - Zeigt intro-Items direkt an")
print("   - Zeigt subcategories danach")
