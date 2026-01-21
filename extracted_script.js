// Flohmarkt Daten
const FLOHMARKT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1CrRpZwA19JcKfZsfbm9yZ3r_lEup-piI-QL4mY2kHnc/export?format=csv';

let flohmarktAllProducts = [];
let flohmarktCurrentProduct = null;
let flohmarktCurrentImageIndex = 0;
let showOnlyWerbering = false;

const flohmarktCategoryIcons = {
    'Schulsachen': '📚',
    'Büromaterial': '✏️',
    'Spiele': '🎮',
    'Bücher': '📖',
    'Handarbeit': '🧶',
    'Deko': '🏠',
    'Elektro': '⚡',
    'Kinderartikel': '🧸',
    'Möbel': '🪑',
    'Kleidung': '👕',
    'Lederwaren': '👜',
    'Rauchzubehör': '🚬',
    'Sonstiges': '📦'
};

// Robuster CSV Parser mit Trennzeichen-Erkennung und Fallback
function parseCSV(text) {
    // Detect delimiter based on first line
    const firstLine = text.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const arr = [];
    let quote = false;
    let col = 0, row = 0;

    // Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let c = 0; c < text.length; c++) {
        let cc = text[c];
        let nc = text[c + 1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';

        if (cc == '"') {
            if (quote && nc == '"') {
                arr[row][col] += cc; ++c;
            } else {
                quote = !quote;
            }
        }
        else if (cc == delimiter && !quote) { ++col; }
        else if (cc == '\n' && !quote) { ++row; col = 0; }
        else { arr[row][col] += cc; }
    }

    // Clean headers
    const headers = arr[0].map(h => h.trim().replace(/^[\uFEFF\u200B]/, ''));
    const result = [];

    for (let i = 1; i < arr.length; i++) {
        const rowData = arr[i];
        if (rowData.length < 2) continue;

        const obj = {};

        // Strategy 1: Standard Map
        headers.forEach((h, idx) => {
            obj[h] = rowData[idx] ? rowData[idx].trim() : '';
        });

        // Strategy 2: Fallback for critical fields if empty (using fixed indices based on Google Sheet structure)
        // 0:Timestamp, 1:Status, 2:Name, 3:Category, 4:Price, 5:Desc, 6:Firm, 7:Email, 8:Img1
        if (!obj['Produktname'] && rowData[2]) obj['Produktname'] = rowData[2];
        if (!obj['Kategorie'] && rowData[3]) obj['Kategorie'] = rowData[3];
        if (!obj['Preis in Euro'] && rowData[4]) obj['Preis in Euro'] = rowData[4];
        if (!obj['Firmenname'] && rowData[6]) obj['Firmenname'] = rowData[6];

        // Flexible Image Search
        if (!obj['Bild 1 Url von Imgur']) {
            // Try column 8 or find any http link
            if (rowData[8] && rowData[8].startsWith('http')) obj['Bild 1 Url von Imgur'] = rowData[8];
        }

        result.push(obj);
    }
    return result;
}

async function loadFlohmarktProducts() {
    try {
        // Footer nicht mehr verstecken!

        // const proxyUrl = 'https://api.allorigins.win/raw?url=';
        // let response;

        try {
            response = await fetch(FLOHMARKT_SHEET_URL);
        } catch (e) {
            console.error('Fetch error:', e);
        }

        if (!response || !response.ok) {
            throw new Error('Network response was not ok');
        }

        const csv = await response.text();
        const products = parseCSV(csv);

        // Neueste zuerst
        products.reverse();

        flohmarktAllProducts = products;

        renderFlohmarktProducts(flohmarktAllProducts);

        renderFlohmarktProducts(flohmarktAllProducts);
    } catch (error) {
        console.error('Fehler beim Laden des Flohmarkts:', error);
        document.getElementById('flohmarktGrid').innerHTML = `
                    <div class="flohmarkt-empty" style="display: block; grid-column: 1/-1;">
                        <div class="flohmarkt-empty-icon">⚠️</div>
                        <h3>Fehler beim Laden</h3>
                        <p>Bitte später erneut versuchen</p>
                    </div>
                `;
    }
}

// Flohmarkt Produkte rendern
function cleanImageUrl(url) {
    if (!url || typeof url !== 'string') return '';

    let cleaned = url.trim();

    // Entferne HTML-Tags und Whitespace
    cleaned = cleaned.replace(/<[^>]*>/g, '').trim();

    // Wenn es ein href-Link ist, extrahiere die URL
    if (cleaned.includes('href=')) {
        const match = cleaned.match(/href=["']([^"']+)["']/i);
        if (match && match[1]) {
            cleaned = match[1].trim();
        }
    }

    // Entferne führende/nachfolgende Quotes
    cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

    // Prüfe ob es eine echte URL ist (muss mit http anfangen)
    if (cleaned && (cleaned.startsWith('http://') || cleaned.startsWith('https://'))) {
        return cleaned;
    }

    return '';
}

