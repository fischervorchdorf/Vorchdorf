# 📱 Vorchdorf App - PWA Setup

## ✅ Was wurde erstellt?

### 1. **Progressive Web App (PWA)**
Deine Vorchdorf-App ist jetzt eine vollwertige PWA! Nutzer können sie wie eine native App auf ihr Smartphone installieren.

### 2. **Dateien im Paket:**
- `index.html` - Hauptdatei der App (mit PWA-Features)
- `manifest.json` - App-Konfiguration (Name, Icons, Farben)
- `service-worker.js` - Offline-Funktionalität
- `icon-192.png` - App-Icon für Android (192x192px)
- `icon-512.png` - App-Icon für Android (512x512px)

---

## 🚀 Deployment

### **Option 1: GitHub Pages (EMPFOHLEN)**

1. **Erstelle ein GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial PWA setup"
   git remote add origin https://github.com/DEIN-USERNAME/vorchdorf-app.git
   git push -u origin main
   ```

2. **Aktiviere GitHub Pages:**
   - Repository → Settings → Pages
   - Source: "Deploy from branch"
   - Branch: `main` → Ordner: `/root`
   - Speichern

3. **Deine App ist live unter:**
   ```
   https://DEIN-USERNAME.github.io/vorchdorf-app/
   ```

### **Option 2: Eigene Domain**

Wenn du eine Domain hast (z.B. `vorchdorf.app`):
- Lade alle Dateien auf deinen Webserver hoch
- Stelle sicher, dass HTTPS aktiviert ist (PWA benötigt HTTPS!)
- Die App ist dann unter `https://vorchdorf.app` erreichbar

---

## 📲 Installation für Nutzer

### **Android (Chrome/Edge):**
1. Website öffnen
2. Button "📱 Als App installieren" erscheint automatisch
3. Auf Button klicken → "Installieren" bestätigen
4. App-Icon erscheint auf dem Homescreen
5. App funktioniert offline!

### **iPhone (Safari):**
1. Website öffnen
2. Teilen-Button (⬆️) → "Zum Home-Bildschirm"
3. Name bestätigen → "Hinzufügen"
4. App-Icon erscheint auf dem Homescreen

### **Desktop (Chrome/Edge):**
1. Website öffnen
2. Adressleiste: Icon "💾 Installieren" oder Drei-Punkte-Menü
3. "Vorchdorf Guide installieren"
4. App öffnet sich in eigenem Fenster

---

## 🎨 Icon-Anpassung (WICHTIG!)

Die aktuellen Icons sind **Platzhalter** mit einem großen "V".

### **So erstellst du bessere Icons:**

1. **Design erstellen:**
   - Größe: 512x512px
   - Format: PNG mit transparentem Hintergrund
   - Design: Vorchdorf-Logo, Wappen, oder individuelles Design
   - Tools: Canva, Figma, Photoshop, oder GIMP

2. **Icons erstellen:**
   - **512x512px** für `icon-512.png`
   - **192x192px** für `icon-192.png`
   - Beide Dateien ersetzen

3. **Empfehlung:**
   - Verwende das Vorchdorf-Gemeindewappen
   - Oder erstelle ein Custom-Logo mit "V" und Alpen-Silhouette
   - Farben: Grün (#2c5f2d) und Blau (#4a90e2)

---

## 📣 Verbreitung in Vorchdorf

### **1. QR-Code erstellen**
Erstelle einen QR-Code zur Website:
- Online-Tool: https://www.qr-code-generator.com/
- QR-Code führt zur App-URL
- Drucke ihn auf Flyer, Plakate, Gemeinde-Infotafeln

### **2. Gemeinde-Kanäle:**
- **Gemeinde-Website:** Link prominent platzieren
- **Facebook/Instagram:** Post mit QR-Code + Anleitung
- **Gemeindezeitung:** Artikel "Neue Vorchdorf-App verfügbar!"
- **Geschäfte/Vereine:** QR-Code-Aufkleber verteilen

### **3. Beispiel-Text für Social Media:**
```
📱 NEU: Vorchdorf jetzt als App!

✅ 247 Betriebe im Überblick
✅ 61 Vereine mit Kontaktdaten
✅ Notfallnummern immer griffbereit
✅ Bildungseinrichtungen
✅ Funktioniert offline!

👉 [LINK] oder QR-Code scannen
💡 "Als App installieren" klicken → fertig!

#Vorchdorf #Salzkammergut #DigitalGemeinde
```

### **4. Print-Materialien:**
- Flyer für Neubürger-Willkommenspacket
- Plakate in Geschäften
- Gemeinde-Info-Boards
- Veranstaltungen (Marktfest, etc.)

---

## 🔄 Updates

### **Automatische Updates:**
- Änderungen an der HTML-Datei werden automatisch bei jedem Besuch geladen
- Service Worker cached die App für Offline-Nutzung
- Bei neuer Version wird Cache automatisch geleert

### **Manuelles Update erzwingen:**
1. Öffne `service-worker.js`
2. Ändere `CACHE_NAME` von `'vorchdorf-app-v1'` zu `'vorchdorf-app-v2'`
3. Upload die neue Version
4. Nutzer bekommen beim nächsten Besuch die neue Version

---

## 🛠️ Technische Details

### **Features:**
- ✅ Offline-Funktionalität
- ✅ Installierbar auf allen Plattformen
- ✅ Eigenes App-Icon
- ✅ Vollbild-Modus (kein Browser-UI)
- ✅ Schnelle Ladezeiten durch Caching
- ✅ Responsive Design

### **Browser-Kompatibilität:**
- ✅ Chrome/Edge (Android/Desktop): Volle Unterstützung
- ✅ Safari (iOS/Mac): Volle Unterstützung
- ✅ Firefox: Teilweise Unterstützung
- ✅ Samsung Internet: Volle Unterstützung

### **Anforderungen:**
- HTTPS (wird von GitHub Pages automatisch bereitgestellt)
- Moderner Browser (die letzten 2 Jahre)

---

## 📊 Erfolg messen

### **Google Analytics einbinden (optional):**
Füge in die HTML-Datei ein (vor `</head>`):
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Damit trackst du:
- Anzahl der Besucher
- Installationen
- Meistgenutzte Features
- Suchbegriffe

---

## 🆘 Support & Wartung

### **Regelmäßige Pflege:**
- 1x pro Quartal: Vereinsdaten aktualisieren
- 1x pro Jahr: Betriebe-Liste prüfen
- Bei Bedarf: Notfallnummern aktualisieren

### **Feedback sammeln:**
- Email-Adresse in der App: "feedback@vorchdorf.at"
- Oder Google Forms für Feedback einbinden

---

## 🎉 Fertig!

Deine Vorchdorf-App ist jetzt bereit für die Bürger!

**Next Steps:**
1. Icons anpassen (Gemeindewappen verwenden)
2. Auf GitHub Pages deployen
3. QR-Codes erstellen
4. Verbreitung starten

Viel Erfolg! 🚀
