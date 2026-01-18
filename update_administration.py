#!/usr/bin/env python3
"""
Script zum Aktualisieren der administration Kategorie in index.html
"""

# Neue administration Sektion
NEW_ADMINISTRATION = """            administration: {
                id: 'administration',
                title: 'Gemeinde & Verwaltung',
                icon: '🏛️',
                description: 'Gemeindeamt & wichtige Kontakte',
                subcategories: {
                    formulare: {
                        id: 'formulare',
                        title: '📋 Formulare & Anträge',
                        description: '28 Online-Formulare für Bürgerservice',
                        externalLink: './gemeinde-verwaltung/formulare.html'
                    },
                    abteilungen: {
                        id: 'abteilungen',
                        title: '🏢 Ämter & Abteilungen',
                        description: '13 Abteilungen mit Ansprechpartnern',
                        externalLink: './gemeinde-verwaltung/abteilungen.html'
                    },
                    mitarbeiter: {
                        id: 'mitarbeiter',
                        title: '👥 Mitarbeiter-Verzeichnis',
                        description: '41 Mitarbeiter mit Kontaktdaten',
                        externalLink: './gemeinde-verwaltung/mitarbeiter.html'
                    },
                    gemeindebetriebe: {
                        id: 'gemeindebetriebe',
                        title: '🏭 Gemeindebetriebe',
                        description: 'Betriebe der Gemeinde Vorchdorf',
                        externalLink: './gemeinde-verwaltung/gemeindebetriebe.html'
                    },
                    muell: {
                        id: 'muell',
                        title: '♻️ Müllkalender & ASZ',
                        description: 'Abfuhrtermine & Altstoffsammelzentrum',
                        items: [
                            {
                                title: 'Müllabfuhr-Termine 2026',
                                info: [
                                    '♻️ Abfuhrtermine für alle Ortsteile',
                                    'Bio-, Rest- und Papiertonnen',
                                    'Gelbe Tonne & Restmüll'
                                ],
                                wasteCalendar: true
                            },
                            {
                                title: 'ASZ Altstoffsammelzentrum',
                                info: [
                                    '♻️ Altstoffe richtig entsorgen',
                                    'Infos zu Öffnungszeiten & Standort',
                                    'Was wird angenommen?'
                                ],
                                link: 'https://www.altstoffsammelzentrum.at/wo_wann_was/asz/show/Asz/vorchdorf.html'
                            }
                        ]
                    },
                    kontakt: {
                        id: 'kontakt',
                        title: 'ℹ️ Kontakt & Öffnungszeiten',
                        description: 'Gemeindeamt Vorchdorf',
                        items: [
                            {
                                title: 'Marktgemeinde Vorchdorf',
                                info: [
                                    '📍 Schloßplatz 7, 4655 Vorchdorf',
                                    '☎️ +43 7614 6555 500',
                                    '📧 gemeinde@vorchdorf.ooe.gv.at',
                                    '🌐 www.vorchdorf.at'
                                ],
                                link: 'https://www.vorchdorf.at'
                            },
                            {
                                title: 'Öffnungszeiten Bürgerservice',
                                info: [
                                    'Montag: 07:00 - 12:00 Uhr',
                                    'Dienstag: 07:00 - 12:00 & 14:00 - 18:00 Uhr',
                                    'Mittwoch: kein Parteienverkehr',
                                    'Donnerstag: 07:00 - 12:00 & 14:00 - 17:00 Uhr',
                                    'Freitag: 07:00 - 12:00 Uhr'
                                ]
                            },
                            {
                                title: 'Digitaler Ortsplan',
                                info: [
                                    '🗺️ Interaktive Karte von Vorchdorf',
                                    'Alle wichtigen Adressen'
                                ],
                                link: 'https://www.vorchdorf.at/Buergerservice/Digitaler_Ortsplan'
                            }
                        ]
                    }
                }
            },"""

# Lese index.html
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Finde Start und Ende
start_line = None
end_line = None

for i, line in enumerate(lines):
    if 'administration: {' in line and start_line is None:
        start_line = i
    if start_line is not None and i > start_line:
        if 'waste_calendar: {' in line:
            end_line = i - 1
            break

print(f"✓ Administration: Zeile {start_line + 1} bis {end_line + 1}")

# Erstelle neue Datei
new_lines = lines[:start_line] + [NEW_ADMINISTRATION + '\n'] + lines[end_line + 1:]

# Schreibe zurück
with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ index.html aktualisiert!")
print("\n📋 Neue Unterkategorien:")
print("   1. 📋 Formulare & Anträge (28 Formulare)")
print("   2. 🏢 Ämter & Abteilungen (13 Abteilungen)")
print("   3. 👥 Mitarbeiter-Verzeichnis (41 Mitarbeiter)")
print("   4. 🏭 Gemeindebetriebe")
print("   5. ♻️ Müllkalender & ASZ")
print("   6. ℹ️ Kontakt & Öffnungszeiten")