function renderFlohmarktProducts(products) {
    const grid = document.getElementById('flohmarktGrid');
    const emptyState = document.getElementById('flohmarktEmpty');
    const stats = document.getElementById('flohmarktStats');

    if (products.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        stats.textContent = '';
        return;
    }

    emptyState.style.display = 'none';
    stats.textContent = `${products.length} Produkt${products.length !== 1 ? 'e' : ''} gefunden`;

    grid.innerHTML = products.map((product, index) => {
        // EXTREM ROBUSTE BILD-EXTRAKTION
        let imageUrl = '';

        // 1. Suche in bekannten Spalten
        const knownFields = ['Bild 1 Url von Imgur', 'Bild 1', 'Bild', 'Bild 2', 'Bild 3', 'Bild 4'];
        for (const field of knownFields) {
            if (product[field] && String(product[field]).trim().startsWith('http')) {
                imageUrl = String(product[field]).trim();
                break;
            }
        }

        // 2. Fallback: Suche in ALLEN Feldern nach einer URL (falls Spalten verschoben)
        if (!imageUrl) {
            for (let key in product) {
                const val = String(product[key]).trim();
                if (val.startsWith('http') && (val.includes('imgur.com') || val.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
                    imageUrl = val;
                    break;
                }
            }
        }

        if (imageUrl) {
            // Falls es HTML enthält, extrahiere reine URL
            if (imageUrl.includes('href=')) {
                const m = imageUrl.match(/href=["']([^"']+)["']/);
                if (m) imageUrl = m[1];
            }

            // Imgur-Optimierung
            if (imageUrl.includes('imgur.com/')) {
                // Bereinige Album/Gallery-Links
                imageUrl = imageUrl.replace(/\/(a|gallery)\//, '/');

                // Stelle sicher dass es i.imgur.com ist und eine Endung hat
                if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    // Extrahiere ID (letzter Teil der URL)
                    const parts = imageUrl.trim().split('/');
                    let lastPart = parts[parts.length - 1];
                    if (lastPart === '') lastPart = parts[parts.length - 2];
                    let id = lastPart.split(/[?#.]/)[0];
                    if (id) {
                        imageUrl = `https://i.imgur.com/${id}.jpg`;
                    }
                } else {
                    // Nur Domain anpassen falls Endung schon da
                    imageUrl = imageUrl.replace('//imgur.com', '//i.imgur.com');
                }
            }
        }

        const category = product.Kategorie || 'Sonstiges';
        const icon = flohmarktCategoryIcons[category] || '📦';
        const price = flohmarktFormatPrice(product['Preis in Euro']);
        const seller = product.Firmenname || 'Anonym';

        return `
                    <article class="flohmarkt-product-card" onclick="openFlohmarktModal(${index})">
                        ${imageUrl ?
                `<img src="${imageUrl}" alt="${product.Produktname}" class="flohmarkt-product-image" onerror="this.outerHTML='<div class=\\'flohmarkt-product-placeholder\\'>${icon}</div>'">` :
                `<div class="flohmarkt-product-placeholder">${icon}</div>`
            }
                        <div class="flohmarkt-product-info">
                            <span class="flohmarkt-product-category">${icon} ${category}</span>
                            <h3 class="flohmarkt-product-title">${product.Produktname || 'Ohne Titel'}</h3>
                            <div class="flohmarkt-product-price">${price}</div>
                            <div class="flohmarkt-product-seller">👤 ${seller}</div>
                        </div>
                    </article>
                `;
    }).join('');
}

// Preis formatieren
function flohmarktFormatPrice(price) {
    if (!price) return 'Preis auf Anfrage';
    const num = parseFloat(price.replace(',', '.').replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return price;
    return `€ ${num.toFixed(2).replace('.', ',')}`;
}

// Filter
function filterFlohmarktProducts() {
    const search = document.getElementById('flohmarktSearch').value.toLowerCase();
    const category = document.getElementById('flohmarktCategory').value;
    const verkaeufer = document.getElementById('flohmarktVerkaeifer').value;

    const filtered = flohmarktAllProducts.filter(product => {
        const matchesSearch = !search ||
            (product.Produktname && product.Produktname.toLowerCase().includes(search)) ||
            (product.Beschreibung && product.Beschreibung.toLowerCase().includes(search));

        const matchesCategory = !category || product.Kategorie === category;
        const matchesVerkaeufer = !verkaeufer || product.Firmenname === verkaeufer;

        return matchesSearch && matchesCategory && matchesVerkaeufer;
    });

    renderFlohmarktProducts(filtered);
}

// Flohmarkt Modal öffnen
function openFlohmarktModal(index) {
    const search = document.getElementById('flohmarktSearch').value.toLowerCase();
    const category = document.getElementById('flohmarktCategory').value;
    const verkaeufer = document.getElementById('flohmarktVerkaeifer').value;
    // Gefilterte Liste verwenden
    const filtered = flohmarktAllProducts.filter(product => {
        const matchesSearch = !search ||
            (product.Produktname && product.Produktname.toLowerCase().includes(search)) ||
            (product.Beschreibung && product.Beschreibung.toLowerCase().includes(search));
        const matchesCategory = !category || product.Kategorie === category;
        const matchesVerkaeufer = !verkaeufer || product.Firmenname === verkaeufer;
        return matchesSearch && matchesCategory && matchesVerkaeufer;
    });

    flohmarktCurrentProduct = filtered[index];
    flohmarktCurrentImageIndex = 0;

    if (!flohmarktCurrentProduct) return;

    // Bilder sammeln und direkt cleanieren
    const images = [
        flohmarktCurrentProduct['Bild 1 Url von Imgur'],
        flohmarktCurrentProduct['Bild 2'],
        flohmarktCurrentProduct['Bild 3'],
        flohmarktCurrentProduct['Bild 4']
    ].map(url => {
        if (!url) return '';
        let cleaned = url.trim();
        if (cleaned.includes('href=')) {
            const m = cleaned.match(/href=["']([^"']+)["']/);
            cleaned = m ? m[1] : '';
        }
        if (!cleaned.startsWith('http')) {
            return '';
        }
        // Repariere unvollständige imgur.com URLs
        if (cleaned.includes('imgur.com/') && !cleaned.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const match = cleaned.match(/imgur\.com\/([a-zA-Z0-9]+)$/);
            if (match) {
                cleaned = `https://i.imgur.com/${match[1]}.jpg`;
            }
        }
        return cleaned;
    }).filter(url => url);

    flohmarktCurrentProduct.images = images;

    // Modal befüllen
    const cat = flohmarktCurrentProduct.Kategorie || 'Sonstiges';
    const icon = flohmarktCategoryIcons[cat] || '📦';

    document.getElementById('flohmarktModalCategory').textContent = `${icon} ${cat}`;
    document.getElementById('flohmarktModalTitle').textContent = flohmarktCurrentProduct.Produktname || 'Ohne Titel';
    document.getElementById('flohmarktModalPrice').textContent = flohmarktFormatPrice(flohmarktCurrentProduct['Preis in Euro']);
    document.getElementById('flohmarktModalDescription').textContent = flohmarktCurrentProduct.Beschreibung || 'Keine Beschreibung vorhanden.';

    const sellerName = flohmarktCurrentProduct.Firmenname || 'Anonym';
    document.getElementById('flohmarktModalSellerName').textContent = sellerName;
    document.getElementById('flohmarktModalAvatar').textContent = sellerName.charAt(0).toUpperCase();

    const email = flohmarktCurrentProduct['Deine E-mail'] || 'kontakt@vorchdorf.at';
    // Cleaniere Image-URL direkt
    let imageUrl = flohmarktCurrentProduct['Bild 1 Url von Imgur'] || '';
    if (imageUrl) {
        imageUrl = imageUrl.trim();
        if (imageUrl.includes('href=')) {
            const m = imageUrl.match(/href=["']([^"']+)["']/);
            imageUrl = m ? m[1] : '';
        }
        if (!imageUrl.startsWith('http')) {
            imageUrl = '';
        }
    }

    const subject = encodeURIComponent(`Anfrage zu: ${flohmarktCurrentProduct.Produktname}`);

    // Baue Email-Body mit allen Infos + Base64-Bild
    let emailBody = `Hallo ${sellerName},

ich interessiere mich für Ihr Produkt "${flohmarktCurrentProduct.Produktname}" auf dem Vorchdorf Flohmarkt.

Produktbeschreibung: ${flohmarktCurrentProduct.Beschreibung || 'Keine Angabe'}

Mit freundlichen Grüßen`;

    // Wenn Bild vorhanden, versuche es zu laden und als Base64 einzubinden
    if (imageUrl) {
        // Starte asynchrones Laden des Bildes - wird in openEmailPreviewModal verwendet
        loadImageAsBase64(imageUrl).then(base64Image => {
            if (base64Image) {
                window.flohmarktEmailImageBase64 = base64Image;
            }
        });
    }

    // Click-Handler für Contact-Button - öffne Email-Modal
    document.getElementById('flohmarktModalContactBtn').onclick = function (e) {
        e.preventDefault();
        closeFlohmarktModal();
        openEmailPreviewModal(email, subject, emailBody, imageUrl, sellerName);
    };
    document.getElementById('flohmarktModalContactBtn').href = 'javascript:void(0)'; // Verhindere default-Link

    // Bilder
    updateFlohmarktModalImage();
    updateFlohmarktImageDots();

    // Navigation anzeigen/verstecken
    const hasMultipleImages = images.length > 1;
    document.getElementById('flohmarktPrevImage').style.display = hasMultipleImages ? 'block' : 'none';
    document.getElementById('flohmarktNextImage').style.display = hasMultipleImages ? 'block' : 'none';

    document.getElementById('flohmarktModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateFlohmarktModalImage() {
    const images = flohmarktCurrentProduct.images || [];
    const container = document.getElementById('flohmarktModalImages');
    const img = document.getElementById('flohmarktModalImage');

    if (images.length > 0 && images[flohmarktCurrentImageIndex]) {
        img.src = images[flohmarktCurrentImageIndex];
        img.style.display = 'block';
    } else {
        const cat = flohmarktCurrentProduct.Kategorie || 'Sonstiges';
        const icon = flohmarktCategoryIcons[cat] || '📦';
        container.innerHTML = `
                    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;background:linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);">${icon}</div>
                `;
    }
}

function updateFlohmarktImageDots() {
    const images = flohmarktCurrentProduct.images || [];
    const dotsContainer = document.getElementById('flohmarktModalDots');

    if (images.length <= 1) {
        dotsContainer.innerHTML = '';
        return;
    }

    dotsContainer.innerHTML = images.map((_, i) => `
                <button class="flohmarkt-modal-image-dot ${i === flohmarktCurrentImageIndex ? 'active' : ''}" onclick="goToFlohmarktImage(${i})"></button>
            `).join('');
}

function goToFlohmarktImage(index) {
    flohmarktCurrentImageIndex = index;
    updateFlohmarktModalImage();
    updateFlohmarktImageDots();
}

function flohmarktNextImage() {
    const images = flohmarktCurrentProduct.images || [];
    if (images.length > 1) {
        flohmarktCurrentImageIndex = (flohmarktCurrentImageIndex + 1) % images.length;
        updateFlohmarktModalImage();
        updateFlohmarktImageDots();
    }
}

function flohmarktPrevImage() {
    const images = flohmarktCurrentProduct.images || [];
    if (images.length > 1) {
        flohmarktCurrentImageIndex = (flohmarktCurrentImageIndex - 1 + images.length) % images.length;
        updateFlohmarktModalImage();
        updateFlohmarktImageDots();
    }
}

// Lade Bild als Base64 (für Email-Einbettung)
function loadImageAsBase64(imageUrl) {
    return fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        })
        .catch(() => null);
}

function closeFlohmarktModal() {
    document.getElementById('flohmarktModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Flohmarkt Info Modal
function openFlohmarktInfo() {
    console.log('openFlohmarktInfo called');
    const infoHtml = `
                <div class="flohmarkt-info-modal" style="background: white; border-radius: 16px; max-width: 800px; width: 95%; max-height: 90vh; padding: 50px 40px; position: relative; z-index: 10001; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <button class="flohmarkt-info-close" onclick="closeFlohmarktInfo()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 2rem; cursor: pointer; color: #666;">✕</button>
                    <h2 style="font-size: 2rem; color: #000000; margin: 0 0 20px 0;">ℹ️ Willkommen beim Vorchdorfer-Flohmarkt!</h2>
                    
                    <p style="font-size: 1.1rem; color: #000000; line-height: 1.6; margin: 10px 0;">Hier bieten unsere Werberingmitglieder ausgewählte Artikel an – Schnäppchen, Einzelstücke oder Waren, für die im Geschäft einfach der Platz fehlt.</p>
                    
                    <h3 style="font-size: 1.3rem; color: #000000; margin: 20px 0 10px 0;">So funktioniert's:</h3>
                    <p style="font-size: 1.1rem; color: #000000; line-height: 1.6; margin: 10px 0;">Stöbern Sie in den Angeboten. Wenn Ihnen etwas gefällt, drücken Sie einfach auf E-Mail senden. Der Verkäufer meldet sich bei Ihnen, um einen Abholtermin zu vereinbaren. Bezahlt wird erst bei der Abholung – direkt und unkompliziert, ganz ohne Online-Zahlung.</p>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <button class="flohmarkt-info-btn-close" onclick="closeFlohmarktInfo()" style="background: #4CAF50; color: white; border: none; padding: 12px 30px; font-size: 1.1rem; border-radius: 8px; cursor: pointer;">✓ Schließen</button>
                    </div>
                </div>
            `;

    // Entferne alte Modal wenn existiert
    let oldModal = document.getElementById('flohmarktInfoModal');
    if (oldModal) {
        oldModal.remove();
    }

    // Erstelle neuen Modal mit INLINE STYLES
    const modal = document.createElement('div');
    modal.id = 'flohmarktInfoModal';
    modal.innerHTML = infoHtml;
    modal.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.5) !important;
                z-index: 999999 !important;
                padding: 20px !important;
                overflow-y: auto !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            `;
    document.body.appendChild(modal);

    // Click-handler zum schließen
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeFlohmarktInfo();
        }
    });

    document.body.style.overflow = 'hidden';
    console.log('Modal created and shown with inline styles');
}

function closeFlohmarktInfo() {
    console.log('closeFlohmarktInfo called');
    const modal = document.getElementById('flohmarktInfoModal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
    console.log('Modal closed');
}

// Email Preview Modal - mit Bild und HTML-Vorschau
function openEmailPreviewModal(toEmail, subject, body, imageUrl, sellerName) {
    window.flohmarktEmailImageURL = imageUrl; // URL für sendEmailFromPreview speichern
    // Erstelle Modal-HTML
    let previewHtml = `
                <div class="email-preview-modal">
                    <div class="email-preview-content">
                        <h3>📧 Email-Vorschau</h3>
                        
                        <div class="email-header">
                            <p><strong>An:</strong> ${toEmail}</p>
                            <p><strong>Betreff:</strong> ${decodeURIComponent(subject)}</p>
                        </div>
                        
                        <div class="email-body">
                            <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                            ${imageUrl ? `<div class="email-image" style="margin-top: 20px; text-align: center;">
                                <img src="${imageUrl}" alt="Produktbild" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #ddd;">
                            </div>` : ''}
                        </div>
                        
                        <div class="email-actions">
                            <button class="btn-primary" onclick="sendEmailFromPreview('${toEmail}', '${subject}', '${btoa(body)}')">📤 Email senden</button>
                            <button class="btn-secondary" onclick="closeEmailPreviewModal()">Abbrechen</button>
                        </div>
                    </div>
                </div>
            `;

    // Erstelle Modal-Container falls nicht vorhanden
    let modal = document.getElementById('emailPreviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emailPreviewModal';
        modal.style.cssText = `
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
                    z-index: 10000; padding: 20px;
                `;
        document.body.appendChild(modal);
    }

    modal.innerHTML = previewHtml;
    modal.style.display = 'flex';

    // Style Modal
    const styleTag = document.createElement('style');
    styleTag.textContent = `
                .email-preview-modal {
                    background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;
                    padding: 30px;
                }
                .flohmarkt-info-modal {
                    background: #ffffff; border-radius: 16px; box-shadow: 0 20px 80px rgba(0,0,0,0.5);
                    max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto;
                    padding: 50px 40px; position: relative; z-index: 10001;
                }
                .flohmarkt-info-close {
                    position: absolute; top: 20px; right: 20px;
                    width: 40px; height: 40px; border: none; background: #f0f0f0; border-radius: 50%;
                    font-size: 1.5rem; cursor: pointer; transition: all 0.3s;
                }
                .flohmarkt-info-close:hover {
                    background: #e0e0e0;
                }
                .flohmarkt-info-modal h2 {
                    margin-top: 0; color: #1a1a1a; margin-bottom: 25px; font-size: 2rem; font-weight: 700;
                }
                .flohmarkt-info-modal h3 {
                    color: #1a472a; margin-top: 30px; margin-bottom: 15px; font-size: 1.3rem; font-weight: 700;
                }
                .flohmarkt-info-modal p {
                    color: #1a1a1a; line-height: 1.8; margin-bottom: 20px; font-size: 1.1rem;
                }
                .flohmarkt-info-btn-close {
                    background: var(--primary); color: white; border: none;
                    padding: 15px 40px; border-radius: 50px; font-size: 1.1rem; font-weight: 700;
                    cursor: pointer; transition: all 0.3s;
                }
                .flohmarkt-info-btn-close:hover {
                    background: var(--primary-lighter); transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(26, 71, 42, 0.3);
                }
                .flohmarkt-info-overlay {
                    display: none;
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 1); align-items: center; justify-content: center;
                    z-index: 999999; padding: 20px; overflow-y: auto;
                }
                .flohmarkt-info-overlay.active {
                    display: flex !important;
                }
                .email-preview-content h3 {
                    margin-top: 0; color: #1a472a; margin-bottom: 20px; font-size: 1.3rem;
                }
                .email-header {
                    background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;
                    border-left: 4px solid #1a472a;
                }
                .email-header p {
                    margin: 5px 0; font-size: 0.95rem;
                }
                .email-body {
                    padding: 20px; background: #fafafa; border-radius: 8px; margin-bottom: 20px;
                    border: 1px solid #e0e0e0;
                }
                .email-actions {
                    display: flex; gap: 10px; justify-content: flex-end;
                }
                .btn-primary, .btn-secondary {
                    padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer;
                    font-size: 0.95rem; font-weight: 500; transition: all 0.3s;
                }
                .btn-primary {
                    background: #1a472a; color: white;
                }
                .btn-primary:hover {
                    background: #2d7a47; transform: translateY(-2px);
                }
                .btn-secondary {
                    background: #ddd; color: #333;
                }
                .btn-secondary:hover {
                    background: #ccc;
                }
                .email-image {
                    text-align: center;
                }
            `;
    document.head.appendChild(styleTag);
}

function closeEmailPreviewModal() {
    const modal = document.getElementById('emailPreviewModal');
    if (modal) modal.style.display = 'none';
}

function sendEmailFromPreview(toEmail, subject, encodedBody) {
    let body = atob(encodedBody); // Decode from base64

    // Wenn Bild-URL verfügbar, füge sie dem Text hinzu
    if (window.flohmarktEmailImageURL) {
        body += `\n\nProdukt-Bild: ${window.flohmarktEmailImageURL}`;
    }

    const mailtoLink = `mailto:${toEmail}?subject=${subject}&body=${encodeURIComponent(body)}`;
    // Schließe zuerst das Modal, dann öffne Email
    closeEmailPreviewModal();
    // Kurze Verzögerung damit das Modal geschlossen ist bevor Email öffnet
    setTimeout(() => {
        window.open(mailtoLink, '_blank');
    }, 300);
}

// Event Listeners für Flohmarkt
document.getElementById('flohmarktSearch').addEventListener('input', filterFlohmarktProducts);
document.getElementById('flohmarktCategory').addEventListener('change', filterFlohmarktProducts);
document.getElementById('flohmarktVerkaeifer').addEventListener('change', filterFlohmarktProducts);
document.getElementById('flohmarktModalClose').addEventListener('click', closeFlohmarktModal);
document.getElementById('flohmarktModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('flohmarktModalOverlay')) closeFlohmarktModal();
});
document.getElementById('flohmarktPrevImage').addEventListener('click', flohmarktPrevImage);
document.getElementById('flohmarktNextImage').addEventListener('click', flohmarktNextImage);
document.addEventListener('keydown', (e) => {
    if (document.getElementById('flohmarktModalOverlay').classList.contains('active')) {
        if (e.key === 'Escape') closeFlohmarktModal();
        if (e.key === 'ArrowLeft') flohmarktPrevImage();
        if (e.key === 'ArrowRight') flohmarktNextImage();
    }
});

// ===== IMMEDIATE CACHE & SERVICE WORKER CLEANUP =====
// MUST run FIRST before anything else
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
            reg.unregister();
            console.log('❌ SW unregistered');
        });
    });
}
if ('caches' in window) {
    caches.keys().then(names => names.forEach(name => caches.delete(name)));
}

// App Version - Update this with each release
const APP_VERSION = '5.4'; // Aktuelle Version der App
const CACHE_BUSTER = Date.now();
// AGGRESSIVE CACHE BUSTING - Prüfe online ob neue Version existiert
(async function checkForUpdates() {
    try {
        const response = await fetch('./index.html?t=' + Date.now(), {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        const html = await response.text();
        const match = html.match(/const APP_VERSION = '([^']+)'/);
        if (match && match[1] !== APP_VERSION) {
            console.log('Neue Version verfügbar: ' + match[1]);
            // Aktualisiere alle Caches und lade neu
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(reg => reg.unregister());
                });
            }
            if ('caches' in window) {
                caches.keys().then(names => names.forEach(name => caches.delete(name)));
            }
            // Hard reload nach 2 Sekunden
            setTimeout(() => {
                window.location.href = './?t=' + Date.now();
            }, 2000);
        }
    } catch (e) {
        console.log('Update-Check fehlgeschlagen:', e);
    }
})();

// AGGRESSIVE CACHE CLEARING
// 1. Unregister all service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
    });
}

// 2. Clear all caches
if ('caches' in window) {
    caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
    });
}

// 3. Clear storage if version mismatch
if (localStorage.getItem('appVersion') !== APP_VERSION) {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('appVersion', APP_VERSION);
    localStorage.setItem('cacheBuster', CACHE_BUSTER);
    // Force hard refresh
    setTimeout(() => location.reload(true), 200);
}

// App State
let currentView = 'home';
let navigationHistory = [];
let currentCategory = null;
let currentSubcategory = null;
let categoryCounts = {};

// Hilfsfunktion: Zählt Einträge pro Kategorie
function getCategoryItemCount(catId) {
    if (catId === 'shopping') {
        return allBusinesses.filter(b => b.werbering === true).length;
    }
    if (catId === 'clubs') {
        return Object.values(allClubs).reduce((acc, list) => acc + list.length, 0);
    }
    const cat = categories[catId];
    if (!cat) return 0;

    let count = 0;
    if (cat.items) count += cat.items.length;
    if (cat.subcategories) {
        Object.values(cat.subcategories).forEach(sub => {
            if (sub.items) count += sub.items.length;
        });
    }
    if (cat.content && cat.content.items) count += cat.content.items.length;
    if (cat.content && cat.content.sections) {
        cat.content.sections.forEach(s => count += s.items.length);
    }
    return count;
}

// Global Business Data - Loaded from businesses.json
let allBusinesses = [];
let allClubs = {};

// Gemeinde-Verwaltung Daten - Loaded from JSON
let allFormulare = [];
let allMitarbeiter = [];
let allAbteilungen = [];
let allGemeindebetriebe = [];

// Data Structure
const categories = {
    events: {
        id: 'events',
        title: 'Veranstaltungen',
        icon: '📅',
        description: 'Events, Konzerte, Feste & mehr',
        externalLink: 'events.html'
    },
    gallery: {
        id: 'gallery',
        title: 'Bilder & Galerie',
        icon: '📸',
        description: 'Bilder und Fotos von Vorchdorf',
        externalLink: 'http://www.vorchdorfer.at/'
    },
    mittagstisch: {
        id: 'mittagstisch',
        title: 'Mittagsmenü',
        icon: '🍽️',
        description: 'Aktuelle Menüpläne der Wirte',
        externalLink: 'mittagstisch.html'
    },
    welcome: {
        id: 'welcome',
        title: 'Willkommen',
        icon: '👋',
        description: 'Erste Infos über Vorchdorf',
        content: {
            type: 'info',
            sections: [
                {
                    title: '👋 Herzlich willkommen in Vorchdorf!',
                    items: [
                        {
                            title: 'Wir freuen uns, dass Sie hier sind!',
                            info: [
                                'Vorchdorf ist mehr als nur ein Wohnort – es ist das lebendige Tor zum Salzkammergut.',
                                'Zwischen Tradition, starker Wirtschaft und wunderschöner Natur bietet unsere Marktgemeinde alles, was man zum Wohlfühlen braucht.',
                                'Damit Sie sich schnell zurechtfinden, haben wir hier die wichtigsten Fakten und erste Schritte für Sie zusammengefasst.'
                            ]
                        }
                    ]
                },
                {
                    title: '🔢 Vorchdorf in Zahlen & Fakten',
                    items: [
                        {
                            title: 'Ein kurzer Steckbrief Ihrer neuen Heimat',
                            info: [
                                '📏 Fläche: 47,78 km²',
                                '📍 Seehöhe: 414 m ü. A.',
                                '👥 Einwohner: ca. 8.300 (Stand 2024/2025)',
                                '📮 Postleitzahl: 4655',
                                '🗺️ Lage: Bezirk Gmunden, direkt an der A1 Westautobahn',
                                '🏘️ Struktur: 27 Ortschaften, wichtiger Wirtschaftsstandort im Almtal'
                            ]
                        }
                    ]
                },
                {
                    title: '📝 Checkliste: Neu in Vorchdorf? Das ist zu tun',
                    items: [
                        {
                            title: '1️⃣ Anmeldung (Meldezettel)',
                            info: [
                                'Innerhalb von 3 Tagen nach Bezug der Unterkunft beim Meldeamt anmelden',
                                'Wo: Marktgemeindeamt Vorchdorf (Erdgeschoss, Bürgerservice)',
                                'Mitbringen: Meldezettel (unterschrieben), Reisepass/Personalausweis, Geburtsurkunde'
                            ]
                        },
                        {
                            title: '2️⃣ Müllabfuhr & ASZ-Karte',
                            info: [
                                'In Vorchdorf legen wir Wert auf Mülltrennung',
                                'Mülltonnen: Anmeldung für Restmüll- und Biotonnen am Gemeindeamt',
                                'ASZ (Altstoffsammelzentrum): OÖ-Siedlerkarte beim Gemeindeamt abholen'
                            ]
                        },
                        {
                            title: '3️⃣ Wasserzählerstand',
                            info: [
                                'Bei Eigentümerwechsel den Wasserzählerstand dem Steueramt melden',
                                'Wichtig für korrekte Abrechnung'
                            ]
                        },
                        {
                            title: '4️⃣ Hundesteuer',
                            info: [
                                'Wenn Sie einen vierbeinigen Freund mitbringen: Hund am Gemeindeamt anmelden',
                                'Dort erhalten Sie auch die Hundemarke'
                            ]
                        },
                        {
                            title: '5️⃣ Vorchdorf-Card (Tipp!)',
                            info: [
                                'Holen Sie sich Informationen zur Vorchdorf-Card (Werbering)',
                                'Unsere lokale Gutscheinkarte wird in unzähligen Geschäften akzeptiert',
                                'Ideal, um den Ort kennenzulernen'
                            ]
                        }
                    ]
                },
                {
                    title: '🏛️ Gemeindeamt & Öffnungszeiten',
                    items: [
                        {
                            title: 'Marktgemeinde Vorchdorf',
                            info: [
                                '📍 Schloßplatz 7, 4655 Vorchdorf',
                                '📞 Telefon: +43 7614 6555',
                                '📧 E-Mail: gemeinde@vorchdorf.ooe.gv.at'
                            ]
                        },
                        {
                            title: 'Öffnungszeiten Bürgerservice',
                            info: [
                                'Montag: 07:00 – 12:00 Uhr',
                                'Dienstag: 07:00 – 12:00 Uhr & 14:00 – 18:00 Uhr',
                                'Mittwoch: kein Parteienverkehr',
                                'Donnerstag: 07:00 – 12:00 Uhr & 14:00 – 17:00 Uhr',
                                'Freitag: 07:00 – 12:00 Uhr'
                            ]
                        }
                    ]
                },
                {
                    title: '💡 Wussten Sie schon?',
                    items: [
                        {
                            title: 'Vorchdorf als Verkehrsknotenpunkt',
                            info: [
                                'Vorchdorf ist ein Verkehrsknotenpunkt der besonderen Art',
                                'Bei uns treffen sich nicht nur Autobahn und Landstraßen zusammen',
                                'Sondern auch zwei berühmte Lokalbahnen am selben Bahnhof:',
                                '🚊 Die Traunseetram (aus Gmunden)',
                                '🚊 Die Vorchdorferbahn (aus Lambach)',
                                'Steigen Sie ein und erkunden Sie die Region!'
                            ]
                        }
                    ]
                }
            ]
        }
    },
    health: {
        id: 'health',
        title: 'Gesundheit & Soziales',
        icon: '🏥',
        description: 'Ärzte, Apotheken & Beratungsstellen',
        subcategories: {
            doctors_websites: {
                id: 'doctors_websites',
                icon: '👨‍⚕️',
                title: 'Ärzte in Vorchdorf - eigene Webseiten',
                description: 'Klicken für Details',
                items: [
                    {
                        title: 'Dr. Gruber Theresa',
                        info: ['Praktische Ärztin'],
                        link: 'https://www.gruberdoktor.at/'
                    },
                    {
                        title: 'Dr. Christoph Hohn',
                        info: ['Praktischer Arzt'],
                        link: 'https://www.docfinder.at/praktischer-arzt/4655-vorchdorf/dr-christoph-hohn'
                    },
                    {
                        title: 'Hausärztin Raml Katja',
                        info: ['Praktische Ärztin'],
                        link: 'https://hausaerztin-raml.at/'
                    },
                    {
                        title: 'Dr. Westreicher Claudia',
                        info: ['Praktische Ärztin'],
                        link: 'https://www.westreicher.at/'
                    },
                    {
                        title: 'Dr. Westreicher Richard',
                        info: ['Praktischer Arzt'],
                        link: 'https://www.westreicher.at/'
                    },
                    {
                        title: 'Dr. Klinkert',
                        info: ['Zahnarzt'],
                        link: 'https://www.zahnarzt-klinkert.at/'
                    },
                    {
                        title: 'Dr. Wolfgang Krenmayr',
                        info: ['Zahnarzt'],
                        link: 'https://www.docfinder.at/zahnarzt/4655-vorchdorf/dr-wolfgang-krenmayr'
                    },
                    {
                        title: 'Tierambulanz Vorchdorf (Kleintierklinik Vitalis)',
                        info: ['Tierarzt'],
                        link: 'https://www.kleintierklinik-vitalis.at/'
                    },
                    {
                        title: 'Traunkreis Vet Clinic',
                        info: ['Tierarzt'],
                        link: 'http://www.vetclinic.at/tierarztpraxis-vorchdorf/kontakt/'
                    },
                    {
                        title: 'Dr. Wurzer Helmut',
                        info: ['Tierarzt'],
                        link: 'https://www.vorchdorf.at/Wurzer_Helmut'
                    },
                    {
                        title: 'Dr. Huber Petra',
                        info: ['Facharzt'],
                        link: 'https://www.vorchdorf.at/Unser_Ort/Gesundheit_Soziales/Aerzte_in_Vorchdorf'
                    }
                ]
            },
            doctors_vorchdorf: {
                id: 'doctors_vorchdorf',
                icon: '🌐',
                title: 'Ärzte in Vorchdorf auf vorchdorf.at',
                directLink: 'https://www.vorchdorf.at/Unser_Ort/Gesundheit_Soziales/Aerzte_in_Vorchdorf'
            },
            doctors_opening_hours: {
                id: 'doctors_opening_hours',
                icon: '⏰',
                title: 'Ärzte in Vorchdorf Öffnungszeiten',
                directLink: 'https://www.google.com/search?q=ärzte+vorchdorf+öffnungszeiten'
            },
            specialists: {
                id: 'specialists',
                icon: '🔍',
                title: 'Kinder- und Fachärzte auf arztsuche',
                directLink: 'https://arztsuche.aekooe.at/finder/search/land/OO,SA'
            },
            pharmacy: {
                id: 'pharmacy',
                icon: '💊',
                title: 'Apotheken auf apothekensuche',
                directLink: 'https://www.apothekerkammer.at/apothekensuche/4655,+%C3%96sterreich/4655/@47.9989105,13.9451777/p=postal_code'
            },
            social: {
                id: 'social',
                icon: '🤝',
                title: 'Soziale Einrichtungen',
                items: [
                    {
                        title: 'Mutterberatung',
                        info: [
                            'Regelmäßige Beratungstermine',
                            'Infos auf der Gemeinde-Website'
                        ],
                        link: 'https://www.vorchdorf.at/Unser_Ort/Gesundheit_Soziales/Mutterberatung'
                    },
                    {
                        title: 'Sozialfonds "WIR helfen"',
                        info: [
                            'Unterstützung für Familien in Notlagen',
                            'Kontakt über Gemeindeamt Vorchdorf'
                        ],
                        link: 'https://www.vorchdorf.at/Unser_Ort/Gesundheit_Soziales/Sozialfonds_WIR_helfen_'
                    },
                    {
                        title: 'Gesundheitsnummer 1450',
                        info: [
                            'Telefonische Gesundheitsberatung',
                            'Rund um die Uhr erreichbar: 1450'
                        ],
                        link: 'https://www.sozialministerium.gv.at/Themen/Gesundheit/eHealth/Gesundheitsberatung-1450.html'
                    }
                ]
            }
        }
    },
    education: {
        id: 'education',
        title: 'Bildung',
        icon: '🎓',
        description: 'Schulen, Kindergärten & Weiterbildung',
        content: {
            type: 'list',
            items: [
                {
                    title: 'Erwachsenenbildung VHS',
                    link: 'https://www.vorchdorf.at/Erwachsenenbildung_VHS'
                },
                {
                    title: 'GTS - Ganztagesschule',
                    link: 'https://www.vorchdorf.at/GTS'
                },
                {
                    title: 'Kindergarten Fischböckau',
                    link: 'https://www.vorchdorf.at/Kindergarten_Fischboeckau_1'
                },
                {
                    title: 'Kindergarten Kunterbunt und Farbenfroh',
                    link: 'https://www.vorchdorf.at/Kindergarten_Kunterbunt_und_Farbenfroh'
                },
                {
                    title: 'Krabbelstube Fischböckau',
                    link: 'https://www.vorchdorf.at/Krabbelstube_Fischboeckau_1'
                },
                {
                    title: 'Landesmusikschule',
                    link: 'https://www.vorchdorf.at/Landesmusikschule'
                },
                {
                    title: 'Neue Mittelschule',
                    link: 'https://www.vorchdorf.at/Neue_Mittelschule'
                },
                {
                    title: 'Öffentliche Bibliothek',
                    link: 'https://bibliothek-vorchdorf.at/'
                },
                {
                    title: 'Otelo Vorchdorf',
                    link: 'https://www.vorchdorf.at/Otelo_Vorchdorf'
                },
                {
                    title: 'Schulausspeisung',
                    link: 'https://www.vorchdorf.at/Schulausspeisung_1'
                },
                {
                    title: 'Schulbibliothek',
                    link: 'https://www.vorchdorf.at/Bibliothek_Vorchdorf'
                },
                {
                    title: 'Schule an der Alm',
                    link: 'https://www.vorchdorf.at/Schule_an_der_Alm'
                },
                {
                    title: 'Spielgruppe',
                    link: 'https://www.vorchdorf.at/Spielgruppe_1'
                },
                {
                    title: 'Volksschule Pamet',
                    link: 'https://www.vorchdorf.at/Volksschule_Pamet_1'
                },
                {
                    title: 'Volksschule Vorchdorf',
                    link: 'https://www.vorchdorf.at/Volksschule_Vorchdorf_1'
                }
            ]
        }
    },
    sport_fitness: {
        id: 'sport_fitness',
        title: 'Sport & Fitness',
        icon: '⚽',
        description: 'Fitnessstudios, Sportangebote & Sportstätten',
        subcategories: {
            fitness: {
                id: 'fitness',
                title: '💪 Fitnessstudios',
                items: [
                    {
                        title: 'ANYTIME FITNESS Vorchdorf',
                        info: [
                            '💪 Modernes Fitnessstudio',
                            '🕒 24 Stunden geöffnet',
                            '📍 Bahnhofstraße 18, 4655 Vorchdorf',
                            '📞 +43 660 4476547'
                        ],
                        link: 'https://www.af-austria.at'
                    },
                    {
                        title: 'MEIN TRAINING Vorchdorf',
                        info: [
                            '💪 Persönliches Training',
                            '🏋️ Modern ausgestattet',
                            '📍 Lambacherstraße 32, 4655 Vorchdorf',
                            '📞 +43 7614 93041'
                        ],
                        link: 'https://www.mein-training.at'
                    }
                ]
            },
            sports: {
                id: 'sports',
                title: 'Sportangebote & Sportstätten',
                icon: '⚽',
                items: [
                    {
                        title: 'Tennisanlagen Vorchdorf',
                        info: [
                            '🎾 Schöne Tennisplätze',
                            '👥 Tennisclub Union Vorchdorf',
                            '📍 Laudachweg 13, Vorchdorf'
                        ],
                        link: 'https://www.utc-vorchdorf.at/'
                    },
                    {
                        title: 'Fußballplätze',
                        info: [
                            '⚽ Hauptplatz & Trainingsplätze',
                            '👥 ASKÖ Vorchdorf & SV Vorchdorf',
                            '📍 Streiningerstraße 2c, Vorchdorf'
                        ],
                        link: 'https://vereine.oefb.at/AskoeVorchdorf/Sportplatz/'
                    },
                    {
                        title: 'Schwimmen & Wassersport',
                        info: [
                            '🏊 Freibad Vorchdorf (Almtalbad)',
                            '🚣 Trauntal Wassersport',
                            '📍 Laudachweg 11, Vorchdorf'
                        ],
                        link: 'https://www.vorchdorf.at/Almtalbad_Vorchdorf_1'
                    },
                    {
                        title: 'Pumptrack',
                        info: [
                            '🏍️ Mountainbike Pumptrack',
                            '👥 Naturfreunde Vorchdorf',
                            '✓ Für Anfänger & Profis'
                        ],
                        link: 'https://vorchdorf.naturfreunde.at/ueber-uns/pumptrack/'
                    },
                    {
                        title: 'Sporthalle Vorchdorf',
                        info: [
                            '🏀 Moderne Sporthalle',
                            '📍 Schulstraße 8, Vorchdorf',
                            '☎️ 07614 635645'
                        ],
                        link: 'https://www.google.com/search?q=sporthalle+vorchdorf&rlz=1C5CHFA_enAT1105AT1105&oq=sporthalle+vorchdorf&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCDIzNTNqMGo0qAIAsAIB&sourceid=chrome&ie=UTF-8&sei=reJgaZLlAfaJ7NYPlIKd6Ao#vhid=/g/1td7m3nd&vssid=lcl'
                    },
                    {
                        title: 'Lauftraining Vorchdorf',
                        info: [
                            '🏃 Laufgruppe für Erwachsene',
                            '👥 Gemeinsam trainieren',
                            '📍 Verschiedene Strecken'
                        ],
                        link: 'https://www.vorchdorf.at/Lauftraining_Erwachsene_6'
                    }
                ]
            },
            sports_clubs: {
                id: 'sports_clubs',
                title: '🏅 Sportvereine',
                description: '15 Sportvereine in Vorchdorf',
                items: []
            }
        }
    },
    clubs: {
        id: 'clubs',
        title: 'Vereine',
        icon: '🤝',
        description: 'Über 60 aktive Vereine in Vorchdorf',
        subcategories: {
            sport: {
                id: 'sport',
                title: '⚽ Sport',
                description: '15 Sportvereine in Vorchdorf',
                items: []
            },
            kultur: {
                id: 'kultur',
                title: '🎭 Kultur',
                description: '10 Kulturvereine in Vorchdorf',
                items: []
            },
            musik: {
                id: 'musik',
                title: '🎵 Musik',
                description: '7 Musikvereine in Vorchdorf',
                items: []
            },
            religion: {
                id: 'religion',
                title: '⛪ Religion',
                description: '6 Religionsgemeinschaften',
                items: []
            },
            soziales: {
                id: 'soziales',
                title: '🤝 Soziales & Jugend',
                description: '10 soziale Vereine',
                items: []
            },
            sonstiges: {
                id: 'sonstiges',
                title: '📋 Sonstiges',
                description: '13 weitere Vereine',
                items: []
            }
        }
    },
    shopping: {
        id: 'shopping',
        title: 'Einkaufen & Wirtschaft',
        icon: '🛍️',
        description: 'Über 200 Werbering-Betriebe in 23 Kategorien',
        subcategories: {
            legal: {
                id: 'legal',
                title: '⚖️ Anwälte & Notare',
                description: 'Rechtsbeistand vor Ort'
            },
            banks: {
                id: 'banks',
                title: '🏦 Banken & Versicherungen',
                description: 'Finanzdienstleister in der Region'
            },
            construction: {
                id: 'construction',
                title: '🏠 Bauen, Wohnen, Einrichten',
                description: 'Bau, Handwerk und Einrichtung'
            },
            beauty: {
                id: 'beauty',
                title: '💪 Beauty & Fitness',
                description: 'Fitnessstudios, Friseure & Kosmetik'
            },
            accounting: {
                id: 'accounting',
                title: '📊 Buchhaltung & Steuerberatung',
                description: 'Steuerberater und Wirtschaftstreuhänder'
            },
            catering: {
                id: 'catering',
                title: '🎪 Catering & Veranstaltungstechnik',
                description: 'Catering-Services und Event-Technik'
            },
            services: {
                id: 'services',
                title: '🔧 Dienstleistungen',
                description: 'Verschiedene Service-Angebote'
            },
            it: {
                id: 'it',
                title: '💻 EDV',
                description: 'IT-Dienstleister und Bürotechnik'
            },
            photo: {
                id: 'photo',
                title: '📸 Fotografie',
                description: 'Professionelle Fotografen'
            },
            flowers: {
                id: 'flowers',
                title: '🌸 Gärtnerei & Floristik',
                description: 'Blumen und Gartenbedarf'
            },
            healthcare: {
                id: 'healthcare',
                title: '⚕️ Gesundheit und Lebensberatung',
                description: 'Apotheken, Optiker, Wellness & Therapie'
            },
            wholesale: {
                id: 'wholesale',
                title: '📦 Großhandel',
                description: 'Großhandel und Lieferanten'
            },
            gastro: {
                id: 'gastro',
                title: '🍽️ Hotelerie & Gastronomie',
                description: 'Hotels, Restaurants, Cafés & Bars'
            },
            industry: {
                id: 'industry',
                title: '🏭 Industrie',
                description: 'Industriebetriebe und Produktion'
            },
            cars: {
                id: 'cars',
                title: '🚙 KFZ & Fahrrad',
                description: 'Autohäuser, Werkstätten & Fahrräder'
            },
            culture: {
                id: 'culture',
                title: '🎭 Kultur & Freizeit',
                description: 'Museen, Freibäder und Reisebüros'
            },
            food: {
                id: 'food',
                title: '🛒 Lebensmittel',
                description: 'Supermärkte, Bäckereien & Fleischereien'
            },
            fashion: {
                id: 'fashion',
                title: '👗 Mode & Accessoire',
                description: 'Modehäuser und Schuhgeschäfte'
            },
            jewelry: {
                id: 'jewelry',
                title: '💎 Schmuck, Uhren, Manufakturen',
                description: 'Juweliere und Handwerkskunst'
            },
            gas: {
                id: 'gas',
                title: '⛽ Tankstellen',
                description: 'Tankstellen in der Region'
            },
            tobacco: {
                id: 'tobacco',
                title: '🚬 Trafiken',
                description: 'Tabakwaren und Zeitschriften'
            },
            transport: {
                id: 'transport',
                title: '🚗 Transport',
                description: 'Taxi, Busse und Mietwagen'
            },
            advertising: {
                id: 'advertising',
                title: '📢 Werbung & PR',
                description: 'Werbeagenturen und Medien'
            },
            all_businesses_az: {
                id: 'all_businesses_az',
                title: '🎖️ Alle Werbering-Mitglieder von A-Z',
                description: 'Komplette Übersicht aller Werbering-Mitglieder alphabetisch sortiert nach Branche'
            }
        }
    },
    leisure: {
        id: 'leisure',
        title: 'Freizeit & Kultur',
        icon: '🎨',
        description: 'Veranstaltungen, Sehenswürdigkeiten & mehr',
        subcategories: {
            sights: {
                id: 'sights',
                title: '🏛️ Sehenswürdigkeiten',
                items: [
                    {
                        title: '🏍️ Salzkammergut Motorradmuseum',
                        link: 'http://www.motorradmuseum-vorchdorf.at/',
                        info: [
                            'Über 300 Exponate aus 100 Jahren Geschichte',
                            'Authentische wasserkraftbetriebene Werkstatt'
                        ]
                    },
                    {
                        title: '🔑 Escape House Vorchdorf',
                        link: 'https://escape-house.at/',
                        info: [
                            '7 verschiedene Themenräume',
                            'Einer der größten Anbieter Oberösterreichs',
                            'Im Schloss Hochhaus'
                        ]
                    },
                    {
                        title: '🎭 Kitzmantelfabrik',
                        link: 'https://www.kitzmantelfabrik.at/',
                        info: [
                            'Modernes Veranstaltungszentrum (ehem. Lederfabrik)',
                            'Mix aus Industriecharme & Architektur'
                        ]
                    },
                    {
                        title: '🍴 Gasthaus Schloss Hochhaus',
                        link: 'https://schloss-hochhaus.at/',
                        info: [
                            '1 Gault&Millau Haube',
                            'Regionale Almtal-Küche',
                            'Idyllischer Gastgarten im Schlosshof'
                        ]
                    },
                    {
                        title: '🏛️ Museum der Region Vorchdorf',
                        link: 'https://www.museum-vorchdorf.at/',
                        info: [
                            'Sammlung zur Ur- und Frühgeschichte',
                            'Größte Pfeifensammlung Österreichs'
                        ]
                    },
                    {
                        title: '🌟 Restaurant Tanglberg',
                        link: 'http://www.tanglberg.at/',
                        info: [
                            '4 Gault&Millau Hauben',
                            'Gourmetrestaurant im Gebäude aus dem 16. Jh.'
                        ]
                    },
                    {
                        title: '⛪ Pfarrkirche Vorchdorf',
                        link: 'https://www.dioezese-linz.at/vorchdorf',
                        info: [
                            'Barockisierter spätgotischer Bau (um 1700)',
                            'Farbenfrohe Deckenfresken von 1760'
                        ]
                    }
                ]
            },
            nature: {
                id: 'nature',
                title: '🌲 Natur & Erholung',
                items: [
                    {
                        title: 'Wanderwege',
                        link: 'https://www.vorchdorfonline.at/sites/default/files/wanderkarte_vorchdorf_2022.pdf',
                        info: [
                            'Schöne Wanderrouten in der Umgebung',
                            'Laudachtal',
                            'Almwanderungen'
                        ]
                    },
                    {
                        title: 'Radwege',
                        link: 'https://traunsee-almtal.salzkammergut.at/region/unsere-orte/vorchdorf/radfahren.html',
                        info: [
                            'Gut ausgebautes Radwegenetz',
                            'Almtal-Radweg'
                        ]
                    }
                ]
            },
            playgrounds: {
                id: 'playgrounds',
                title: '🎪 Spielplätze für Kinder',
                items: [
                    {
                        title: 'Spielplatz Vorchdorf',
                        link: 'https://www.spiel-raum-creativ.at/projekte/spielplaetze/vorchdorf/',
                        info: [
                            '🎪 Hauptspielplatz',
                            '📍 Krumphuberweg 10, Vorchdorf',
                            '⭐ Sehr gut erhalten',
                            '✓ Verschiedene Spielgeräte'
                        ]
                    },
                    {
                        title: 'Spielplatz Schulstraße',
                        info: [
                            '🎪 Schulnähe Spielplatz',
                            '📍 Schulstraße 18, Vorchdorf',
                            '✓ Für Grundschüler geeignet',
                            '✓ Wohngebiet-Nähe'
                        ]
                    },
                    {
                        title: 'Spielplatz Kindertraum - Wirt in der Edt',
                        info: [
                            '🎪 Besonderer Spielplatz',
                            '📍 Wirt in der Edt, Vorchdorf',
                            '🍽️ Kombination mit Restaurant'
                        ],
                        link: 'https://www.wirt-edt.at/spielplatz/'
                    }
                ]
            },
            events: {
                id: 'events',
                title: '📅 Veranstaltungen',
                description: 'Aktuelle Termine und Events',
                externalLink: 'events.html'
            },
            kulturvilla: {
                id: 'kulturvilla',
                title: '🏰 Kulturvilla Vorchdorf',
                description: 'Konzerte, Kurse & Begegnung',
                externalLink: 'https://www.kulturvilla.at/'
            },
            kitzmantel_direct: {
                id: 'kitzmantel_direct',
                title: '🎭 Kitzmantelfabrik',
                description: 'Veranstaltungszentrum Vorchdorf',
                externalLink: 'https://www.kitzmantelfabrik.at/'
            }
        }
    },
    mobility: {
        id: 'mobility',
        title: 'Mobilität',
        icon: '🚌',
        description: 'Bus, Bahn & Verkehr',
        subcategories: {
            taxi_quick: {
                id: 'taxi_quick',
                title: '☎️ Taxi sofort anrufen',
                description: 'Schnelle Fahrservices - direkt anrufen'
            },
            public: {
                id: 'public',
                title: 'Öffentlicher Verkehr',
                items: [
                    {
                        title: 'Vorchdorfer Bahn',
                        info: [
                            '🚂 Historische Bahnlinie',
                            'Mit liebevoll restaurierten Waggons'
                        ],
                        link: 'https://www.vorchdorferbahn.at/'
                    },
                    {
                        title: 'Fahrplanauskunft OÖ VV',
                        info: [
                            '🚌 Öffentliche Verkehrsmittel',
                            'Busse, Bahnen und Straßenbahnen'
                        ],
                        link: 'https://www.ooevv.at/de/fahrplaene/fahrplanauskunft.html'
                    },
                    {
                        title: 'Stern und Hafferl Bahn',
                        info: [
                            '🚂 Lokalbahn im Salzkammergut',
                            'Fahrplan als PDF'
                        ],
                        link: 'https://www.stern-verkehr.at/wp-content/uploads/2025/11/Zettelfahrplan-OOeVV-420x330mm-LV-2026-web-1.pdf'
                    },
                    {
                        title: 'Traunseetram',
                        info: [
                            '🚊 Straßenbahn am Traunsee',
                            'Fahrplan als PDF'
                        ],
                        link: 'https://www.stern-verkehr.at/wp-content/uploads/2025/11/Zettelfahrplan-OOeVV-735x330mm-GV-2026-web.pdf'
                    },
                    {
                        title: 'Busfahrplan Region',
                        info: [
                            '🚌 Busverbindungen lokal',
                            'Fahrplan als PDF'
                        ],
                        link: 'https://www.ooevv.at/fileadmin/OOEVV/Downloads/Fahrplaene/527.pdf'
                    },
                    {
                        title: 'Salzkammergut Shuttle',
                        info: [
                            '🚐 Bedarfsgesteuerter Bustransport',
                            'Sichere und komfortable Beförderung'
                        ],
                        link: 'https://traunsee-almtal.salzkammergut.at/anreise-nahverkehr/salzkammergut-shuttle.html'
                    }
                ]
            },
            taxi: {
                id: 'taxi',
                title: 'Taxi & private Fahrservices',
                items: [
                    {
                        title: 'Taxi Wiedl',
                        info: [
                            '🚕 Zuverlässiger Taxiservice',
                            'Personenbeförderung aller Art',
                            '📍 Vorchdorf'
                        ],
                        link: 'https://to4009.wixsite.com/wiedl'
                    },
                    {
                        title: 'Attwenger Taxi',
                        info: [
                            '🚕 Personenbeförderung',
                            'Transporte aller Art',
                            '📍 Vorchdorf'
                        ],
                        link: 'https://www.vorchdorfonline.at/users/attwenger'
                    },
                    {
                        title: 'Gollinger Personenbeförderung',
                        info: [
                            '🚌 Busunternehmen',
                            'Fahrservices in der Region',
                            '📍 Vorchdorf'
                        ],
                        link: 'https://www.gollinger.net'
                    },
                    {
                        title: 'AIGNER Mietwagen, Bus & Taxi',
                        info: [
                            '🚕 Mietwagen und Transporte',
                            'Komplette Mobilitätslösungen',
                            '📍 Vorchdorf'
                        ],
                        link: 'https://www.mietwagen-aigner.at'
                    }
                ]
            },
            parking: {
                id: 'parking',
                title: 'Parken & Verkehr',
                items: [
                    {
                        title: 'Parkplätze Vorchdorf',
                        info: [
                            '🅿️ Kostenlose Parkplätze',
                            'Zentrum und Umgebung',
                            'Übersicht aller Parkplätze'
                        ],
                        link: 'https://www.viamichelin.at/karten-stadtplan/parkplatze/osterreich/oberosterreich/gmunden/vorchdorf-4655'
                    },
                    {
                        title: 'Digitaler Ortsplan',
                        info: [
                            '🗺️ Interaktive Karte',
                            'Alle Einrichtungen und Dienste',
                            'Adressen und Kontakte'
                        ],
                        link: 'https://www.vorchdorf.at/system/web/mapfinder2.aspx?menuonr=221152584&sprache=1'
                    },
                    {
                        title: 'Verkehrsanbindung',
                        info: [
                            '🛣️ A1 Westautobahn in der Nähe',
                            'Gute Erreichbarkeit Linz/Salzburg',
                            'Zentrale Lage'
                        ],
                        link: 'https://www.vorchdorf.at'
                    }
                ]
            },
            cycling: {
                id: 'cycling',
                title: 'Radfahren',
                items: [
                    {
                        title: 'Radfahrwege',
                        info: [
                            '🚴 Gut ausgebaute Radwege',
                            'Almtal-Radweg durch Vorchdorf',
                            'Streckeninfos und Touren'
                        ],
                        link: 'https://traunsee-almtal.salzkammergut.at/region/unsere-orte/vorchdorf/radfahren.html'
                    },
                    {
                        title: 'E-Bike Ladestationen',
                        info: [
                            '🔌 Schlossplatz vor dem Gastgarten',
                            'Direkt beim Schloss Hochhaus',
                            'Kostenlos verfügbar'
                        ],
                        link: 'https://www.vorchdorf.at/system/web/mapfinder2.aspx?menuonr=221152584&sprache=1'
                    },
                    {
                        title: 'E-Auto Ladestationen',
                        info: [
                            '⚡ Elektrotankstellen in Vorchdorf',
                            'Ladestationen für E-Fahrzeuge',
                            'Finde die nächste Stromtankstelle'
                        ],
                        link: 'https://chargefinder.com/de/vorchdorf/stromtankstelle/3x3d9'
                    }
                ]
            }
        }
    },
    administration: {
        id: 'administration',
        title: 'Gemeinde & Verwaltung',
        icon: '🏛️',
        description: 'Gemeindeamt, Formulare & Kontakte',
        externalLink: './gemeinde-verwaltung/index.html'
    },
    waste_calendar: {
        id: 'waste_calendar',
        title: 'Müllkalender',
        icon: '🗑️',
        description: 'Abfuhrtermine für Ihre Straße',
        wasteCalendar: true
    },
    emergency: {
        id: 'emergency',
        title: 'Notfallkontakte & Standorte',
        icon: '🆘',
        description: 'Wichtige Nummern und Standorte im Notfall',
        content: {
            type: 'info',
            sections: [
                {
                    title: '📍 Notfall-Standorte in Vorchdorf',
                    items: [
                        {
                            title: 'Polizei & Rettung',
                            info: [
                                '🚔 Polizeiinspektion Vorchdorf',
                                '🚑 Rettung (im gleichen Gebäude)',
                                '📍 Dr. Mitterbauerstraße 4c, 4655 Vorchdorf',
                                '☎️ Polizei: 133 | Rettung: 144',
                                '⏰ Rund um die Uhr erreichbar'
                            ],
                            link: 'https://www.vorchdorf.at/Polizeiinspektion_Vorchdorf'
                        },
                        {
                            title: 'Feuerwehr Vorchdorf',
                            info: [
                                '🚒 Freiwillige Feuerwehr',
                                '📍 Dr. Mitterbauerstraße 4b, 4655 Vorchdorf',
                                '☎️ Notfall: 122',
                                '📱 +43 7614 7012'
                            ]
                        },
                        {
                            title: 'Defibrillator (AED)',
                            info: [
                                '❤️ Automatischer Defibrillator',
                                '📍 Pfarrhofdurchfahrt, Vorchdorf',
                                '⏱️ 24/7 verfügbar',
                                '✓ Im Notfall lebensrettend'
                            ],
                            link: 'https://www.vorchdorfonline.at/artikel/defibrillator-vorchdorfer-pfarrfhofdurchfahrt'
                        },
                        {
                            title: 'Wasserrettung Vorchdorf',
                            info: [
                                '🚨 Österreichisches Wasserrettungswesen',
                                '👥 Rettung & Sicherheit am Wasser',
                                '📍 Almtal, Vorchdorf',
                                '✓ Spezialisierte Wasserrettung'
                            ],
                            link: 'https://ooe.owr.at/vorchdorf/ueber-uns/unsere-ortsstelle/'
                        }
                    ]
                },
                {
                    title: 'Notrufnummern',
                    items: [
                        {
                            title: 'Ärztefunkdienst',
                            info: ['🏥 141 - Ärztlicher Notdienst']
                        },
                        {
                            title: 'Euronotruf',
                            info: ['☎️ 112 - Internationaler Notruf']
                        },
                        {
                            title: 'Feuerwehr',
                            info: ['🚒 122 - Feuerwehr Vorchdorf']
                        },
                        {
                            title: 'Gesundheitsberatung',
                            info: ['☎️ 1450 - Telefonische Gesundheitsberatung (24/7)']
                        },
                        {
                            title: 'Polizei',
                            info: ['👮 133 - Polizeiinspektion']
                        },
                        {
                            title: 'Rettung',
                            info: ['🚑 144 - Rettungsdienst']
                        },
                        {
                            title: 'Telefonseelsorge',
                            info: ['☎️ 142 - Rund um die Uhr']
                        },
                        {
                            title: 'Vergiftungsinformationszentrale',
                            info: ['☎️ +43 1 406 43 43']
                        }
                    ]
                },
                {
                    title: 'Weitere wichtige Kontakte',
                    items: [
                        {
                            title: 'Apothekennotruf',
                            info: ['Aktuelle Notdienste online'],
                            link: 'https://www.apothekerkammer.at/apothekensuche/4655,+%C3%96sterreich/4655/@47.9989105,13.9451777/p=postal_code'
                        },
                        {
                            title: 'Krankenhaus Gmunden',
                            info: ['☎️ +43 5 0554 66-0', 'Ca. 10 km entfernt'],
                            link: 'https://www.ooeg.at/sk/gm'
                        },
                        {
                            title: 'Krankenhaus Vöcklabruck',
                            info: ['☎️ +43 5 0554 72-0', 'Ca. 25 km entfernt'],
                            link: 'https://www.ooeg.at/sk/vb'
                        },
                        {
                            title: 'Krankenhaus Wels',
                            info: ['☎️ +43 7242 415-0', 'Ca. 35 km entfernt'],
                            link: 'https://www.klinikum-wegr.at'
                        },
                        {
                            title: 'Kleintierklinik Vitalis',
                            info: ['4655 Vorchdorf', 'Tierärztliche Notfallversorgung'],
                            link: 'https://www.kleintierklinik-vitalis.at/'
                        },
                        {
                            title: 'Tierklinik Sattledt',
                            info: ['4642 Sattledt', 'Tierärztliche Notfallversorgung'],
                            link: 'https://www.tierklinik-sattledt.at/'
                        }
                    ]
                }
            ]
        }
    },
    flohmarkt: {
        id: 'flohmarkt',
        title: 'Flohmarkt',
        icon: '🛒',
        description: 'Kaufen & Verkaufen in der Region',
        isFlohmarkt: true
    }
};

// Lade Businesses aus JSON Datei
async function loadBusinesses() {
    try {
        // AGGRESSIVE CACHE BUSTING
        const response = await fetch('./businesses.json?v=' + Date.now());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const businesses = await response.json();

        // Speichere in allBusinesses Variable
        allBusinesses = businesses;

        console.log(`✓ ${businesses.length} Betriebe geladen`);

        if (businesses.length === 0) {
            console.warn('Warnung: businesses.json ist leer');
        }
    } catch (error) {
        console.error('Fehler beim Laden von businesses.json:', error);
        allBusinesses = []; // Fallback zu leerem Array
        showDataError('Betriebe');
    }
}

async function loadClubs() {
    try {
        const response = await fetch('./clubs.json?v=' + Date.now());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const clubs = await response.json();
        allClubs = clubs;

        // Populate categories from the loaded data
        if (categories.clubs && categories.clubs.subcategories) {
            Object.keys(clubs).forEach(key => {
                if (categories.clubs.subcategories[key]) {
                    categories.clubs.subcategories[key].items = clubs[key];
                }
            });
        }

        // Sync Sport & Fitness subcategory
        if (categories.sport_fitness && categories.sport_fitness.subcategories && categories.sport_fitness.subcategories.sports_clubs) {
            categories.sport_fitness.subcategories.sports_clubs.items = clubs.sport || [];
        }

        console.log(`✓ Vereine geladen`);
    } catch (error) {
        console.error('Fehler beim Laden von clubs.json:', error);
        allClubs = {};
        showDataError('Vereine');
    }
}

// Lade Gemeinde-Verwaltung Daten
async function loadGemeindeData() {
    const ts = Date.now();
    try {
        // Lade Formulare
        const formResponse = await fetch(`./gemeinde-verwaltung/data/formulare.json?v=${ts}`);
        if (!formResponse.ok) throw new Error(`HTTP error! status: ${formResponse.status}`);
        const formData = await formResponse.json();
        allFormulare = formData.formulare || [];
        console.log(`✓ ${allFormulare.length} Formulare geladen`);
    } catch (error) {
        console.error('Fehler beim Laden von formulare.json:', error);
        allFormulare = [];
    }

    try {
        // Lade Mitarbeiter
        const mitResponse = await fetch(`./gemeinde-verwaltung/data/mitarbeiter.json?v=${ts}`);
        if (!mitResponse.ok) throw new Error(`HTTP error! status: ${mitResponse.status}`);
        const mitData = await mitResponse.json();
        allMitarbeiter = mitData.mitarbeiter || [];
        console.log(`✓ ${allMitarbeiter.length} Mitarbeiter geladen`);
    } catch (error) {
        console.error('Fehler beim Laden von mitarbeiter.json:', error);
        allMitarbeiter = [];
    }

    try {
        // Lade Abteilungen
        const abtResponse = await fetch(`./gemeinde-verwaltung/data/abteilungen.json?v=${ts}`);
        if (!abtResponse.ok) throw new Error(`HTTP error! status: ${abtResponse.status}`);
        const abtData = await abtResponse.json();
        allAbteilungen = abtData.abteilungen || [];
        console.log(`✓ ${allAbteilungen.length} Abteilungen geladen`);
    } catch (error) {
        console.error('Fehler beim Laden von abteilungen.json:', error);
        allAbteilungen = [];
    }

    try {
        // Lade Gemeindebetriebe
        const betResponse = await fetch(`./gemeinde-verwaltung/data/gemeindebetriebe.json?v=${ts}`);
        if (!betResponse.ok) throw new Error(`HTTP error! status: ${betResponse.status}`);
        const betData = await betResponse.json();
        allGemeindebetriebe = betData.betriebe || [];
        console.log(`✓ ${allGemeindebetriebe.length} Gemeindebetriebe geladen`);
    } catch (error) {
        console.error('Fehler beim Laden von gemeindebetriebe.json:', error);
        allGemeindebetriebe = [];
    }
}

function showDataError(type) {
    // Zeige eine kleine Warnung in der UI wenn Daten nicht geladen werden können
    const banner = document.createElement('div');
    banner.style.cssText = 'background: #ff4d4d; color: white; padding: 10px; text-align: center; font-size: 0.9em; position: sticky; top: 0; z-index: 9999;';
    banner.innerHTML = `⚠️ <b>Fehler:</b> ${type} konnten nicht geladen werden. Bitte Seite neu laden oder Cache leeren.`;
    document.body.prepend(banner);
    setTimeout(() => banner.remove(), 10000);
}

// Initialize App
function init() {
    renderHome();
}

// Fetch Weather Data
async function fetchWeather() {
    try {
        const lat = 48.0039;
        const lon = 13.9485;
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe/Vienna`
        );
        const data = await response.json();
        return data.daily;
    } catch (error) {
        console.error('Wetter konnte nicht geladen werden:', error);
        return null;
    }
}

function getWeatherIcon(weatherCode) {
    const wmoToIcon = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '⛈️', 65: '⛈️',
        71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌧️', 81: '⛈️', 82: '⛈️',
        85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return wmoToIcon[weatherCode] || '🌤️';
}

function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: 'Klar', 1: 'Heiter', 2: 'Bewölkt', 3: 'Bedeckt', 45: 'Nebel', 48: 'Nebel',
        51: 'Leicht Regen', 53: 'Mäßig Regen', 55: 'Starker Regen', 61: 'Regen',
        63: 'Regen', 65: 'Starker Regen', 71: 'Schnee', 73: 'Schnee', 75: 'Schnee',
        77: 'Schnee', 80: 'Regen', 81: 'Starker Regen', 82: 'Extremer Regen',
        85: 'Schnee', 86: 'Schnee', 95: 'Gewitter', 96: 'Gewitter', 99: 'Gewitter'
    };
    return descriptions[weatherCode] || 'Unbekannt';
}

