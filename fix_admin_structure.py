#!/usr/bin/env python3

# Neue administration Struktur
NEW_ADMIN = """            administration: {
                id: 'administration',
                title: 'Gemeinde & Verwaltung',
                icon: '🏛️',
                description: 'Gemeindeamt & wichtige Kontakte',
                content: {
                    type: 'mixed',
                    intro: [
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
                        }
                    ]
                },
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
                                link: 'https://www.vorchdorf.at/system/web/kalender.aspx?sprache=1&menuonr=227703103&typids=227719859,227719865'
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
                    ortsplan: {
                        id: 'ortsplan',
                        title: '🗺️ Digitaler Ortsplan',
                        description: 'Interaktive Karte von Vorchdorf',
                        directLink: 'https://www.vorchdorf.at/Buergerservice/Digitaler_Ortsplan'
                    }
                }
            },"""

# Lese Datei
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Finde Start und Ende von administration
start = None
end = None
for i, line in enumerate(lines):
    if 'administration: {' in line and start is None:
        start = i
    if start and 'waste_calendar: {' in line:
        end = i - 1
        break

print(f"✓ Administration: Zeile {start + 1} bis {end + 1}")

# Ersetze
new_lines = lines[:start] + [NEW_ADMIN + '\n'] + lines[end + 1:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Administration Struktur aktualisiert!")
print("   - Kontakt & Öffnungszeiten jetzt als 'intro' (direkt sichtbar)")
print("   - Müllabfuhr-Link behoben")
print("   - Ortsplan als eigene Kategorie")
