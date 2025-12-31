# Sicherung Version 2.42 - Vorchdorf App

**Erstellungsdatum:** 30. Dezember 2025  
**Grund:** Backup nach Behebung der doppelten Icons bei Sport, Vereine und Notfallkontakte

## Inhalt dieser Sicherung

Die folgenden Dateien sind in diesem Ordner enthalten:

### Hauptdateien
- **index.html** - Die Hauptanwendungsdatei (zur Zeit der Sicherung)
- **Vorchdorf_App_index.html** - Die Quelldatei aus dem "Vorchdorf App" Ordner (Backup der Quelle)

### Service Worker & Manifest
- **service-worker.js** - Service Worker für PWA-Funktionalität
- **manifest.json** - PWA-Manifest-Datei

### Icons & Assets
- **icon-192.png** - App-Icon 192x192px
- **icon-512.png** - App-Icon 512x512px
- **AUT_Vorchdorf_COA.svg.png** - Vorchdorf-Wappengrafik

## Wie man diese Sicherung verwendet

Falls Probleme auftreten und Sie zur Version 2.42 zurückkehren möchten:

1. **Nur die HTML wiederherstellen:**
   ```bash
   cp sicherung_v2.42/index.html index.html
   cp sicherung_v2.42/Vorchdorf_App_index.html "Vorchdorf App/index.html"
   ```

2. **Alle Dateien wiederherstellen:**
   ```bash
   cp sicherung_v2.42/* .
   ```

3. **Nach Wiederherstellung:**
   - Version in `index.html` ggf. anpassen
   - Die Datei `Vorchdorf App/index.html` mit der kopiertenAuto-Kopie synchronisieren
   - Git commit und push

## Version-Info

**Version:** 2.42  
**Hauptänderungen:**
- ✅ Emoji aus sport_fitness title entfernt (war: '⚽ Sport & Fitness' → jetzt: 'Sport & Fitness')
- ✅ Emoji aus clubs title entfernt (war: '🤝 Vereine' → jetzt: 'Vereine')
- ✅ Emoji aus emergency title entfernt (war: '🆘 Notfallkontakte & Standorte' → jetzt: 'Notfallkontakte & Standorte')
- ✅ Emojis bleiben im icon-Feld erhalten (keine doppelten Icons mehr)

## Git-Information

Der Commit für diese Version:
```
commit: 1c391db
message: v2.42: Remove duplicate emoji from sport_fitness category title
```

## Support

Falls Sie diese Sicherung verwenden müssen und weitere Fragen haben, können Sie:
1. Auf diese README-Datei referenzieren
2. Git-History der vorherigen Commits einsehen
3. Bei Bedarf eine neue Version ab dieser Sicherung starten
