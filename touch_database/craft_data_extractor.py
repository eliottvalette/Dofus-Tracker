import os
import pandas as pd
from bs4 import BeautifulSoup
import re
import json
from pathlib import Path

# Catégories à traiter
CATEGORIES = ["armes", "equipements", "consommables"]

def extract_item_info_from_filename(filename):
    """Extrait l'ID et le nom de l'item depuis le nom de fichier"""
    # Format: item_id_item-name-slug.html
    basename = os.path.basename(filename)
    name_without_ext = basename.replace('.html', '')
    
    if '_' not in name_without_ext:
        return None, None
    
    parts = name_without_ext.split('_', 1)
    item_id = parts[0]
    item_name_slug = parts[1] if len(parts) > 1 else ""
    
    return item_id, item_name_slug

def extract_item_name_from_html(soup):
    """Extrait le nom de l'item depuis le HTML"""
    # Le nom est dans le titre h1
    title_element = soup.find('h1', class_='ak-return-link')
    if title_element:
        # Le nom est le texte direct, pas dans les sous-éléments
        name = title_element.get_text(strip=True)
        # Enlève les espaces multiples et les retours à la ligne
        name = re.sub(r'\s+', ' ', name)
        return name
    return ""

def extract_recipe_from_html(html_content, item_id, item_name_slug):
    """Extrait les informations de craft depuis le HTML d'une page d'item"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Informations de base de l'item
    item_name = extract_item_name_from_html(soup)
    
    # Cherche la section de recette
    crafts_section = soup.find('div', class_='ak-container ak-panel ak-crafts')
    
    if not crafts_section:
        # Pas de recette pour cet item
        return {
            'item_id': item_id,
            'item_name': item_name,
            'item_slug': item_name_slug,
            'has_recipe': False,
            'job': None,
            'job_level': None,
            'ingredients': []
        }
    
    # Extrait le métier et le niveau requis
    job_info = crafts_section.find('div', class_='ak-panel-intro')
    job = None
    job_level = None
    
    if job_info:
        # Le métier est souvent le premier mot
        job_text = job_info.get_text(strip=True)
        # Format: "Alchimiste Niveau 20" ou "Alchimiste Niveau 20"
        parts = job_text.split()
        if parts:
            job = parts[0]
        
        # Cherche le niveau dans le texte complet ou dans une span
        level_span = job_info.find('span')
        if level_span:
            level_text = level_span.get_text(strip=True)
            # Format: "Niveau 20"
            level_match = re.search(r'(\d+)', level_text)
            if level_match:
                job_level = int(level_match.group(1))
        else:
            # Fallback: cherche dans le texte complet
            level_match = re.search(r'Niveau\s+(\d+)', job_text)
            if level_match:
                job_level = int(level_match.group(1))
    
    # Extrait les ingrédients
    ingredients = []
    ingredient_elements = crafts_section.find_all('div', class_='ak-list-element')
    
    for ingredient_elem in ingredient_elements:
        # Quantité (dans ak-front)
        quantity_elem = ingredient_elem.find('div', class_='ak-front')
        quantity = 1
        if quantity_elem:
            quantity_text = quantity_elem.get_text(strip=True)
            # Format: "4 x" ou "1 x"
            quantity_match = re.search(r'(\d+)', quantity_text)
            if quantity_match:
                quantity = int(quantity_match.group(1))
        
        # Nom de l'ingrédient (dans ak-title)
        title_elem = ingredient_elem.find('div', class_='ak-title')
        ingredient_name = ""
        ingredient_id = None
        
        if title_elem:
            # Cherche le lien vers l'ingrédient
            link_elem = title_elem.find('a')
            if link_elem:
                ingredient_name = link_elem.get_text(strip=True)
                # Extrait l'ID depuis l'URL
                href = link_elem.get('href', '')
                # Format: /fr/mmorpg/encyclopedie/ressources/395-trefle-5-feuilles
                id_match = re.search(r'/(\d+)-', href)
                if id_match:
                    ingredient_id = id_match.group(1)
        
        # Type de l'ingrédient (dans ak-text)
        type_elem = ingredient_elem.find('div', class_='ak-text')
        ingredient_type = ""
        if type_elem:
            ingredient_type = type_elem.get_text(strip=True)
        
        if ingredient_name:
            ingredients.append({
                'ingredient_id': ingredient_id,
                'ingredient_name': ingredient_name,
                'ingredient_type': ingredient_type,
                'quantity': quantity
            })
    
    return {
        'item_id': item_id,
        'item_name': item_name,
        'item_slug': item_name_slug,
        'has_recipe': True,
        'job': job,
        'job_level': job_level,
        'ingredients': ingredients
    }

def process_category_crafts(category):
    """Traite tous les fichiers HTML d'une catégorie pour extraire les recettes"""
    deep_html_dir = f"touch_database/deep_html/{category}"
    
    if not os.path.exists(deep_html_dir):
        print(f"⚠️ Dossier manquant: {deep_html_dir}")
        return []
    
    all_crafts_data = []
    files = [f for f in os.listdir(deep_html_dir) if f.endswith('.html')]
    
    print(f"🔄 Traitement de {len(files)} fichiers pour {category}...")
    
    for i, filename in enumerate(files, 1):
        file_path = os.path.join(deep_html_dir, filename)
        
        # Extrait les infos du nom de fichier
        item_id, item_name_slug = extract_item_info_from_filename(filename)
        
        if not item_id:
            print(f"⚠️ Impossible d'extraire l'ID depuis: {filename}")
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            craft_data = extract_recipe_from_html(html_content, item_id, item_name_slug)
            craft_data['category'] = category
            all_crafts_data.append(craft_data)
            
            if i % 100 == 0:
                print(f"✓ Traité {i}/{len(files)} fichiers")
                
        except Exception as e:
            print(f"❌ Erreur lors du traitement de {filename}: {e}")
            continue
    
    print(f"✅ {category}: {len(all_crafts_data)} items traités")
    return all_crafts_data

