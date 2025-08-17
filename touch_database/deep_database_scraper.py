import os
import re
import time
from pathlib import Path
from bs4 import BeautifulSoup
import requests

# Correspondance avec database_scraper.py mais sans ressources (car pas d'items de craft pour les ressources)
CATEGORIES_MAP = {
    "armes": 30,
    "equipements": 88,
    "consommables": 53,
    "ressources": 78
}

def extract_item_urls_from_html(html_content: str, category: str) -> list:
    """Extrait les URLs des items depuis le HTML d'une page de liste"""
    soup = BeautifulSoup(html_content, 'html.parser')
    item_urls = []
    
    # Pattern pour trouver les liens vers les items
    pattern = f'/fr/mmorpg/encyclopedie/{category}/\d+-[^"]*'
    
    # Trouve tous les liens qui correspondent au pattern
    links = soup.find_all('a', href=re.compile(pattern))
    
    for link in links:
        href = link.get('href')
        if href:
            # Extrait l'ID et le nom depuis l'URL
            # Format: /fr/mmorpg/encyclopedie/consommables/14150-bouteille-cocalane
            parts = href.split('/')[-1]  # "14150-bouteille-cocalane"
            item_id = parts.split('-')[0]  # "14150"
            item_name_slug = '-'.join(parts.split('-')[1:])  # "bouteille-cocalane"
            
            item_urls.append({
                'item_id': item_id,
                'item_name_slug': item_name_slug,
                'full_url': f"https://www.dofus-touch.com{href}",
                'relative_url': href
            })
    
    # Supprime les doublons basés sur l'ID
    seen_ids = set()
    unique_urls = []
    for item in item_urls:
        if item['item_id'] not in seen_ids:
            seen_ids.add(item['item_id'])
            unique_urls.append(item)
    
    return unique_urls

def fetch_item_page_if_missing(category: str, item_id: str, item_name_slug: str) -> bool:
    """Télécharge la page d'un item si elle n'existe pas déjà"""
    # Structure: deep_html/category/item_id_item-name-slug.html
    filename = f"touch_database/deep_html/{category}/{item_id}_{item_name_slug}.html"
    
    # Si le fichier existe, on le lit
    if os.path.exists(filename):
        print(f"✓ Fichier existant: {filename}")
        return True
    
    # Sinon on le télécharge
    print(f"📥 Téléchargement: {filename}")
    url = f"https://www.dofus-touch.com/fr/mmorpg/encyclopedie/{category}/{item_id}-{item_name_slug}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    max_retries = 10  # Maximum 10 essais pour les 403
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            # Si c'est une erreur 403, on fait une pause et on réessaye
            if response.status_code == 403:
                retry_count += 1
                print(f"⚠️ Erreur 403 (tentative {retry_count}/{max_retries}) - Pause de 20 secondes...")
                time.sleep(20)
                continue
            
            # Pour les autres erreurs HTTP, on lève l'exception
            response.raise_for_status()
            
            # Crée le dossier si nécessaire
            Path(f"touch_database/deep_html/{category}").mkdir(parents=True, exist_ok=True)
            
            # Sauvegarde
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            # Pause courte pour éviter de surcharger le serveur
            time.sleep(0.1)
            
            return True
            
        except requests.exceptions.HTTPError as e:
            # Pour les erreurs HTTP autres que 403 (déjà gérées), on arrête
            if "403" not in str(e):
                print(f"❌ Erreur HTTP lors du téléchargement de {url}: {e}")
                return False
        except Exception as e:
            print(f"❌ Erreur lors du téléchargement de {url}: {e}")
            return False
    
    # Si on arrive ici, on a épuisé les tentatives pour les 403
    print(f"❌ Échec après {max_retries} tentatives (403 persistant) pour {url}")
    return False

def get_all_items_from_category(category: str, num_pages: int) -> list:
    """Récupère tous les items d'une catégorie en analysant toutes les pages"""
    all_items = []
    
    for page in range(1, num_pages + 1):
        html_file = f"touch_database/html/{category}/{category}_page_{page}.html"
        
        if not os.path.exists(html_file):
            print(f"⚠️ Fichier manquant: {html_file}")
            continue
        
        print(f"📖 Analyse de la page {page} de {category}")
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            items = extract_item_urls_from_html(html_content, category)
            all_items.extend(items)
            print(f"✓ {len(items)} items trouvés sur la page {page}")
            
        except Exception as e:
            print(f"❌ Erreur lors de l'analyse de la page {page}: {e}")
            continue
    
    print(f"📊 Total: {len(all_items)} items uniques trouvés pour {category}")
    return all_items

def scrape_category_items(category: str, num_pages: int):
    """Scrape tous les items d'une catégorie"""
    print(f"\n🔄 Début du scraping des items de {category}...")
    
    # Récupère la liste de tous les items
    all_items = get_all_items_from_category(category, num_pages)
    
    if not all_items:
        print(f"⚠️ Aucun item trouvé pour {category}")
        return
    
    # Télécharge chaque page d'item
    successful_downloads = 0
    failed_downloads = 0
    
    for i, item in enumerate(all_items, 1):
        print(f"📥 [{i}/{len(all_items)}] {item['item_name_slug']} (ID: {item['item_id']})")
        
        success = fetch_item_page_if_missing(
            category, 
            item['item_id'], 
            item['item_name_slug']
        )
        
        if success:
            successful_downloads += 1
        else:
            failed_downloads += 1
        
        # Pause progressive pour éviter de surcharger le serveur
        if i % 10 == 0:
            print(f"⏸️ Pause (traité {i}/{len(all_items)})")
            time.sleep(0.1)
    
    print(f"\n✅ Scraping de {category} terminé!")
    print(f"📊 Succès: {successful_downloads}, Échecs: {failed_downloads}")

def main():
    """Fonction principale pour scraper tous les items de toutes les catégories"""
    print("🚀 Début du scraping détaillé des items...")
    
    for category, num_pages in CATEGORIES_MAP.items():
        try:
            scrape_category_items(category, num_pages)
            
        except KeyboardInterrupt:
            print("\n⏹️ Scraping interrompu par l'utilisateur")
            break
        except Exception as e:
            print(f"❌ Erreur critique pour {category}: {e}")
            continue
    
    print("\n🎉 Scraping détaillé terminé!")

if __name__ == "__main__":
    main()