// Render Home View
function renderHome() {
    currentView = 'home';
    navigationHistory = [];
    currentCategory = null;
    currentSubcategory = null;

    document.getElementById('emergencyBanner').classList.remove('hidden');
    document.getElementById('breadcrumb').classList.add('hidden');
    document.getElementById('backButton').classList.add('hidden');
    document.getElementById('floatingBackButton').classList.remove('visible');
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('flohmarktContainer').classList.remove('active');

    const mainContent = document.getElementById('mainContent');
    const weatherWidget = document.getElementById('weatherWidget');

    // Render categories in custom order
    const categoryOrder = ['welcome', 'municipality', 'health', 'emergency', 'administration', 'mobility', 'education', 'shopping', 'leisure', 'sport_fitness', 'clubs', 'events', 'gallery', 'mittagstisch', 'waste_calendar', 'flohmarkt'];
    const sortedCategories = categoryOrder.map(id => categories[id]).filter(cat => cat);

    mainContent.innerHTML = `
                <div class="cards-grid fade-in">
                    ${sortedCategories.map(cat => `
                        <div class="card" onclick="navigateToCategory('${cat.id}')">
                            <span class="card-icon">${cat.icon}</span>
                            <h3>${cat.title}</h3>
                            <p>${cat.description}</p>
                        </div>
                    `).join('')}
                </div>
            `;

    // Fetch and display weather in dedicated widget below emergency
    fetchWeather().then(weatherData => {
        if (weatherData && weatherData.time) {
            weatherWidget.innerHTML = `
                        <div class="weather-container">
                            <h3>🌡️ Wetter in Vorchdorf</h3>
                            <div class="weather-content">
                                ${weatherData.time.slice(0, 3).map((date, idx) => {
                const dateObj = new Date(date);
                const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
                const icon = getWeatherIcon(weatherData.weather_code[idx]);
                const desc = getWeatherDescription(weatherData.weather_code[idx]);
                const tempMax = Math.round(weatherData.temperature_2m_max[idx]);
                const tempMin = Math.round(weatherData.temperature_2m_min[idx]);
                return `
                                        <div class="weather-day">
                                            <h4>${dayName}</h4>
                                            <div class="weather-icon">${icon}</div>
                                            <div class="weather-temp">${tempMax}° / ${tempMin}°</div>
                                            <div class="weather-description">${desc}</div>
                                        </div>
                                    `;
            }).join('')}
                            </div>
                        </div>
                    `;
            weatherWidget.classList.remove('hidden');
        } else {
            weatherWidget.classList.add('hidden');
        }
    }).catch(error => {
        console.error('Wetter-Fehler, verstecke Widget:', error);
        weatherWidget.classList.add('hidden');
    });
}

