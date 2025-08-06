import requests
from pathlib import Path
import re

# Configuration
SAVE_DIR = Path("database/html")
SAVE_DIR.mkdir(exist_ok=True)

"""
CATEGORIES_MAP = {
    "armes": 30,
    "equipements": 88,
    "consommables": 53,
    "ressources": 78
}
"""

CATEGORIES_MAP = {
    "armes": 30,
    "equipements": 88,
    "consommables": 53,
    "ressources": 78
}

def slugify(url: str) -> str:
    """Crée un nom de fichier propre à partir de l'URL"""
    tail = url.rstrip("/").split("/")[-1] or "index"
    return re.sub(r"[^A-Za-z0-9._-]+", "_", tail)

def fetch_category(category: str, num_pages: int) -> Path:
    """Récupère toutes les pages d'une catégorie et les sauvegarde"""
    for page in range(1, num_pages + 1):
        url = f"https://www.dofus-touch.com/fr/mmorpg/encyclopedie/{category}?page={page}"
        path = fetch_page(url)
        print(f"✓ Page {page} de {category} sauvegardée → {path}")

def fetch_page(category: str, url: str) -> Path:
    """Récupère une page web et la sauvegarde"""
    # Headers pour éviter d'être bloqué
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    # Récupère la page
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    # Sauvegarde
    filename = SAVE_DIR / f"{category}/{slugify(url)}.html"
    filename.write_text(response.text, encoding="utf-8")
    
    return filename

if __name__ == "__main__":
    for category, num_pages in CATEGORIES_MAP.items():
        path = fetch_category(category, num_pages)
        print(f"✓ Page sauvegardée → {path}")
