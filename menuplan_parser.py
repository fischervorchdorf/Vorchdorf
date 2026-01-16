import json
import re
from datetime import datetime, timedelta

def get_iso_week(dt):
    """Gibt (KW, Jahr) für ein Datum zurück."""
    return dt.isocalendar()[0:2]

def parse_relative_week(label, timestamp=None):
    """
    Berechnet KW und Jahr basierend auf der Auswahl im Formular.
    'Diese Woche' = Aktuelle KW des Zeitstempels
    'Nächste Woche' = KW + 1
    'Übernächste Woche' = KW + 2
    """
    if timestamp is None:
        timestamp = datetime.now()
    
    # ISO-Woche des Einreichzeitpunkts
    # Wir nehmen den Montag der aktuellen Woche als Basis
    monday_current = timestamp - timedelta(days=timestamp.weekday())
    
    if "Nächste Woche" in label:
        target_dt = monday_current + timedelta(weeks=1)
    elif "Übernächste Woche" in label:
        target_dt = monday_current + timedelta(weeks=2)
    else: # "Diese Woche"
        target_dt = monday_current

    year, kw, day = target_dt.isocalendar()
    return kw, year

def get_week_label(kw, year):
    """Erstellt ein Label wie 'KW04 (19.01. - 25.01.2026)'."""
    # Erster Tag der KW berechnen
    # ISO-Wochen beginnen am Montag
    first_day = datetime.strptime(f'{year}-W{kw:02d}-1', "%G-W%V-%u")
    last_day = first_day + timedelta(days=6)
    
    return f"KW{kw:02d} ({first_day.strftime('%d.%m.')} - {last_day.strftime('%d.%m.%Y')})"

def extract_days_from_freitext(text):
    """
    Versucht Wochentage aus einem Freitext zu extrahieren.
    Erkennt Formate wie 'MONTAG: ...' oder 'Mo: ...'
    """
    days_mapping = {
        'montag': ['montag', 'mo'],
        'dienstag': ['dienstag', 'di'],
        'mittwoch': ['mittwoch', 'mi'],
        'donnerstag': ['donnerstag', 'do'],
        'freitag': ['freitag', 'fr'],
        'samstag': ['samstag', 'sa'],
        'sonntag': ['sonntag', 'so']
    }
    
    result = {d: "" for d in days_mapping}
    
    # Normalisiere Text: Zeilenumbrüche vereinheitlichen
    text = text.replace('\r', '')
    
    # Suche nach Markern
    lines = text.split('\n')
    current_day = None
    
    for line in lines:
        clean_line = line.strip()
        if not clean_line: continue
        
        found_header = False
        for day, aliases in days_mapping.items():
            # Regex für Tag am Zeilenanfang, gefolgt von Trennern
            pattern = r'^(' + '|'.join(aliases) + r')[:\s,\.]'
            if re.match(pattern, clean_line.lower()):
                current_day = day
                # Rest der Zeile als Inhalt nehmen
                content = re.sub(pattern, '', clean_line, flags=re.IGNORECASE).strip()
                result[current_day] = content
                found_header = True
                break
        
        if not found_header and current_day:
            # Zeile gehört zum bisherigen Tag
            if result[current_day]:
                result[current_day] += "\n" + clean_line
            else:
                result[current_day] = clean_line
                
    return result

def parse_formular_zeile(gasthaus, email, woche_auswahl, freitext="", 
                          montag="", dienstag="", mittwoch="", donnerstag="", freitag="", 
                          samstag="", sonntag="", preis="", timestamp=None):
    """
    Verarbeitet eine Zeile aus dem Google Formular und gibt eine Liste 
    von Einträgen (ein Objekt pro Tag) zurück.
    """
    if timestamp is None:
        timestamp = datetime.now()
        
    kw, jahr = parse_relative_week(woche_auswahl, timestamp)
    week_label = get_week_label(kw, jahr)
    
    # Extrahiere Menüs (bevorzugt Einzelfelder, sonst Freitext)
    menus = {
        'montag': montag,
        'dienstag': dienstag,
        'mittwoch': mittwoch,
        'donnerstag': donnerstag,
        'freitag': freitag,
        'samstag': samstag,
        'sonntag': sonntag
    }
    
    # Wenn Einzelfeld leer ist, schaue im Freitext nach
    freitext_data = extract_days_from_freitext(freitext)
    for day in menus:
        if not menus[day].strip():
            menus[day] = freitext_data[day]
            
    # Erstelle flache Struktur für die App
    items = []
    base_date = datetime.strptime(f'{jahr}-W{kw:02d}-1', "%G-W%V-%u")
    
    days_list = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag']
    
    for i, day_name in enumerate(days_list):
        menu = menus[day_name]
        if menu.strip():
            current_date = base_date + timedelta(days=i)
            items.append({
                "gasthaus": gasthaus,
                "email": email,
                "datum": current_date.strftime("%Y-%m-%d"),
                "tag": day_name.capitalize(),
                "kw": kw,
                "jahr": jahr,
                "woche_label": week_label,
                "menu": menu.strip(),
                "preis": preis,
                "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
            
    return items

def items_to_json(items):
    """Konvertiert die Liste der Items in einen JSON-String."""
    return json.dumps(items, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    # Demo/Test
    test_timestamp = datetime(2026, 1, 15) # Donnerstag KW03
    
    demo_items = parse_formular_zeile(
        gasthaus="Gasthaus Hinterreitner",
        email="hinterreitner@email.at",
        woche_auswahl="Nächste Woche",
        freitext="MONTAG: Schweinsbraten mit Knödel\nDIENSTAG: Backhendl mit Salat\nMITTWOCH: Gulasch",
        preis="12,50",
        timestamp=test_timestamp
    )
    
    print(f"Geparste Einträge: {len(demo_items)}")
    print(items_to_json(demo_items))