def flatten_craft_data(all_crafts_data):
    """Aplati les données de craft pour les sauvegarder en CSV"""
    flattened_data = []
    
    for craft_data in all_crafts_data:
        base_row = {
            'item_id': craft_data['item_id'],
            'item_name': craft_data['item_name'],
            'item_slug': craft_data['item_slug'],
            'category': craft_data['category'],
            'has_recipe': craft_data['has_recipe'],
            'job': craft_data['job'],
            'job_level': craft_data['job_level']
        }
        
        if craft_data['has_recipe'] and craft_data['ingredients']:
            # Une ligne par ingrédient
            for ingredient in craft_data['ingredients']:
                row = base_row.copy()
                row.update({
                    'ingredient_id': ingredient['ingredient_id'],
                    'ingredient_name': ingredient['ingredient_name'],
                    'ingredient_type': ingredient['ingredient_type'],
                    'quantity': ingredient['quantity']
                })
                flattened_data.append(row)
        else:
            # Item sans recette
            row = base_row.copy()
            row.update({
                'ingredient_id': None,
                'ingredient_name': None,
                'ingredient_type': None,
                'quantity': None
            })
            flattened_data.append(row)
    
    return flattened_data

def save_craft_summary(all_crafts_data):
    """Sauvegarde un résumé des recettes (sans détail des ingrédients)"""
    summary_data = []
    
    for craft_data in all_crafts_data:
        ingredients_count = len(craft_data['ingredients']) if craft_data['has_recipe'] else 0
        
        summary_data.append({
            'item_id': craft_data['item_id'],
            'item_name': craft_data['item_name'],
            'item_slug': craft_data['item_slug'],
            'category': craft_data['category'],
            'has_recipe': craft_data['has_recipe'],
            'job': craft_data['job'],
            'job_level': craft_data['job_level'],
            'ingredients_count': ingredients_count
        })
    
    df_summary = pd.DataFrame(summary_data)
    summary_file = "touch_database/data/craft_summary.csv"
    df_summary.to_csv(summary_file, index=False)
    print(f"📄 Résumé sauvegardé: {summary_file}")
    
    return df_summary

def save_craft_json(all_crafts_data):
    """Sauvegarde les recettes en format JSON"""
    craft_json = {}
    
    for craft_data in all_crafts_data:
        item_name = craft_data['item_name']
        
        if craft_data['has_recipe'] and craft_data['ingredients']:
            # Créer la liste des ingrédients sous forme de tuples (id, nom, quantité)
            ingredients_list = []
            for ingredient in craft_data['ingredients']:
                ingredients_list.append([
                    ingredient['ingredient_id'],
                    ingredient['ingredient_name'],
                    ingredient['quantity']
                ])
            
            # Nettoie le nom du métier (enlève "Niveau" s'il y en a)
            job_name = craft_data['job']
            if job_name and job_name.endswith('Niveau'):
                job_name = job_name.replace('Niveau', '').strip()
            
            craft_json[item_name] = {
                "job": job_name,
                "job_level": craft_data['job_level'],
                "ingredients": ingredients_list
            }
    
    # Sauvegarde le JSON
    json_file = "touch_database/data/craft_detailed.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(craft_json, f, ensure_ascii=False, indent=2)
    
    print(f"📄 JSON détaillé sauvegardé: {json_file}")
    print(f"📊 {len(craft_json)} recettes dans le JSON")
    
    return craft_json

def main():
    """Fonction principale pour extraire toutes les données de craft"""
    print("🚀 Début de l'extraction des données de craft...")
    
    # Crée le dossier de sortie
    os.makedirs("touch_database/data", exist_ok=True)
    
    all_crafts_data = []
    
    # Traite chaque catégorie
    for category in CATEGORIES:
        category_data = process_category_crafts(category)
        all_crafts_data.extend(category_data)
    
    print(f"\n📊 Total: {len(all_crafts_data)} items traités")
    
    # Compte les items avec et sans recette
    with_recipe = sum(1 for item in all_crafts_data if item['has_recipe'])
    without_recipe = len(all_crafts_data) - with_recipe
    
    print(f"🍳 Items avec recette: {with_recipe}")
    print(f"📦 Items sans recette: {without_recipe}")
    
    # Sauvegarde les données détaillées
    flattened_data = flatten_craft_data(all_crafts_data)
    df_detailed = pd.DataFrame(flattened_data)
    detailed_file = "touch_database/data/craft_detailed.csv"
    df_detailed.to_csv(detailed_file, index=False)
    print(f"📄 Données détaillées sauvegardées: {detailed_file}")
    
    # Sauvegarde le JSON détaillé
    save_craft_json(all_crafts_data)
    
    # Statistiques par métier
    jobs_stats = {}
    for item in all_crafts_data:
        if item['has_recipe'] and item['job']:
            job = item['job']
            if job not in jobs_stats:
                jobs_stats[job] = 0
            jobs_stats[job] += 1
    
    print(f"\n📈 Statistiques par métier:")
    for job, count in sorted(jobs_stats.items()):
        print(f"  {job}: {count} recettes")
    
    print(f"\n🎉 Extraction terminée!")

if __name__ == "__main__":
    main()
