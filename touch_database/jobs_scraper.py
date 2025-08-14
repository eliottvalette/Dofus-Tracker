import os
import requests
import pandas as pd
from bs4 import BeautifulSoup
from pathlib import Path
import time
import json

def fetch_jobs_page(page_num):
    """Récupère une page de métiers si elle n'existe pas déjà"""
    filename = f"touch_database/html/jobs/jobs_page_{page_num}.html"
    
    # Si le fichier existe, on le lit
    if os.path.exists(filename):
        print(f"✓ Fichier existant: {filename}")
        with open(filename, 'r', encoding='utf-8') as f:
            return f.read()
    
    # Sinon on le télécharge
    print(f"📥 Téléchargement: {filename}")
    url = f"https://www.dofus-touch.com/fr/mmorpg/encyclopedie/metiers"
    if page_num > 1:
        url += f"?page={page_num}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    # Crée le dossier si nécessaire
    Path(f"touch_database/html/jobs").mkdir(parents=True, exist_ok=True)
    
    # Sauvegarde
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    return response.text

def extract_jobs_from_html(html_content):
    """Extrait la liste des métiers depuis le HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    jobs = []
    
    # Trouve tous les éléments de métier
    job_items = soup.find_all('div', class_='ak-mosaic-item')
    
    for item in job_items:
        # Trouve le lien vers le métier
        link_element = item.find('a')
        if link_element:
            href = link_element.get('href')
            # Extrait l'ID et le nom du métier depuis l'URL
            # Format: /fr/mmorpg/encyclopedie/metiers/26-alchimiste
            if href and '/metiers/' in href:
                job_info = href.split('/metiers/')[-1]  # "26-alchimiste"
                job_id = job_info.split('-')[0]  # "26"
                job_name_slug = '-'.join(job_info.split('-')[1:])  # "alchimiste"
                
                # Trouve le nom affiché
                name_element = item.find('div', class_='ak-mosaic-item-name')
                if name_element:
                    job_name = name_element.get_text(strip=True)
                    
                    # Trouve l'image
                    img_element = item.find('img')
                    img_url = img_element.get('src') if img_element else ""
                    
                    jobs.append({
                        'job_id': job_id,
                        'job_name': job_name,
                        'job_slug': job_name_slug,
                        'job_url': f"https://www.dofus-touch.com{href}",
                        'image_url': img_url
                    })
    
    return jobs

def fetch_job_details(job_id, job_slug):
    """Récupère les détails d'un métier spécifique"""
    filename = f"touch_database/html/jobs/job_{job_id}_{job_slug}.html"
    
    # Si le fichier existe, on le lit
    if os.path.exists(filename):
        print(f"✓ Fichier existant: {filename}")
        with open(filename, 'r', encoding='utf-8') as f:
            return f.read()
    
    # Sinon on le télécharge
    print(f"📥 Téléchargement détails métier: {filename}")
    url = f"https://www.dofus-touch.com/fr/mmorpg/encyclopedie/metiers/{job_id}-{job_slug}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    # Sauvegarde
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    # Pause pour éviter de surcharger le serveur
    time.sleep(1)
    
    return response.text

