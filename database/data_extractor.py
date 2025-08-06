import pandas as pd
import os
from bs4 import BeautifulSoup

CATEGORIES_MAP = {
    "armes": 30,
    "equipements": 88,
    "consommables": 53,
    "ressources": 78
}

os.makedirs("database/data", exist_ok=True)

def extract_table_data(html_content: str) -> list:
    """Extrait les données des tables HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table', class_='ak-table')
    
    data = []
    for table in tables:
        rows = table.find_all('tr')
        for row in rows[1:]:  # Skip header
            cells = row.find_all(['td', 'th'])
            if cells:
                row_data = [cell.get_text(strip=True) for cell in cells]
                data.append(row_data)
    
    return data

def process_category(category: str, num_pages: int):
    """Traite une catégorie complète"""
    all_data = []
    
    for page in range(1, num_pages + 1):
        filename = f"database/html/{category}/{category}_page_{page}.html"
        
        if not os.path.exists(filename):
            print(f"⚠️ Fichier manquant: {filename}")
            continue
            
        with open(filename, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        page_data = extract_table_data(html_content)
        all_data.extend(page_data)
        print(f"✓ Page {page}: {len(page_data)} éléments extraits")
    
    # Sauvegarde en CSV
    if all_data:
        df = pd.DataFrame(all_data)
        csv_filename = f"database/data/{category}_data.csv"
        df.to_csv(csv_filename, index=False, header=False)
        print(f"💾 Données sauvegardées: {csv_filename} ({len(all_data)} éléments)")

if __name__ == "__main__":
    for category, num_pages in CATEGORIES_MAP.items():
        print(f"\n🔄 Extraction de {category} ({num_pages} pages)...")
        process_category(category, num_pages)


