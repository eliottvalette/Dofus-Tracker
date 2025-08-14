import os
from pathlib import Path
import requests

CATEGORIES_MAP = {
    "armes": 30,
    "equipements": 88,
    "consommables": 53,
    "ressources": 78
}

def fetch_page_if_missing(category: str, page: int) -> str:
    """Récupère une page seulement si elle n'existe pas déjà"""
    filename = f"touch_database/html/{category}/{category}_page_{page}.html"
    
    # Si le fichier existe, on le lit
    if os.path.exists(filename):
        print(f"✓ Fichier existant: {filename}")
        return True
    
    # Sinon on le télécharge
    print(f"📥 Téléchargement: {filename}")
    url = f"https://www.dofus-touch.com/fr/mmorpg/encyclopedie/{category}?page={page}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    # Crée le dossier si nécessaire
    Path(f"touch_database/html/{category}").mkdir(parents=True, exist_ok=True)
    
    # Sauvegarde
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(response.text)

    return True

def fetch_category(category: str, num_pages: int):
    """Télécharge toutes les pages d'une catégorie"""
    for page in range(1, num_pages + 1):
        try:
            fetch_page_if_missing(category, page)
            print(f"✓ Page {page} de {category} traitée")
        except Exception as e:
            print(f"❌ Erreur page {page}: {e}")
            break

if __name__ == "__main__":
    for category, num_pages in CATEGORIES_MAP.items():
        print(f"\n🔄 Scraping de {category} ({num_pages} pages)...")
        fetch_category(category, num_pages)