def extract_job_items(html_content, job_name):
    """Extrait les items associés à un métier"""
    soup = BeautifulSoup(html_content, 'html.parser')
    items = []
    
    # Trouve le tableau des items
    table = soup.find('table', class_='ak-table')
    if table:
        tbody = table.find('tbody')
        if tbody:
            rows = tbody.find_all('tr')
            
            for row in rows:
                cells = row.find_all('td')
                
                # Pour les métiers de récolte : Image, Nom, Niveau, Zones (4 colonnes)
                if len(cells) >= 4:
                    # Extrait l'image
                    img_cell = cells[0]
                    img_element = img_cell.find('img')
                    item_image_url = img_element.get('src') if img_element else ""
                    
                    # Extrait le nom
                    name_cell = cells[1]
                    name_link = name_cell.find('a')
                    item_name = name_link.get_text(strip=True) if name_link else name_cell.get_text(strip=True)
                    
                    # Extrait le niveau requis
                    level_cell = cells[2]
                    level_required = level_cell.get_text(strip=True)
                    
                    # Extrait les zones (si 4e colonne existe)
                    zones = ""
                    if len(cells) > 3:
                        zones_cell = cells[3]
                        zones = zones_cell.get_text(strip=True)
                    
                    items.append({
                        'job_name': job_name,
                        'item_name': item_name,
                        'level_required': level_required,
                        'zones': zones,
                        'item_image_url': item_image_url,
                        'item_type': 'resource'  # Type de l'item (ressource ou recette)
                    })
                
                # Pour les métiers d'artisanat : Image, Nom, Niveau (3 colonnes)
                elif len(cells) == 3:
                    # Extrait l'image
                    img_cell = cells[0]
                    img_element = img_cell.find('img')
                    item_image_url = img_element.get('src') if img_element else ""
                    
                    # Extrait le nom
                    name_cell = cells[1]
                    name_link = name_cell.find('a')
                    item_name = name_link.get_text(strip=True) if name_link else name_cell.get_text(strip=True)
                    
                    # Extrait le niveau requis
                    level_cell = cells[2]
                    level_required = level_cell.get_text(strip=True)
                    
                    items.append({
                        'job_name': job_name,
                        'item_name': item_name,
                        'level_required': level_required,
                        'zones': "",  # Pas de zones pour les recettes
                        'item_image_url': item_image_url,
                        'item_type': 'recipe'  # Type de l'item (ressource ou recette)
                    })
    
    return items

def scrape_all_jobs():
    """Script principal pour scraper tous les métiers"""
    print("🔄 Début du scraping des métiers...")
    
    # Récupère les pages de métiers (2 pages d'après les données fournies)
    all_jobs = []
    
    for page in range(1, 3):  # Pages 1 et 2
        print(f"\n📄 Traitement de la page {page}")
        html_content = fetch_jobs_page(page)
        jobs = extract_jobs_from_html(html_content)
        all_jobs.extend(jobs)
        print(f"✓ {len(jobs)} métiers trouvés sur la page {page}")
    
    print(f"\n📊 Total: {len(all_jobs)} métiers trouvés")
    
    # Sauvegarde la liste des métiers
    jobs_df = pd.DataFrame(all_jobs)
    jobs_df.to_csv('touch_database/data/jobs_list.csv', index=False)
    print(f"💾 Liste des métiers sauvegardée: touch_database/data/jobs_list.csv")
    
    # Récupère les détails de chaque métier
    all_job_items = []
    
    for job in all_jobs:
        print(f"\n🔍 Traitement du métier: {job['job_name']}")
        
        try:
            job_html = fetch_job_details(job['job_id'], job['job_slug'])
            items = extract_job_items(job_html, job['job_name'])
            all_job_items.extend(items)
            print(f"✓ {len(items)} items trouvés pour {job['job_name']}")
            
        except Exception as e:
            print(f"❌ Erreur pour {job['job_name']}: {e}")
            continue
    
    # Sauvegarde le mapping métier -> items
    if all_job_items:
        items_df = pd.DataFrame(all_job_items)
        # Réorganise les colonnes pour plus de clarté
        items_df = items_df[['job_name', 'item_name', 'item_type', 'level_required', 'zones', 'item_image_url']]
        items_df.to_csv('touch_database/data/jobs_items_mapping.csv', index=False)
        print(f"\n💾 Mapping métiers-items sauvegardé: touch_database/data/jobs_items_mapping.csv")
        print(f"📊 Total: {len(all_job_items)} associations métier-item")
        
        # Statistiques par type
        resources_count = len(items_df[items_df['item_type'] == 'resource'])
        recipes_count = len(items_df[items_df['item_type'] == 'recipe'])
        print(f"📊 Ressources: {resources_count}, Recettes: {recipes_count}")
    
    return all_jobs, all_job_items

def build_json_map():
    """Construit le fichier JSON de mapping"""
    # Récupère les données des métiers
    items_df = pd.read_csv('touch_database/data/jobs_items_mapping.csv')
    unique_jobs = items_df['job_name'].unique()

    # Crée le dossier pour le JSON
    os.makedirs('touch_database/data/json', exist_ok=True)

    # Construit le JSON
    json_data = {}
    for job in unique_jobs:
        job_items = items_df[items_df['job_name'] == job]
        json_data[job] = job_items['item_name'].tolist()

    # Sauvegarde le JSON
    with open('touch_database/data/json/jobs_map.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    jobs, job_items = scrape_all_jobs()
    print("\n✅ Scraping terminé!")

    # Build json Map
    build_json_map()
