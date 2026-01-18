#!/usr/bin/env python3
"""
Vorchdorf Abteilungen Scraper
Scrapt alle Abteilungen mit Mitarbeitern, Kontaktdaten und zugehörigen Formularen
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin
import time

def scrape_abteilungen_overview():
    """Scrapt die Übersicht aller Abteilungen"""
    url = "https://www.vorchdorf.at/Gemeindeamt/Abteilungen"
    
    print(f"📥 Lade Abteilungen-Übersicht: {url}\n")
    
    session = requests.Session()
    response = session.get(url, verify=False)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')
    
    abteilungen = []
    
    # Finde alle Abteilungs-Links
    links = soup.find_all('a', href=re.compile(r'/Gemeindeamt/Abteilungen/'))
    
    seen_urls = set()
    
    for link in links:
        href = link.get('href')
        if not href or href in seen_urls:
            continue
            
        # Filtere Duplikate und die Hauptseite
        if href == '/Gemeindeamt/Abteilungen':
            continue
            
        full_url = urljoin(url, href)
        title = link.get_text(strip=True)
        
        if title and full_url not in seen_urls:
            abteilungen.append({
                'name': title,
                'url': full_url
            })
            seen_urls.add(full_url)
            print(f"  ✓ {title}")
    
    return abteilungen

def scrape_abteilung_detail(abt_url, abt_name):
    """Scrapt Details einer Abteilung inkl. Mitarbeiter und Formulare"""
    
    print(f"\n  📄 Lade Details: {abt_name}")
    
    session = requests.Session()
    response = session.get(abt_url, verify=False)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')
    
    abteilung = {
        'name': abt_name,
        'url': abt_url,
        'beschreibung': '',
        'mitarbeiter': [],
        'formulare': []
    }
    
    # Extrahiere Beschreibung
    content_div = soup.find('div', id='content')
    if content_div:
        # Suche nach Textblöcken vor den Listen
        paragraphs = content_div.find_all('p')
        if paragraphs:
            abteilung['beschreibung'] = paragraphs[0].get_text(strip=True)
    
    # Suche nach Mitarbeitern
    # Meist in einer Tabelle oder Liste
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                # Prüfe ob es Mitarbeiter-Daten sind
                text = ' '.join([c.get_text(strip=True) for c in cells])
                
                if '@' in text or 'Tel' in text or any(keyword in text.lower() for keyword in ['leiter', 'sachbearbeiter', 'mitarbeiter']):
                    mitarbeiter = extract_mitarbeiter_from_row(row, abt_url)
                    if mitarbeiter:
                        abteilung['mitarbeiter'].append(mitarbeiter)
    
    # Alternative: Suche in Listen
    if not abteilung['mitarbeiter']:
        lists = soup.find_all(['ul', 'ol'])
        for lst in lists:
            items = lst.find_all('li')
            for item in items:
                text = item.get_text(strip=True)
                if '@' in text or 'Tel' in text:
                    mitarbeiter = extract_mitarbeiter_from_text(item, abt_url)
                    if mitarbeiter:
                        abteilung['mitarbeiter'].append(mitarbeiter)
    
    # Suche nach zugehörigen Formularen
    form_links = soup.find_all('a', href=re.compile(r'GetDocument\.ashx'))
    for link in form_links:
        title = link.get_text(strip=True)
        title = re.sub(r'\s*\(\d+\s*KB\).*$', '', title, flags=re.IGNORECASE)
        title = title.replace('Formular ', '').strip()
        
        if title:
            abteilung['formulare'].append({
                'title': title,
                'url': urljoin(abt_url, link.get('href'))
            })
    
    print(f"    → {len(abteilung['mitarbeiter'])} Mitarbeiter, {len(abteilung['formulare'])} Formulare")
    
    return abteilung

def extract_mitarbeiter_from_row(row, base_url):
    """Extrahiert Mitarbeiter-Daten aus einer Tabellenzeile"""
    
    cells = row.find_all(['td', 'th'])
    text = row.get_text()
    
    # Suche nach Email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else ''
    
    # Suche nach Telefon
    tel_match = re.search(r'(?:Tel\.?|Telefon)?[\s:]*([+\d\s/()-]+)', text)
    telefon = tel_match.group(1).strip() if tel_match else ''
    telefon = re.sub(r'\s+', ' ', telefon)
    
    # Suche nach Namen (meist in erster Zelle oder vor Email)
    name = ''
    if cells:
        name_cell = cells[0].get_text(strip=True)
        # Entferne "Abteilungsleiter:" etc.
        name = re.sub(r'(Abteilungsleiter|Leiter|Sachbearbeiter|Mitarbeiter)[\s:]*', '', name_cell, flags=re.IGNORECASE).strip()
    
    # Suche nach Foto
    foto_url = ''
    img = row.find('img')
    if img and img.get('src'):
        foto_url = urljoin(base_url, img.get('src'))
    
    # Funktion/Position
    funktion = ''
    for cell in cells:
        cell_text = cell.get_text(strip=True).lower()
        if 'leiter' in cell_text or 'sachbearbeiter' in cell_text:
            funktion = cell.get_text(strip=True)
            break
    
    if name or email:
        return {
            'name': name,
            'funktion': funktion,
            'email': email,
            'telefon': telefon,
            'foto': foto_url
        }
    
    return None

def extract_mitarbeiter_from_text(element, base_url):
    """Extrahiert Mitarbeiter-Daten aus Text"""
    
    text = element.get_text()
    
    # Email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else ''
    
    # Telefon
    tel_match = re.search(r'(?:Tel\.?|Telefon)?[\s:]*([+\d\s/()-]+)', text)
    telefon = tel_match.group(1).strip() if tel_match else ''
    
    # Name (Text vor Email oder Telefon)
    name = text.split('@')[0].split('Tel')[0].strip()
    name = re.sub(r'(Abteilungsleiter|Leiter|Sachbearbeiter|Mitarbeiter)[\s:]*', '', name, flags=re.IGNORECASE).strip()
    
    # Foto
    foto_url = ''
    img = element.find('img')
    if img and img.get('src'):
        foto_url = urljoin(base_url, img.get('src'))
    
    if name and (email or telefon):
        return {
            'name': name,
            'funktion': '',
            'email': email,
            'telefon': telefon,
            'foto': foto_url
        }
    
    return None

def main():
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    print("🏛️  Vorchdorf Abteilungen Scraper")
    print("=" * 60)
    
    # 1. Hole Übersicht
    abteilungen_overview = scrape_abteilungen_overview()
    print(f"\n✅ {len(abteilungen_overview)} Abteilungen gefunden\n")
    
    # 2. Hole Details für jede Abteilung
    print("📋 Lade Abteilungs-Details...")
    
    abteilungen_detail = []
    for abt in abteilungen_overview:
        detail = scrape_abteilung_detail(abt['url'], abt['name'])
        abteilungen_detail.append(detail)
        time.sleep(0.5)  # Pause zwischen Requests
    
    # 3. Speichere als JSON
    data = {
        'count': len(abteilungen_detail),
        'abteilungen': abteilungen_detail
    }
    
    with open('abteilungen.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Gespeichert: abteilungen.json")
    print(f"📊 Anzahl Abteilungen: {len(abteilungen_detail)}")
    
    # Statistik
    total_mitarbeiter = sum(len(a['mitarbeiter']) for a in abteilungen_detail)
    total_formulare = sum(len(a['formulare']) for a in abteilungen_detail)
    print(f"👥 Gesamt Mitarbeiter: {total_mitarbeiter}")
    print(f"📄 Gesamt Formulare: {total_formulare}")
    
    print("\n✨ Fertig!")

if __name__ == "__main__":
    main()