// Toggle Werbering Filter
function toggleWerberingFilter() {
    showOnlyWerbering = !showOnlyWerbering;
    navigateToCategory('shopping');
}

// Navigate to Category
function navigateToCategory(categoryId) {
    const category = categories[categoryId];
    if (!category) return;

    // Handle Flohmarkt
    if (category.isFlohmarkt) {
        currentView = 'flohmarkt';
        currentCategory = categoryId;
        navigationHistory.push({ type: 'home' });

        document.getElementById('emergencyBanner').classList.add('hidden');
        document.getElementById('weatherWidget').classList.add('hidden');
        document.getElementById('backButton').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('flohmarktContainer').classList.add('active');
        updateBreadcrumb([{ text: category.title }]);

        loadFlohmarktProducts();
        return;
    }

    // Handle Waste Calendar
    if (category.wasteCalendar) {
        openWasteCalendar();
        return;
    }

    // Handle external links
    if (category.externalLink) {
        window.location.href = category.externalLink;
        return;
    }

    currentView = 'category';
    currentCategory = categoryId;
    currentSubcategory = null;
    navigationHistory.push({ type: 'home' });

    document.getElementById('emergencyBanner').classList.add('hidden');
    document.getElementById('weatherWidget').classList.add('hidden');
    document.getElementById('backButton').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('flohmarktContainer').classList.remove('active');
    document.getElementById('mainContent').style.display = 'block';
    updateBreadcrumb([{ text: category.title }]);

    const mainContent = document.getElementById('mainContent');

    if (category.subcategories) {
        // Show subcategories in defined order (already alphabetically sorted)
        const subcategoryList = Object.values(category.subcategories);

        mainContent.innerHTML = `
                    <div class="detail-view fade-in">
                        <h2>${category.icon} ${category.title}</h2>
                        ${categoryId === 'shopping' ? `
                            <div class="info-item">
                                <h4>ℹ️ Über den Werbering</h4>
                                <p>👥 179 Werbering-Mitgliedsbetriebe in Vorchdorf, Laakirchen und Umgebung. 98 weitere Betriebe ebenfalls enthalten.</p>
                                <p>🎁 Werbering-Gutscheine bei allen Mitgliedern einlösbar</p>
                                <p>☎️ 0699 15 05 88 57 • ✉️ tipp@werbering-vorchdorf.at</p>
                                <p><a href="https://www.vorchdorfonline.at" target="_blank">🌐 www.vorchdorfonline.at</a></p>
                            </div>

                            <div onclick="toggleWerberingFilter()" style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 20px; padding: 15px; border-radius: 12px; background: ${showOnlyWerbering ? 'var(--secondary)' : 'white'}; border: 2px solid ${showOnlyWerbering ? 'var(--secondary)' : 'var(--border)'}; box-shadow: var(--shadow-md); transition: all 0.3s;">
                                <span style="font-size: 1.5rem;">🎖️</span>
                                <span style="font-weight: 700; color: ${showOnlyWerbering ? 'white' : 'var(--primary)'}; font-size: 1rem;">Nur Werberingmitglieder anzeigen</span>
                                <div style="margin-left: auto; width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${showOnlyWerbering ? 'white' : 'var(--border)'}; background: ${showOnlyWerbering ? 'white' : 'transparent'}; position: relative;">
                                    ${showOnlyWerbering ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: var(--secondary); border-radius: 50%;"></div>' : ''}
                                </div>
                            </div>
                        ` : ''}
                        <div class="subcategory-list">
                            ${subcategoryList.map(sub => {
            let subCount = 0;
            if (categoryId === 'shopping') {
                if (sub.id === 'all_businesses_az') {
                    subCount = allBusinesses.filter(b => b.werbering === true).length;
                } else {
                    subCount = allBusinesses.filter(b => {
                        const isCategory = b.category === sub.id;
                        const matchesFilter = showOnlyWerbering ? b.werbering === true : true;
                        return isCategory && matchesFilter;
                    }).length;
                }
            } else if (categoryId === 'clubs') {
                subCount = (allClubs[sub.id] || []).length;
            } else {
                subCount = (sub.items || []).length;
            }

            return `
                                    <div class="subcategory-item" onclick="navigateToSubcategory('${categoryId}', '${sub.id}')">
                                        <h4>${sub.title}</h4>
                                        <p>${sub.description || 'Klicken für Details'}</p>
                                        ${subCount > 0 ? `<div class="sub-count">${subCount} Einträge</div>` : ''}
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                `;
    } else if (category.content) {
        // Show direct content
        mainContent.innerHTML = renderContent(category);
    }
}

// Render Business Directory
function renderBusinessDirectory() {
    return `
                <div class="detail-view fade-in">
                    <h2>🛍️ Werbering Vorchdorf - Alle Mitgliedsbetriebe</h2>
                    <div class="info-item">
                        <h4>ℹ️ Über den Werbering</h4>
                        <p>👥 179 Werbering-Mitgliedsbetriebe in Vorchdorf, Laakirchen und Umgebung. 98 weitere Betriebe ebenfalls enthalten.</p>
                        <p>🎁 Werbering-Gutscheine bei allen Mitgliedern einlösbar</p>
                        <p>📍 Vorchdorf, Laakirchen und Umgebung</p>
                        <p>☎️ 0699 15 05 88 57 • ✉️ tipp@werbering-vorchdorf.at</p>
                        <p><a href="https://www.vorchdorfonline.at" target="_blank">🌐 www.vorchdorfonline.at</a></p>
                    </div>
                    <div class="business-grid">
                        ${allBusinesses.map(business => {
        // Hole das Icon aus der entsprechenden Subcategory
        let categoryIcon = '📁';
        for (let catId in categories) {
            const cat = categories[catId];
            if (cat.subcategories && cat.subcategories[business.category]) {
                const sub = cat.subcategories[business.category];
                categoryIcon = sub.icon || sub.title.charAt(0);
                break;
            }
        }
        return `
                            <div class="business-card" ${business.link ? `onclick="window.open('${business.link}', '_blank')" style="cursor: pointer;"` : ''}>
                                <div class="business-name">${business.name}</div>
                                <div class="business-location">${business.location}</div>
                                ${business.link ? `<div class="business-link">🌐 Website →</div>` : ''}
                            </div>
                            `;
    }).join('')}
                    </div>
                </div>
            `;
}

// Navigate to Subcategory
function navigateToSubcategory(categoryId, subcategoryId) {
    const category = categories[categoryId];
    const subcategory = category.subcategories[subcategoryId];
    if (!subcategory) return;

    // Check for direct link - if exists, open directly
    if (subcategory.directLink) {
        window.open(subcategory.directLink, '_blank');
        return;
    }

    // Check for external link - if exists, open in same window
    if (subcategory.externalLink) {
        window.location.href = subcategory.externalLink;
        return;
    }

    currentView = 'subcategory';
    currentSubcategory = subcategoryId;
    navigationHistory.push({ type: 'category', categoryId });

    document.getElementById('backButton').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('weatherWidget').classList.add('hidden');
    updateBreadcrumb([
        { text: category.title, action: `navigateToCategory('${categoryId}')` },
        { text: subcategory.title }
    ]);

    const mainContent = document.getElementById('mainContent');

    // Special handling for taxi quick call page
    if (categoryId === 'mobility' && subcategoryId === 'taxi_quick') {
        mainContent.innerHTML = `
                    <div class="detail-view fade-in">
                        <h2>☎️ ${subcategory.title}</h2>
                        <p style="color: var(--text-light); margin-bottom: 25px;">${subcategory.description}</p>
                        <div class="taxi-quick-grid">
                            <a href="tel:+436991824621" class="taxi-quick-box">
                                <div class="taxi-quick-icon">📞</div>
                                <div class="taxi-quick-text">
                                    <strong>Taxi Wiedl</strong>
                                    <p>0699 18246216</p>
                                </div>
                            </a>
                            <a href="tel:+436643366333" class="taxi-quick-box">
                                <div class="taxi-quick-icon">📞</div>
                                <div class="taxi-quick-text">
                                    <strong>Attwenger Taxi</strong>
                                    <p>0664 3366333</p>
                                </div>
                            </a>
                            <a href="https://www.gollinger.net" target="_blank" class="taxi-quick-box">
                                <div class="taxi-quick-icon">🚌</div>
                                <div class="taxi-quick-text">
                                    <strong>Gollinger</strong>
                                    <p>Website</p>
                                </div>
                            </a>
                            <a href="https://www.mietwagen-aigner.at" target="_blank" class="taxi-quick-box">
                                <div class="taxi-quick-icon">🚕</div>
                                <div class="taxi-quick-text">
                                    <strong>Aigner Taxi</strong>
                                    <p>Website</p>
                                </div>
                            </a>
                        </div>
                    </div>
                `;
    }
    // Special handling for shopping subcategories - show businesses
    else if (categoryId === 'shopping') {
        // Special handling for A-Z directory
        if (subcategoryId === 'all_businesses_az') {
            // Group businesses by category and sort A-Z - NUR WERBERINGMITGLIEDER
            const categoryMap = {};

            // Group by category - nur Werberingmitglieder
            allBusinesses.filter(b => b.werbering === true).forEach(business => {
                if (!categoryMap[business.category]) {
                    categoryMap[business.category] = [];
                }
                categoryMap[business.category].push(business);
            });

            // Sort each category alphabetically by business name
            Object.keys(categoryMap).forEach(cat => {
                categoryMap[cat].sort((a, b) => a.name.localeCompare(b.name, 'de'));
            });

            // Get category titles from categories object and sort them alphabetically by title (without emoji)
            const sortedCategories = Object.keys(categoryMap)
                .map(catId => ({
                    id: catId,
                    title: categories.shopping.subcategories[catId].title,
                    businesses: categoryMap[catId]
                }))
                .sort((a, b) => {
                    // Remove emoji for sorting (emoji is usually at start with space after)
                    const titleA = a.title.replace(/^[^\w]*/, '').trim();
                    const titleB = b.title.replace(/^[^\w]*/, '').trim();
                    return titleA.localeCompare(titleB, 'de');
                });

            mainContent.innerHTML = `
                        <div class="detail-view fade-in">
                            <h2>🎖️ ${subcategory.title}</h2>
                            <p style="color: var(--text-light); margin-bottom: 30px;">${subcategory.description}</p>
                            <div style="max-width: 100%;">
                                ${sortedCategories.map(cat => `
                                    <div style="margin-bottom: 40px;">
                                        <h3 style="font-size: 1.3em; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--accent-color);">
                                            ${cat.title}
                                        </h3>
                                        <div class="business-grid">
                                            ${cat.businesses.map(business => `
                                                <div class="business-card" ${business.link ? `onclick="window.open('${business.link}', '_blank')" style="cursor: pointer;"` : ''}>
                                                    <div class="business-header" style="display: flex; justify-content: space-between; align-items: start;">
                                                        <div class="business-name" style="flex: 1;">${business.name}</div>
                                                        <span style="font-size: 1rem; margin-left: 8px;">🎖️</span>
                                                    </div>
                                                    <div class="business-location">📍 ${business.location}</div>
                                                    ${business.search ? `<div class="business-services" style="font-size: 0.85rem; color: var(--text-light); margin-top: 6px;">🔧 ${business.search}</div>` : ''}
                                                    ${business.link ? `<div class="business-link" style="margin-top: 8px; font-weight: 500;">🌐 Website →</div>` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
        } else {
            const categoryBusinesses = allBusinesses.filter(b =>
                b.category === subcategoryId &&
                (!showOnlyWerbering || b.werbering === true)
            );
            mainContent.innerHTML = `
                        <div class="detail-view fade-in">
                            <h2>${subcategory.title}</h2>
                            <p style="color: var(--text-light); margin-bottom: 20px;">${subcategory.description}</p>
                            <div class="business-grid">
                                ${categoryBusinesses.map(business => `
                                    <div class="business-card" ${business.link ? `onclick="window.open('${business.link}', '_blank')" style="cursor: pointer;"` : ''}>
                                        <div class="business-header" style="display: flex; justify-content: space-between; align-items: start;">
                                            <div class="business-name">${business.name}</div>
                                            ${business.werbering ? `<span style="font-size: 1.2rem;" title="Werberingmitglied">🎖️</span>` : ''}
                                        </div>
                                        <div class="business-location">📍 ${business.location}</div>
                                        ${business.search ? `<div class="business-services" style="font-size: 0.85rem; color: var(--text-light); margin-top: 6px;">🔧 ${business.search}</div>` : ''}
                                        ${business.link ? `<div class="business-link" style="margin-top: 8px; font-weight: 500;">🌐 Website →</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
        }
    } else {
        // Special handling for clubs - show both website and vorchdorfonline link
        if (categoryId === 'clubs') {
            mainContent.innerHTML = `
                        <div class="detail-view fade-in">
                            <h2>${subcategory.title}</h2>
                            <p style="color: var(--text-light); margin-bottom: 20px;">${subcategory.description}</p>
                            <div class="items-grid">
                                ${subcategory.items.map(item => `
                                    <a href="${item.website || item.link}" target="_blank" class="item-card item-card-link">
                                        <div class="item-card-title">${item.title}</div>
                                        <div class="item-card-info">
                                            ${item.info.map(info => `<p>${info}</p>`).join('')}
                                        </div>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `;
        } else {
            // Normal subcategory display for other categories
            mainContent.innerHTML = `
                        <div class="detail-view fade-in">
                            <h2>${category.icon} ${subcategory.title}</h2>
                            <div class="items-grid">
                                ${subcategory.items.map(item => `
                                    <a href="${item.link || '#'}" target="_blank" class="item-card item-card-link">
                                        <div class="item-card-title">${item.title}</div>
                                        <div class="item-card-info">
                                            ${item.info.map(info => `<p>${info}</p>`).join('')}
                                        </div>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `;
        }
    }
}

// Render Content
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
    if (category.content.type === 'list') {
        return `
                    <div class="detail-view fade-in">
                        <h2>${category.icon} ${category.title}</h2>
                        <div class="info-item">
                            <p style="color: var(--text-light); margin-bottom: 20px;">Alle Bildungseinrichtungen in Vorchdorf - Details auf der Gemeinde-Website:</p>
                        </div>
                        <div class="items-grid">
                            ${category.content.items.map(item => `
                                <a href="${item.link || '#'}" target="_blank" class="item-card item-card-link">
                                    <div class="item-card-title">${item.title}</div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
    }

    // Handle section type (like emergency)
    return `
                <div class="detail-view fade-in">
                    <h2>${category.icon} ${category.title}</h2>
                    ${category.content.sections.map(section => `
                        <div>
                            <h3>${section.title}</h3>
                            ${section.items.map(item => `
                                <div class="info-item">
                                    <h4>${item.title}</h4>
                                    ${item.info.map(info => `<p>${info}</p>`).join('')}
                                    ${item.wasteCalendar ? `<p><a href="#" onclick="event.preventDefault(); openWasteCalendar();">→ Müllkalender öffnen</a></p>` : item.link ? `<p><a href="${item.link}" target="_blank">→ Mehr Informationen</a></p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
}

// Go Back
function goBack() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (navigationHistory.length === 0) {
        renderHome();
        return;
    }

    const last = navigationHistory.pop();
    if (last.type === 'home') {
        renderHome();
    } else if (last.type === 'category') {
        navigateToCategory(last.categoryId);
    }
}

// Go back to home
function goHome() {
    navigationHistory = [];
    // Zeige Footer wieder wenn zur Home zurück
    const mainFooter = document.getElementById('mainFooter');
    if (mainFooter) {
        mainFooter.style.display = 'block';
    }
    renderHome();
}

// Open Waste Calendar
function openWasteCalendar() {
    window.location.href = './muellkalender-vorchdorf-final.html';
}

// Update Breadcrumb
function updateBreadcrumb(items) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.classList.remove('hidden');

    let html = '<span class="breadcrumb-item" style="cursor: pointer;" onclick="renderHome()">🏠 Start</span>';

    items.forEach((item, index) => {
        html += '<span class="breadcrumb-separator">›</span>';
        if (item.action) {
            html += `<span class="breadcrumb-item" style="cursor: pointer;" onclick="${item.action}">${item.text}</span>`;
        } else {
            html += `<span class="breadcrumb-item">${item.text}</span>`;
        }
    });

    breadcrumb.innerHTML = html;
}

// Intelligent Search Mappings
const searchMappings = {
    // Kategorie-Synonyme
    'bauen': ['construction', 'Bauen', 'Wohnen', 'Einrichten', 'Bau'],
    'bau': ['construction', 'Bauen', 'Wohnen', 'Einrichten'],
    'wohnen': ['construction', 'Bauen', 'Wohnen', 'Einrichten'],
    'einrichten': ['construction', 'Bauen', 'Wohnen', 'Einrichten'],
    'handwerker': ['construction', 'Bauen', 'Wohnen'],

    'hotel': ['gastro', 'Hotelerie', 'Gastronomie', 'Hotel', 'Pension', 'Bed & Breakfast'],
    'restaurant': ['gastro', 'Gastronomie', 'Restaurant', 'Gasthaus', 'Wirtshaus'],
    'gasthaus': ['gastro', 'Gastronomie', 'Gasthaus', 'Restaurant', 'Wirtshaus'],
    'cafe': ['gastro', 'Café', 'Kaffee', 'Bäckerei'],
    'kaffee': ['gastro', 'Café', 'Kaffee'],

    'frisör': ['beauty', 'Friseur', 'Haar', 'SCHNITT', 'HAARGENAU', 'HAARSTUDIO', 'BARBERSHOP'],
    'friseur': ['beauty', 'Friseur', 'Haar', 'SCHNITT', 'HAARGENAU', 'HAARSTUDIO', 'BARBERSHOP'],
    'haar': ['beauty', 'Haar', 'Friseur', 'SCHNITT', 'HAARGENAU', 'HAARSTUDIO'],
    'barbier': ['beauty', 'BARBERSHOP', 'Friseur', 'Haar'],

    'bäcker': ['food', 'gastro', 'Bäckerei', 'CAFÉ', 'Probst', 'Gwölb', 'Resch'],
    'bäckerei': ['food', 'gastro', 'Bäckerei', 'CAFÉ', 'Probst', 'Gwölb', 'Resch'],
    'brot': ['food', 'Bäckerei', 'CAFÉ'],

    'arzt': ['healthcare', 'Arzt', 'Apotheke', 'Gesundheit', 'Medizin', 'Allgemeinmedizin'],
    'apotheke': ['healthcare', 'Apotheke', 'Medizin', 'Gesundheit'],
    'zahnarzt': ['dentists', 'Zahnarzt', 'Zahnärzte', 'Klinkert', 'Krenmayr', 'Zahn'],
    'zahn': ['dentists', 'Zahnarzt', 'Zahnärzte', 'Klinkert', 'Krenmayr'],
    'kinderarzt': ['specialists', 'Kinderarzt', 'Kinderärzte', 'Kinder- und Fachärzte', 'Pädiatrie'],
    'facharzt': ['specialists', 'Facharzt', 'Fachärzte', 'Kinder- und Fachärzte', 'Spezialist'],
    'gesundheit': ['healthcare', 'Gesundheit', 'Arzt', 'Apotheke'],
    'sozial': ['social', 'Sozial', 'Hilfe', 'Sozialfonds', 'WIR helfen', 'Beratung'],
    'hilfe': ['social', 'Hilfe', 'Sozialfonds', 'WIR helfen', 'Unterstützung'],

    'schule': ['education', 'Schule', 'Volksschule', 'Mittelschule', 'Bildung'],
    'bildung': ['education', 'Bildung', 'Schule', 'Kindergarten', 'Lernen', 'Otelo'],
    'kindergarten': ['education', 'Kindergarten', 'Kinder', 'Bildung'],
    'bibliothek': ['education', 'Bibliothek', 'Bücherei', 'Bildung'],
    'otelo': ['education', 'Otelo', 'Offenes Technologielabor', 'Bildung'],
    'fitness': ['beauty', 'FITNESS', 'Sport', 'Training', 'Gym'],
    'sport': ['beauty', 'FITNESS', 'Sport', 'Training'],

    'auto': ['cars', 'KFZ', 'Auto', 'Werkstatt', 'Autohaus'],
    'kfz': ['cars', 'KFZ', 'Auto', 'Werkstatt'],
    'werkstatt': ['cars', 'KFZ', 'Werkstatt', 'Auto'],
    'fahrrad': ['cars', 'Fahrrad', 'Rad', 'Bike'],

    'bank': ['banks', 'Bank', 'Sparkasse', 'Raiffeisen', 'Geld'],
    'geld': ['banks', 'Bank', 'Sparkasse', 'Versicherung'],
    'versicherung': ['banks', 'Versicherung', 'Bank'],

    'anwalt': ['legal', 'Anwalt', 'Rechtsanwalt', 'Notar', 'Recht'],
    'rechtsanwalt': ['legal', 'Rechtsanwalt', 'Anwalt', 'Recht'],
    'notar': ['legal', 'Notar', 'Notariat'],

    'steuer': ['accounting', 'Steuer', 'Buchhaltung', 'Steuerberater'],
    'buchhaltung': ['accounting', 'Buchhaltung', 'Steuer'],

    'blumen': ['flowers', 'Blumen', 'Florist', 'Gärtnerei'],
    'garten': ['flowers', 'Gärtnerei', 'Garten', 'Blumen'],

    'essen': ['food', 'gastro', 'Lebensmittel', 'Essen', 'Restaurant'],
    'lebensmittel': ['food', 'Lebensmittel', 'Essen', 'Supermarkt', 'SPAR'],
    'supermarkt': ['food', 'SPAR', 'Lebensmittel'],

    'mode': ['fashion', 'Mode', 'Kleidung', 'Schuhe'],
    'kleidung': ['fashion', 'Mode', 'Kleidung', 'Bekleidung'],
    'schuhe': ['fashion', 'Schuhe', 'Mode'],

    'taxi': ['transport', 'Taxi', 'Transport', 'Fahrdienst'],
    'transport': ['transport', 'Transport', 'Taxi', 'Spedition'],

    'schmuck': ['jewelry', 'Schmuck', 'Juwelier', 'Uhren'],
    'uhren': ['jewelry', 'Uhren', 'Schmuck', 'Juwelier'],

    'tankstelle': ['gas', 'Tankstelle', 'Tanken', 'Benzin'],
    'tanken': ['gas', 'Tankstelle'],

    'foto': ['photo', 'Fotografie', 'Foto', 'Fotograf'],
    'fotograf': ['photo', 'Fotografie', 'Fotograf'],

    // Vereine
    'verein': ['clubs', 'Verein', 'Sport', 'Kultur', 'Musik'],
    'vereine': ['clubs', 'Vereine', 'Sport', 'Kultur', 'Musik'],

    // Sportvereine
    'union': ['clubs', 'sport', 'Union', 'Badminton', 'Laufgruppe', 'Schiclub', 'Tennis', 'Vikings', 'Tischtennis'],
    'askö': ['clubs', 'sport', 'ASKÖ', 'Fußball', 'Stocksport'],
    'askoe': ['clubs', 'sport', 'ASKÖ', 'Fußball', 'Stocksport'],
    'fussball': ['clubs', 'sport', 'Fußball', 'ASKÖ'],
    'fußball': ['clubs', 'sport', 'Fußball', 'ASKÖ'],
    'tennis': ['clubs', 'sport', 'Tennis', 'Tennisclub', 'BAM.wohnen'],
    'badminton': ['clubs', 'sport', 'Badminton', 'Union'],
    'tischtennis': ['clubs', 'sport', 'Tischtennis', 'Union'],
    'basketball': ['clubs', 'sport', 'Basketball', 'Vikings', 'Union'],
    'vikings': ['clubs', 'sport', 'Vikings', 'Basketball'],
    'schi': ['clubs', 'sport', 'Schi', 'Schiclub', 'Seyr Dach'],
    'ski': ['clubs', 'sport', 'Schi', 'Schiclub', 'Seyr Dach'],
    'laufen': ['clubs', 'sport', 'Laufen', 'Laufgruppe', 'Union'],
    'stocksport': ['clubs', 'sport', 'Stocksport', 'ASKÖ'],
    'fischen': ['clubs', 'sport', 'Fischen', 'Fischerclub', 'Almtal'],
    'angeln': ['clubs', 'sport', 'Angeln', 'Fischerclub', 'Almtal'],
    'schützen': ['clubs', 'sport', 'Schützen', 'Schützenverein', 'Schießen', 'Theuerwang'],
    'schiessen': ['clubs', 'sport', 'Schießen', 'Schützen'],
    'fitness': ['clubs', 'sport', 'Fitness', 'Body Strength', 'Training'],
    'workout': ['clubs', 'sport', 'Workout', 'Body Strength'],

    // Musikvereine
    'musik': ['clubs', 'musik', 'Musik', 'Marktmusik', 'Musikverein', 'Chor'],
    'blasmusik': ['clubs', 'musik', 'Blasmusik', 'Marktmusik', 'Siebenbürger'],
    'chor': ['clubs', 'musik', 'Chor', 'Sängerbund', 'Gesang', 'Sunshine', 'Trinitatis'],
    'singen': ['clubs', 'musik', 'Singen', 'Chor', 'Sängerbund'],
    'marktmusik': ['clubs', 'musik', 'Marktmusik', 'MMV'],

    // Kulturvereine
    'kultur': ['clubs', 'kultur', 'Kultur', 'Theater', 'Heimatverein', 'Museum'],
    'theater': ['clubs', 'kultur', 'Theater', 'Theatergruppe'],
    'museum': ['clubs', 'kultur', 'Museum', 'Heimatverein'],
    'heimatverein': ['clubs', 'kultur', 'Heimatverein', 'Museum'],
    'fasching': ['clubs', 'kultur', 'Fasching', 'Vori Dori', 'Faschingsgilde'],
    'foto': ['clubs', 'kultur', 'Foto', 'Fotoklub', 'Naturfreunde'],
    'fotografie': ['clubs', 'kultur', 'Fotografie', 'Fotoklub'],
    'kitzmantelfabrik': ['clubs', 'kultur', 'Kitzmantelfabrik', 'Kulturvilla'],

    // Sport & Fitness (neue Kategorie)
    'fitnessstudio': ['sport_fitness', 'fitness', 'Fitnessstudio', 'Training', 'Gym'],
    'gym': ['sport_fitness', 'fitness', 'Fitnessstudio', 'Training'],
    'anytime': ['sport_fitness', 'fitness', 'ANYTIME FITNESS', 'Fitnessstudio'],
    'training': ['sport_fitness', 'fitness', 'Training', 'Fitnessstudio'],
    'spielplatz': ['leisure', 'playgrounds', 'Spielplatz', 'Kinder', 'Spielgeräte', 'Kindertraum'],
    'spielplätze': ['leisure', 'playgrounds', 'Spielplatz', 'Kinder', 'Spielgeräte'],
    'kinder': ['leisure', 'playgrounds', 'Kinder', 'Spielplatz', 'Kinderfreundlich'],
    'schulstraße': ['leisure', 'playgrounds', 'Schulstraße', 'Spielplatz'],
    'krumphuberweg': ['leisure', 'playgrounds', 'Krumphuberweg', 'Spielplatz'],
    'kirchham': ['leisure', 'playgrounds', 'Kirchham', 'Spielplatz'],

    // Notfall & Sicherheit
    'polizei': ['emergency', 'Polizei', 'Sicherheit', 'Notfall', 'Vorchdorf'],
    'rettung': ['emergency', 'Rettung', 'Notfall', 'Rettungsdienst', 'Ambulanz'],
    'feuerwehr': ['emergency', 'Feuerwehr', 'Notfall', 'Brand', 'Hilfe'],
    'notruf': ['emergency', 'Notruf', 'Notfall', '144', '133', '122'],
    'notfall': ['emergency', 'Notfall', 'Notfallkontakte', 'Standorte', 'Rettung'],
    'defibrillator': ['emergency', 'Defibrillator', 'AED', 'Pfarrhof', 'Rettung'],
    'aed': ['emergency', 'AED', 'Defibrillator'],
    'notfallstandorte': ['emergency', 'Notfall', 'Standorte', 'Polizei', 'Feuerwehr'],

    // Sozial & Jugend
    'jugend': ['clubs', 'soziales', 'Jugend', 'Jugendzentrum', 'Pfadfinder', 'Landjugend'],
    'juz': ['clubs', 'soziales', 'JUZ', 'Jugendzentrum'],
    'pfadfinder': ['clubs', 'soziales', 'Pfadfinder', 'Jugend'],
    'landjugend': ['clubs', 'soziales', 'Landjugend', 'Jugend'],
    'otelo': ['clubs', 'soziales', 'OTELO', 'Technologielabor', 'Offenes Labor'],
    'eltern': ['clubs', 'soziales', 'Eltern', 'Elternverein', 'Schule'],

    // Rettungsorganisationen
    'wasserrettung': ['clubs', 'sport', 'Wasserrettung', 'ÖWR', 'Rettung'],
    'öwr': ['clubs', 'sport', 'ÖWR', 'Wasserrettung'],
    'rotes kreuz': ['clubs', 'soziales', 'Rotes Kreuz', 'Rettung'],
    'roteskreuz': ['clubs', 'soziales', 'Rotes Kreuz', 'Rettung'],
    'rettung': ['clubs', 'Rettung', 'Wasserrettung', 'Rotes Kreuz'],

    // Religion
    'kirche': ['clubs', 'religion', 'Kirche', 'Katholisch', 'Evangelisch'],
    'katholisch': ['clubs', 'religion', 'Katholisch', 'Pfarre', 'Jungschar', 'Jugend'],
    'evangelisch': ['clubs', 'religion', 'Evangelisch', 'Kirche'],
    'jungschar': ['clubs', 'religion', 'Jungschar', 'Katholisch', 'Kinder'],

    // Sonstige
    'bibliothek': ['clubs', 'sonstiges', 'Bibliothek', 'Bücherei'],
    'werbering': ['clubs', 'sonstiges', 'Werbering', 'Wirtschaft'],
    'naturfreunde': ['clubs', 'sport', 'kultur', 'Naturfreunde', 'Fotoklub', 'Wandern'],
    'weltladen': ['clubs', 'soziales', 'Weltladen', 'Fair Trade']
};

// Normalisiere deutsche Umlaute und Sonderzeichen für besseres Matching
function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .trim();
}

// Intelligente Synonym-Suche mit Fuzzy Matching
function getSearchSynonyms(term) {
    const normalized = normalizeString(term);
    const synonymMap = {
        // Friseur/Friseuse Variationen
        'frisoe': ['friseur', 'friseurin', 'friseuse', 'haarschnitt', 'frisur', 'barber', 'barbershop', 'haargenau', 'haarstudio', 'schnitt'],
        'friseur': ['friseuse', 'friseurin', 'haarschnitt', 'barber', 'barbershop', 'haarschneid', 'haargenau', 'haarstudio', 'schnitt'],

        // Tabak/Zigaretten Variationen
        'zigaretten': ['tabak', 'trafik', 'rauchen', 'rauchwaren', 'smoker'],
        'tabak': ['zigaretten', 'trafik', 'rauchen', 'rauchwaren'],
        'trafik': ['tabak', 'zigaretten', 'rauchen', 'rauchwaren'],
        'rauchen': ['tabak', 'trafik', 'zigaretten', 'rauchwaren'],
        'rauchwaren': ['tabak', 'trafik', 'zigaretten', 'rauchen'],

        // Handwerker Variationen
        'handwerker': ['installateur', 'elektro', 'klempner', 'maler'],
        'installateur': ['installation', 'gas', 'heizung', 'sanitaer'],
        'klempner': ['installateur', 'sanitaer', 'heizung'],
        'wasser': ['installateur', 'klempner', 'rohre', 'sanitaer', 'heizung', 'installation'],
        'rohre': ['rohrverlegung', 'rohrleitungen', 'installation', 'klempner', 'sanitaer'],
        'maler': ['anstreicher', 'malermeister', 'malerarbeiten'],
        'anstreicher': ['maler', 'malermeister', 'malerarbeiten', 'anstrich'],

        // Arzt Variationen
        'arzt': ['doktor', 'zahnarzt', 'zahndoktor', 'facharzt', 'allgemeinarzt'],
        'zahnarzt': ['zahndoktor', 'dental', 'zahn', 'zaehnchen'],
        'zahndoktor': ['zahnarzt', 'dental', 'zahn'],

        // Auto Variationen
        'auto': ['auto', 'kfz', 'fahrzeug', 'wagen', 'pkw', 'automobile', 'autohaus', 'werkstatt'],
        'werkstatt': ['auto', 'kfz', 'service', 'reparatur'],
        'tankstelle': ['benzin', 'diesel', 'zapfsaeule', 'tanken'],

        // Restaurant/Gastro Variationen
        'restaurant': ['gaststaette', 'gasthof'],
        'gaststaette': ['gasthof', 'restaurant'],
        'pizzeria': ['pizza', 'italiener'],
        'cafe': ['kaffee', 'kaffe', 'baecker', 'baeckerei', 'bakery'],
        'baecker': ['baeckerei', 'cafe', 'kaffee', 'broetchen'],

        // Apotheke
        'apotheke': ['pharmazie', 'pharmazeut', 'medikament', 'arznei'],

        // Bank Variationen
        'bank': ['sparkasse', 'kasse', 'geldautomat', 'geldwechsel'],
        'sparkasse': ['bank', 'geldautomat', 'kasse'],

        // Fitness/Sport
        'fitness': ['gym', 'fitnessstudio', 'training', 'krafttraining', 'sport'],
        'gym': ['fitness', 'fitnessstudio', 'training'],

        // Frisur/Haarpflege
        'haarschnitt': ['friseur', 'friseurin', 'friseuse', 'schneid'],
        'haarschneid': ['friseur', 'friseuse', 'haarschnitt'],

        // Kleidung/Mode
        'mode': ['kleidung', 'kleidungsgschaft', 'boutique', 'fashion'],
        'kleidung': ['mode', 'boutique', 'fashion', 'garderobe'],

        // Spielzeug/Kinderartikel
        'spielzeug': ['spielwaren', 'kinderspielzeug', 'babyartikel'],
        'spielwaren': ['spielzeug', 'kinderspielzeug'],

        // Moebel
        'moebel': ['einrichtung', 'einrichtungshaus', 'mobilistaer', 'moebelladen'],
        'einrichtung': ['moebel', 'einrichtungshaus', 'mobilistaer'],

        // Blumen/Florist
        'blumen': ['florist', 'blumenladen', 'bluemchen', 'straus'],
        'florist': ['blumen', 'blumenladen', 'straus'],

        // Buecher/Buchhandlung
        'buecher': ['buchhandlung', 'buchhandel', 'buch', 'buecher', 'lesen'],
        'buchhandlung': ['buecher', 'buchhandel', 'buch'],

        // Elektro
        'elektro': ['elektrotechnik', 'elektrogeraete', 'strom'],
        'elektrotechnik': ['elektro', 'elektrogeraete'],

        // Schluessel/Schlosser
        'schluessel': ['schlosser', 'schloss', 'schluesseldienst'],
        'schlosser': ['schluessel', 'schloss', 'schluesseldienst'],

        // Photographie/Fotograf
        'foto': ['fotograf', 'fotografie', 'fotostudio', 'bilder'],
        'fotograf': ['foto', 'fotografie', 'fotostudio'],
        'fotografie': ['fotograf', 'foto', 'fotostudio'],

        // Versicherung
        'versicherung': ['versicherer', 'versicherungsagent', 'versicherungsmakler'],
        'versicherungsmakler': ['versicherung', 'versicherer'],

        // Rechtsanwalt
        'anwalt': ['rechtsanwalt', 'anwaeltin', 'jura', 'legal'],
        'rechtsanwalt': ['anwalt', 'anwaeltin', 'jura', 'legal'],

        // Zahnarzt Alternative
        'zaehne': ['zahnarzt', 'zahndoktor', 'dental', 'zahn'],
        'zahn': ['zahnarzt', 'zahndoktor', 'zaehne', 'dental'],

        // Verein/Club
        'verein': ['club'],
        'club': ['verein'],

        // Schule
        'schule': ['schulen', 'gymnasium', 'gymnasium', 'volksschule', 'unterstufe', 'oberstufe'],
        'kindergarten': ['vorschule', 'kinderbetreuung', 'vorschulisch'],

        // Kirche/Religion
        'kirche': ['religion', 'kirchen', 'evangelisch', 'katholisch'],
        'religion': ['kirche'],
        'pfarr': ['pfarre', 'pfarrkirche', 'pfarrer'],
    };

    // Sammle ALLE möglichen Matches
    const allSynonyms = new Set(); // NICHT mit term starten - nur echte Matches

    // Suche in der Map nach Matches
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
        // NUR wenn der Suchbegriff mit dem Key ANFÄNGT oder der Key ANFÄNGT mit dem Suchbegriff
        // (nicht bidirektional bei Synonymen, nur bei Keys)
        if (key.startsWith(normalized) || normalized.startsWith(key)) {
            // Füge den Key und all seine Synonyme hinzu
            allSynonyms.add(key);
            synonyms.forEach(syn => allSynonyms.add(syn));
        }
        // ODER wenn ein Synonym mit dem Suchbegriff ANFÄNGT
        else if (synonyms.some(syn => syn.startsWith(normalized))) {
            // Füge den Key und all seine Synonyme hinzu
            allSynonyms.add(key);
            synonyms.forEach(syn => allSynonyms.add(syn));
        }
    });

    // IMMER den Original-Suchbegriff hinzufügen (für direkte Firmennamen-Matches)
    allSynonyms.add(term);

    return Array.from(allSynonyms);
}

// Intelligente Such-Funktion mit Fuzzy Matching
function performSmartSearch(text, searchVariations, normalizedSearchTerm) {
    // text = zu durchsuchender Text
    // searchVariations = Array von Such-Begriffen mit Synonymen
    // normalizedSearchTerm = normalisierte Version (Umlaute ersetzt)

    const textLower = text.toLowerCase();
    const textNormalized = normalizeString(text);

    // Überprüfe alle Variationen
    return searchVariations.some(variant => {
        const normalizedVariant = normalizeString(variant);
        return textLower.includes(variant) || textNormalized.includes(normalizedVariant);
    });
}

// Live Search Function with Intelligence
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    if (searchTerm.length === 0) {
        renderHome();
        return;
    }

    const results = [];

    // Hole alle Synonyme und Variationen
    const searchVariations = getSearchSynonyms(searchTerm);
    const normalizedSearchTerm = normalizeString(searchTerm);

    // VOLLTEXTSUCHE - Durchsuche ALLES mit Smart-Search!

    // 1. Suche in KATEGORIEN (höchste Priorität)
    Object.values(categories).forEach(category => {
        const categoryText = `${category.title} ${category.description} ${category.id}`;

        if (performSmartSearch(categoryText, searchVariations, normalizedSearchTerm)) {
            results.push({
                type: 'category',
                priority: 1,
                category: category,
                matchText: category.title
            });
        }
    });

    // 2. Suche in UNTERKATEGORIEN (Vereine, Werbering-Kategorien, etc.)
    Object.values(categories).forEach(category => {
        if (category.subcategories) {
            Object.values(category.subcategories).forEach(sub => {
                const subText = `${sub.title} ${sub.description || ''} ${sub.id}`;

                if (performSmartSearch(subText, searchVariations, normalizedSearchTerm)) {
                    results.push({
                        type: 'subcategory',
                        priority: 2,
                        category: category,
                        subcategory: sub,
                        matchText: sub.title
                    });
                }

                // Suche auch in den ITEMS der Unterkategorie (z.B. einzelne Vereine)
                if (sub.items) {
                    sub.items.forEach(item => {
                        // Durchsuche ALLES: Titel, Info, Link, Website
                        const itemText = [
                            item.title || '',
                            ...(item.info || []),
                            item.link || '',
                            item.website || '',
                            item.email || '',
                            item.adresse || ''
                        ].join(' ');

                        if (performSmartSearch(itemText, searchVariations, normalizedSearchTerm)) {
                            results.push({
                                type: 'item',
                                priority: 3,
                                category: category,
                                subcategory: sub,
                                item: item,
                                matchText: item.title
                            });
                        }
                    });
                }
            });
        }

        // Suche auch in CONTENT (z.B. Bildung, Notfälle)
        if (category.content) {
            if (category.content.type === 'list') {
                category.content.items.forEach(item => {
                    const itemText = `${item.title} ${item.link || ''}`;
                    if (performSmartSearch(itemText, searchVariations, normalizedSearchTerm)) {
                        results.push({
                            type: 'content-item',
                            priority: 3,
                            category: category,
                            item: item,
                            matchText: item.title
                        });
                    }
                });
            } else if (category.content.sections) {
                category.content.sections.forEach(section => {
                    section.items.forEach(item => {
                        const itemText = [
                            item.title || '',
                            ...(item.info || []),
                            item.link || ''
                        ].join(' ');

                        if (performSmartSearch(itemText, searchVariations, normalizedSearchTerm)) {
                            results.push({
                                type: 'content-item',
                                priority: 3,
                                category: category,
                                item: item,
                                matchText: item.title
                            });
                        }
                    });
                });
            }
        }
    });

    // 3. Suche in BUSINESSES (Werbering) - mit verbesserter Priorisierung
    allBusinesses.forEach(business => {
        const name = business.name || '';
        const search = business.search || '';
        const location = business.location || '';
        const cat = business.category || '';

        const coreText = `${name} ${search} ${cat}`.toLowerCase();
        const coreTextNormalized = normalizeString(coreText);
        const fullText = `${coreText} ${location}`.toLowerCase();
        const fullTextNormalized = normalizeString(fullText);

        let priority = 4;
        let match = false;

        // Check variations
        for (const variant of searchVariations) {
            const normalizedVariant = normalizeString(variant);

            // Höchste Priorität: Wort-Treffer im Namen oder Suchbegriffen
            const wordRegex = new RegExp('\\b' + variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
            const normalizedWordRegex = new RegExp('\\b' + normalizedVariant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');

            if (wordRegex.test(name) || normalizedWordRegex.test(normalizeString(name))) {
                priority = 4; // Eigentlich 4.0, aber innerhalb der Businesses
                match = true;
                break;
            }

            if (wordRegex.test(search) || normalizedWordRegex.test(normalizeString(search))) {
                priority = 4.1;
                match = true;
                break;
            }

            // Mittlere Priorität: Teil-Treffer im Namen oder Suchbegriffen
            if (coreText.includes(variant) || coreTextNormalized.includes(normalizedVariant)) {
                priority = 4.2;
                match = true;
                break;
            }

            // Niedrige Priorität: Treffer irgendwo (z.B. Adresse)
            if (fullText.includes(variant) || fullTextNormalized.includes(normalizedVariant)) {
                priority = 4.5;
                match = true;
                break;
            }
        }

        if (match) {
            results.push({
                type: 'business',
                priority: priority,
                business: business,
                matchText: business.name
            });
        }
    });

    // 4. Suche in FORMULAREN (Gemeinde-Verwaltung)
    allFormulare.forEach(formular => {
        const text = (formular.title || '').toLowerCase();
        const normalizedText = normalizeString(text);

        for (const variant of searchVariations) {
            const normalizedVariant = normalizeString(variant);
            if (text.includes(variant) || normalizedText.includes(normalizedVariant)) {
                results.push({
                    type: 'formular',
                    priority: 5,
                    formular: formular,
                    matchText: formular.title
                });
                break;
            }
        }
    });

    // 5. Suche in MITARBEITERN (Gemeinde-Verwaltung)
    allMitarbeiter.forEach(person => {
        const text = `${person.name || ''} ${person.email || ''}`.toLowerCase();
        const normalizedText = normalizeString(text);

        for (const variant of searchVariations) {
            const normalizedVariant = normalizeString(variant);
            if (text.includes(variant) || normalizedText.includes(normalizedVariant)) {
                results.push({
                    type: 'mitarbeiter',
                    priority: 5.1,
                    person: person,
                    matchText: person.name
                });
                break;
            }
        }
    });

    // 6. Suche in ABTEILUNGEN (Gemeinde-Verwaltung)
    allAbteilungen.forEach(abteilung => {
        const abtText = `${abteilung.name || ''}`.toLowerCase();
        const normalizedAbtText = normalizeString(abtText);
        let abtMatch = false;

        for (const variant of searchVariations) {
            const normalizedVariant = normalizeString(variant);
            if (abtText.includes(variant) || normalizedAbtText.includes(normalizedVariant)) {
                abtMatch = true;
                results.push({
                    type: 'abteilung',
                    priority: 5.2,
                    abteilung: abteilung,
                    matchText: abteilung.name
                });
                break;
            }
        }

        // Auch in Mitarbeitern der Abteilung suchen
        if (!abtMatch && abteilung.mitarbeiter) {
            abteilung.mitarbeiter.forEach(person => {
                const personText = `${person.name || ''} ${person.funktion || ''} ${person.email || ''}`.toLowerCase();
                const normalizedPersonText = normalizeString(personText);

                for (const variant of searchVariations) {
                    const normalizedVariant = normalizeString(variant);
                    if (personText.includes(variant) || normalizedPersonText.includes(normalizedVariant)) {
                        results.push({
                            type: 'abteilung-person',
                            priority: 5.3,
                            abteilung: abteilung,
                            person: person,
                            matchText: person.name
                        });
                        break;
                    }
                }
            });
        }
    });

    // 7. Suche in GEMEINDEBETRIEBEN
    allGemeindebetriebe.forEach(betrieb => {
        const betText = `${betrieb.name || ''} ${betrieb.beschreibung || ''}`.toLowerCase();
        const normalizedBetText = normalizeString(betText);
        let betMatch = false;

        for (const variant of searchVariations) {
            const normalizedVariant = normalizeString(variant);
            if (betText.includes(variant) || normalizedBetText.includes(normalizedVariant)) {
                betMatch = true;
                results.push({
                    type: 'gemeindebetrieb',
                    priority: 5.4,
                    betrieb: betrieb,
                    matchText: betrieb.name
                });
                break;
            }
        }

        // Auch in Mitarbeitern des Betriebs suchen
        if (!betMatch && betrieb.mitarbeiter) {
            betrieb.mitarbeiter.forEach(person => {
                const personText = `${person.name || ''} ${person.funktion || ''} ${person.email || ''}`.toLowerCase();
                const normalizedPersonText = normalizeString(personText);

                for (const variant of searchVariations) {
                    const normalizedVariant = normalizeString(variant);
                    if (personText.includes(variant) || normalizedPersonText.includes(normalizedVariant)) {
                        results.push({
                            type: 'gemeindebetrieb-person',
                            priority: 5.5,
                            betrieb: betrieb,
                            person: person,
                            matchText: person.name
                        });
                        break;
                    }
                }
            });
        }
    });

    // Sortiere nach Priorität (Kategorien zuerst, dann Unterkategorien, dann Items, dann Businesses)
    results.sort((a, b) => a.priority - b.priority);

    // Entferne Duplikate
    const uniqueResults = [];
    const seen = new Set();

    results.forEach(result => {
        let key;
        if (result.type === 'business') {
            key = `business-${result.business.name}`;
        } else if (result.type === 'category') {
            key = `category-${result.category.id}`;
        } else if (result.type === 'subcategory') {
            key = `subcategory-${result.category.id}-${result.subcategory.id}`;
        } else if (result.type === 'item') {
            key = `item-${result.category.id}-${result.subcategory.id}-${result.item.title}`;
        } else if (result.type === 'content-item') {
            key = `content-${result.category.id}-${result.item.title}`;
        } else if (result.type === 'formular') {
            key = `formular-${result.formular.title}`;
        } else if (result.type === 'mitarbeiter') {
            key = `mitarbeiter-${result.person.name}`;
        } else if (result.type === 'abteilung') {
            key = `abteilung-${result.abteilung.name}`;
        } else if (result.type === 'abteilung-person') {
            key = `abteilung-person-${result.abteilung.name}-${result.person.name}`;
        } else if (result.type === 'gemeindebetrieb') {
            key = `gemeindebetrieb-${result.betrieb.name}`;
        } else if (result.type === 'gemeindebetrieb-person') {
            key = `gemeindebetrieb-person-${result.betrieb.name}-${result.person.name}`;
        }

        if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(result);
        }
    });

    // Reset navigation history
    navigationHistory = [];

    // Display results
    displaySearchResults(searchTerm, uniqueResults);
}

function displaySearchResults(searchTerm, results) {
    const content = document.getElementById('mainContent');
    document.getElementById('backButton').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('emergencyBanner').classList.add('hidden');
    document.getElementById('weatherWidget').classList.add('hidden');
    updateBreadcrumb([{ text: `Suchergebnisse für "${searchTerm}"` }]);

    if (results.length === 0) {
        content.innerHTML = `
                    <div class="info-section fade-in">
                        <h2>Keine Ergebnisse gefunden</h2>
                        <p>Für "${searchTerm}" wurden keine Ergebnisse gefunden.</p>
                    </div>
                `;
        return;
    }

    let html = `
                <div class="info-section fade-in">
                    <h2>Suchergebnisse: ${results.length} ${results.length === 1 ? 'Treffer' : 'Treffer'}</h2>
                </div>
                <div class="businesses-grid">
            `;

    results.forEach(result => {
        if (result.type === 'category') {
            // Hauptkategorie
            html += `
                        <div class="business-card" onclick="navigateToCategory('${result.category.id}')" style="cursor: pointer;">
                            <div class="business-name">${result.category.icon} ${result.category.title}</div>
                            <div class="business-location">${result.category.description}</div>
                        </div>
                    `;
        } else if (result.type === 'subcategory') {
            // Unterkategorie (z.B. Sport, Kultur bei Vereinen)
            html += `
                        <div class="business-card" onclick="navigateToSubcategory('${result.category.id}', '${result.subcategory.id}')" style="cursor: pointer;">
                            <div class="business-name">${result.subcategory.title}</div>
                            <div class="business-location">📂 ${result.category.title} → ${result.subcategory.description || ''}</div>
                        </div>
                    `;
        } else if (result.type === 'item') {
            // Einzelne Items in Unterkategorien (z.B. einzelne Vereine)
            const item = result.item;
            html += `
                        <div class="business-card" onclick="navigateToSubcategory('${result.category.id}', '${result.subcategory.id}')" style="cursor: pointer;">
                            <div class="business-name">${item.title}</div>
                            <div class="business-location">📂 ${result.category.title} → ${result.subcategory.title}</div>
                            ${item.info && item.info[0] ? `<p style="font-size: 0.9em; color: var(--text-light); margin-top: 5px;">${item.info[0]}</p>` : ''}
                        </div>
                    `;
        } else if (result.type === 'content-item') {
            // Content items (z.B. Bildungseinrichtungen)
            html += `
                        <div class="business-card" onclick="navigateToCategory('${result.category.id}')" style="cursor: pointer;">
                            <div class="business-name">${result.item.title}</div>
                            <div class="business-location">📂 ${result.category.title}</div>
                        </div>
                    `;
        } else if (result.type === 'business') {
            // Werbering-Betriebe
            const b = result.business;
            html += `
                        <div class="business-card">
                            <div class="business-name">${b.name}</div>
                            <div class="business-location">📍 ${b.location}</div>
                            ${b.link ? `<a href="${b.link}" class="business-link" target="_blank">🌐 Website besuchen</a>` : ''}
                        </div>
                    `;
        } else if (result.type === 'formular') {
            // Formulare
            const f = result.formular;
            html += `
                        <div class="business-card">
                            <div class="business-name">📄 ${f.title}</div>
                            <div class="business-location">🏛️ Gemeinde & Verwaltung → Formulare</div>
                            <a href="${f.url}" class="business-link" target="_blank">→ Formular öffnen</a>
                        </div>
                    `;
        } else if (result.type === 'mitarbeiter') {
            // Mitarbeiter
            const p = result.person;
            html += `
                        <div class="business-card" onclick="window.open('./gemeinde-verwaltung/mitarbeiter.html', '_self')" style="cursor: pointer;">
                            <div class="business-name">👤 ${p.name}</div>
                            <div class="business-location">🏛️ Gemeindemitarbeiter</div>
                            ${p.telefon ? `<p style="font-size: 0.9em; color: var(--text-light); margin-top: 5px;">☎️ ${p.telefon}</p>` : ''}
                            ${p.email ? `<p style="font-size: 0.9em; color: var(--text-light);">📧 ${p.email}</p>` : ''}
                        </div>
                    `;
        } else if (result.type === 'abteilung') {
            // Abteilungen
            const a = result.abteilung;
            html += `
                        <div class="business-card" onclick="window.open('./gemeinde-verwaltung/abteilungen.html', '_self')" style="cursor: pointer;">
                            <div class="business-name">🏛️ ${a.name}</div>
                            <div class="business-location">Gemeindeamt Vorchdorf</div>
                            ${a.url ? `<a href="${a.url}" class="business-link" target="_blank" onclick="event.stopPropagation()">→ Mehr Infos</a>` : ''}
                        </div>
                    `;
        } else if (result.type === 'abteilung-person') {
            // Person in Abteilung
            const p = result.person;
            const a = result.abteilung;
            html += `
                        <div class="business-card" onclick="window.open('./gemeinde-verwaltung/abteilungen.html', '_self')" style="cursor: pointer;">
                            <div class="business-name">👤 ${p.name}</div>
                            <div class="business-location">🏛️ ${a.name}</div>
                            ${p.funktion ? `<p style="font-size: 0.9em; color: var(--text-light); margin-top: 5px;">${p.funktion}</p>` : ''}
                            ${p.telefon ? `<p style="font-size: 0.9em; color: var(--text-light);">☎️ ${p.telefon}</p>` : ''}
                        </div>
                    `;
        } else if (result.type === 'gemeindebetrieb') {
            // Gemeindebetriebe
            const b = result.betrieb;
            html += `
                        <div class="business-card" onclick="window.open('./gemeinde-verwaltung/gemeindebetriebe.html', '_self')" style="cursor: pointer;">
                            <div class="business-name">🏗️ ${b.name}</div>
                            <div class="business-location">🏛️ Gemeinde & Verwaltung → Gemeindebetriebe</div>
                            ${b.url ? `<a href="${b.url}" class="business-link" target="_blank" onclick="event.stopPropagation()">→ Mehr Infos</a>` : ''}
                        </div>
                    `;
        } else if (result.type === 'gemeindebetrieb-person') {
            // Person in Gemeindebetrieb
            const p = result.person;
            const b = result.betrieb;
            html += `
                        <div class="business-card" onclick="window.open('./gemeinde-verwaltung/gemeindebetriebe.html', '_self')" style="cursor: pointer;">
                            <div class="business-name">👤 ${p.name}</div>
                            <div class="business-location">🏗️ ${b.name}</div>
                            ${p.funktion ? `<p style="font-size: 0.9em; color: var(--text-light); margin-top: 5px;">${p.funktion}</p>` : ''}
                            ${p.telefon ? `<p style="font-size: 0.9em; color: var(--text-light);">☎️ ${p.telefon}</p>` : ''}
                        </div>
                    `;
        }
    });

    html += '</div>';
    content.innerHTML = html;
}

// Enter key for search
document.addEventListener('DOMContentLoaded', async function () {
    await loadBusinesses();  // Lade businesses aus JSON
    await loadClubs();       // Lade vereine aus JSON
    await loadGemeindeData(); // Lade Gemeinde-Verwaltung Daten

    // Scroll-Check für Floating Back Button
    window.addEventListener('scroll', function () {
        const floatBtn = document.getElementById('floatingBackButton');
        const isBackVisible = !document.getElementById('backButton').classList.contains('hidden');

        if (isBackVisible && window.scrollY > 300) {
            floatBtn.classList.add('visible');
        } else {
            floatBtn.classList.remove('visible');
        }
    });

    // Browser History Handler für Android Zurück-Taste
    // Füge initial State hinzu
    if (!window.history.state) {
        window.history.replaceState({ page: 'home' }, '', '');
    }

    // Handle Browser Back Button (Android Zurück-Taste)
    window.addEventListener('popstate', function (event) {
        // Wenn wir auf der Home-Seite sind, lassen wir den Browser die Navigation durchführen
        if (currentView === 'home') {
            // Lasse den Browser navigieren (aus der App raus)
            return;
        }

        // Ansonsten navigieren wir intern zurück
        event.preventDefault();
        goBack();

        // Stelle sicher, dass es immer einen History-Eintrag gibt
        if (currentView !== 'home') {
            window.history.pushState({ page: currentView }, '', '');
        }
    });

    // Bei Navigation neuen History-Eintrag erstellen
    const originalNavigateToCategory = window.navigateToCategory;
    window.navigateToCategory = function (categoryId) {
        originalNavigateToCategory(categoryId);
        window.history.pushState({ page: 'category', categoryId: categoryId }, '', '');
    };

    const originalNavigateToSubcategory = window.navigateToSubcategory;
    window.navigateToSubcategory = function (categoryId, subcategoryId) {
        originalNavigateToSubcategory(categoryId, subcategoryId);
        window.history.pushState({ page: 'subcategory', categoryId: categoryId, subcategoryId: subcategoryId }, '', '');
    };


    // Display version in footer
    document.getElementById('versionInfo').textContent = ' | Version ' + APP_VERSION;
    document.getElementById('flohmarktVersionInfo').textContent = ' | Version ' + APP_VERSION;

    // Live search - triggers as you type
    document.getElementById('searchInput').addEventListener('input', function (e) {
        performSearch();
    });

    // Also support Enter key
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // PWA Installation
    let deferredPrompt;
    const installButton = document.getElementById('installButton');

    // Service Worker Registration - DISABLED due to caching issues
    // if ('serviceWorker' in navigator) {
    //     navigator.serviceWorker.register('./service-worker.js')
    //         .then(registration => {
    //             console.log('✅ Service Worker registered:', registration);
    //         })
    //         .catch(error => {
    //             console.log('❌ Service Worker registration failed:', error);
    //         });
    // }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show install button
        installButton.classList.remove('hidden');
    });

    // Handle install button click
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
            return;
        }
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // Clear the deferredPrompt
        deferredPrompt = null;
        // Hide install button
        installButton.classList.add('hidden');
    });

    // Handle app installed event
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA installed successfully!');
        installButton.classList.add('hidden');
        deferredPrompt = null;
    });

    init();
});
