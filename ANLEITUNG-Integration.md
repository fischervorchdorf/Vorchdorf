# Anleitung: Veranstaltungen in die Vorchdorf-App integrieren

## Übersicht
Du musst 2 kleine Änderungen in deiner `vorchdorf-willkommen.html` machen.

---

## ÄNDERUNG 1: Neue Kategorie hinzufügen

**Suche nach diesem Code** (ungefähr Zeile 850-855):

```javascript
leisure: {
    id: 'leisure',
    title: 'Freizeit & Kultur',
    icon: '🎨',
    description: 'Veranstaltungen, Sehenswürdigkeiten & mehr',
```

**Ersetze es durch:**

```javascript
events: {
    id: 'events',
    title: 'Veranstaltungen',
    icon: '📅',
    description: 'Aktuelle Events, Konzerte, Feste & mehr',
    externalLink: 'vorchdorf-veranstaltungen.html'
},
leisure: {
    id: 'leisure',
    title: 'Freizeit & Kultur',
    icon: '🎨',
    description: 'Sehenswürdigkeiten, Natur & Gastronomie',
```

---

## ÄNDERUNG 2: Navigation für externe Links aktivieren

**Suche nach diesem Code** (ungefähr Zeile 1350):

```javascript
// Navigate to Category
function navigateToCategory(categoryId) {
    const category = categories[categoryId];
    if (!category) return;

    currentView = 'category';
```

**Ersetze es durch:**

```javascript
// Navigate to Category
function navigateToCategory(categoryId) {
    const category = categories[categoryId];
    if (!category) return;

    // Check for external link (z.B. Veranstaltungen)
    if (category.externalLink) {
        window.location.href = category.externalLink;
        return;
    }

    currentView = 'category';
```

---

## Fertig!

Nach diesen 2 Änderungen erscheint auf der Startseite eine neue Kachel "📅 Veranstaltungen".
Wenn man darauf klickt, öffnet sich die `vorchdorf-veranstaltungen.html`.

**Wichtig:** Beide HTML-Dateien müssen im selben Ordner liegen:
- vorchdorf-willkommen.html
- vorchdorf-veranstaltungen.html
