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
    """Extrait les données des tables HTML avec les URLs des images"""
    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table', class_='ak-table')
    
    data = []
    for table in tables:
        rows = table.find_all('tr') # "table row"
        for row in rows[1:]:  # Skip header
            cells = row.find_all(['td', 'th']) # "table data" or "table header"
            if cells:
                # Extrait le texte de chaque cellule (en sautant la première qui contient l'image et la colonne vide)
                row_data = []
                for i, cell in enumerate(cells[1:], 1):
                    text = cell.get_text(strip=True)
                    # Ignore les cellules vides
                    if text:
                        row_data.append(text)
                
                # Cherche l'image dans la première cellule
                img = cells[0].find('img')
                if img and img.get('src'):
                    # Ajoute l'URL de l'image au début
                    row_data.insert(0, img['src'])
                else:
                    # Pas d'image trouvée
                    row_data.insert(0, "")
                
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
        df.columns = ["original_image_url", "nom", "type", "niveau"]
        df["category"] = category
        df = df[["category", "nom", "type", "niveau", "original_image_url"]]
        
        csv_filename = f"database/data/{category}_data.csv"
        df.to_csv(csv_filename, index=False)
        print(f"💾 Données sauvegardées: {csv_filename} ({len(all_data)} éléments)")

def merge_data():
    armes_df = pd.read_csv('database/data/armes_data.csv')
    consommables_df = pd.read_csv('database/data/consommables_data.csv')
    equipements_df = pd.read_csv('database/data/equipements_data.csv')
    ressources_df = pd.read_csv('database/data/ressources_data.csv')

    merged_df = pd.concat([armes_df, consommables_df, equipements_df, ressources_df])
    merged_df.to_csv('database/data/merged.csv', index=False)

if __name__ == "__main__":
    for category, num_pages in CATEGORIES_MAP.items():
        print(f"\n🔄 Extraction de {category} ({num_pages} pages)...")
        process_category(category, num_pages)

    merge_data()


