#!/usr/bin/env python3
"""
Vorchdorf Formulare Scraper - Verbesserte Version
Scrapt alle Formulare von vorchdorf.at über alle Seiten hinweg
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin
import time

def scrape_page(url, session):
    """Scrapt eine einzelne Seite"""
    print(f"  📄 Lade: {url}")
    response = session.get(url, verify=False)
    response.encoding = 'utf-8'
    return BeautifulSoup(response.text, 'html.parser')

def extract_formulare_from_page(soup, base_url):
    """Extrahiert Formulare von einer Seite"""
    formulare = []
    
    # Suche nach GetDocument.ashx Links (die echten PDFs)
    doc_links = soup.find_all('a', href=re.compile(r'GetDocument\.ashx'))
    
    for link in doc_links:
        title = link.get_text(strip=True)
        
        # Bereinige den Titel (entferne Dateigröße und Format)
        title = re.sub(r'\s*\(\d+\s*KB\)\s*-\s*\.PDF\s*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*\(\d+\s*KB\)\s*$', '', title, flags=re.IGNORECASE)
        title = title.replace('Formular ', '')
        title = title.strip()
        
        if not title:
            continue
            
        url = urljoin(base_url, link.get('href'))
        
        formular = {
            "title": title,
            "url": url,
            "filename": f"{title}.pdf"
        }
        
        formulare.append(formular)
        print(f"    ✓ {title}")
    
    return formulare

def get_all_pages(base_url, session):
    """Ermittelt alle Seitennummern"""
    soup = scrape_page(base_url, session)
    
    # Suche nach Pagination-Links
    page_links = soup.find_all('a', href=re.compile(r'page=\d+'))
    
    max_page = 0
    for link in page_links:
        match = re.search(r'page=(\d+)', link.get('href', ''))
        if match:
            page_num = int(match.group(1))
            max_page = max(max_page, page_num)
    
    return max_page

def scrape_formulare():
    """Scrapt alle Formulare von allen Seiten"""
    
    base_url = "https://www.vorchdorf.at/Buergerservice/Formulare"
    
    print(f"📥 Starte Scraping von: {base_url}\n")
    
    # Session für Cookies
    session = requests.Session()
    
    # Finde heraus, wie viele Seiten es gibt
    print("🔍 Ermittle Anzahl der Seiten...")
    max_page = get_all_pages(base_url, session)
    print(f"✅ Gefunden: {max_page + 1} Seiten\n")
    
    all_formulare = []
    
    # Scrape jede Seite
    for page in range(max_page + 1):
        if page == 0:
            url = base_url
        else:
            url = f"https://www.vorchdorf.at/system/web/formular.aspx?page={page}&letter=ALLE&menuonr=218379637"
        
        print(f"📑 Seite {page + 1}/{max_page + 1}")
        soup = scrape_page(url, session)
        formulare = extract_formulare_from_page(soup, base_url)
        all_formulare.extend(formulare)
        
        # Kurze Pause zwischen Requests
        if page < max_page:
            time.sleep(0.5)
    
    print(f"\n✅ Gesamt gefundene Formulare: {len(all_formulare)}")
    
    # Entferne Duplikate basierend auf URL
    seen_urls = set()
    unique_formulare = []
    for f in all_formulare:
        if f['url'] not in seen_urls:
            seen_urls.add(f['url'])
            unique_formulare.append(f)
    
    if len(unique_formulare) < len(all_formulare):
        print(f"ℹ️  Duplikate entfernt: {len(all_formulare) - len(unique_formulare)}")
    
    # Alphabetisch sortieren
    unique_formulare.sort(key=lambda x: x['title'].lower())
    
    return unique_formulare

def save_json(formulare, output_file='formulare.json'):
    """Speichert die Formulare als JSON"""
    
    from datetime import datetime
    
    data = {
        "lastUpdated": datetime.now().isoformat(),
        "count": len(formulare),
        "formulare": formulare
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Gespeichert: {output_file}")
    print(f"📊 Anzahl Formulare: {len(formulare)}")

if __name__ == "__main__":
    import argparse
    import urllib3
    
    # Deaktiviere SSL-Warnungen
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    parser = argparse.ArgumentParser(description='Vorchdorf Formulare Scraper')
    parser.add_argument('--output', '-o', default='formulare.json', 
                        help='Output JSON file (default: formulare.json)')
    
    args = parser.parse_args()
    
    print("🏛️  Vorchdorf Formulare Scraper v2")
    print("=" * 60)
    
    # Scrape Formulare
    formulare = scrape_formulare()
    
    # Speichere JSON
    save_json(formulare, args.output)
    
    print("\n✨ Fertig!")
