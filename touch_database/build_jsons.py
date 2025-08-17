import pandas as pd
import json
import os

def items_details_json():
    """Construit le fichier JSON de mapping
    {
        "item_name": {
            "id": "item_id",
            "name": "item_name",
            "category": "item_category",
            "type": "item_type",
            "level": "item_level"
        }
    }
    """
    # Crée le dossier pour le JSON
    os.makedirs('touch_database/data/json', exist_ok=True)
    
    items_df = pd.read_csv('touch_database/data/merged_with_local_images.csv')
    items_df = items_df.drop(columns=['original_image_url'])
    unique_item_names = items_df['nom'].unique()
    items_details_data = {}
    for item_name in unique_item_names:
        item_details = items_df[items_df['nom'] == item_name].iloc[0]
        # Compose a dict with the relevant fields
        items_details_data[item_name] = {
            "id": item_details["local_url"].split('.')[0].split('/')[-1],
            "name": item_details["nom"],
            "category": item_details["category"],
            "type": item_details["type"],
            "level": item_details["niveau"]
        }
    with open(f'touch_database/data/json/items_details.json', 'w', encoding='utf-8') as f:
        json.dump(items_details_data, f, ensure_ascii=False, indent=4)
    print("Items details JSON built")


def image_json():
    """Construit le fichier JSON de mapping"""
    # Crée le dossier pour le JSON
    os.makedirs('touch_database/data/json', exist_ok=True)
    
    # Récupère les données des items
    items_df = pd.read_csv('touch_database/data/merged_with_local_images.csv')
    categories = items_df['category'].unique()
    full_json_data = {}
    for category in categories:
        category_items = items_df[items_df['category'] == category]
        json_data = {}
        for _, item in category_items.iterrows():
            json_data[item['nom']] = item['local_url']
        full_json_data[category] = json_data

    # Ajouter les images des métiers
    jobs_df = pd.read_csv('touch_database/data/jobs_list_with_local_images.csv')
    jobs_mapped_data = {}
    for _, job_row in jobs_df.iterrows():
        jobs_mapped_data[job_row['job_name']] = job_row['local_url']

    full_json_data['jobs'] = jobs_mapped_data




    with open(f'touch_database/data/json/images.json', 'w', encoding='utf-8') as f:
        json.dump(full_json_data, f, ensure_ascii=False, indent=4)

    print("Images JSON built")

def jobs_json():
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

    print("Jobs JSON built")

def build_craft_json():
    """Construit le fichier JSON de craft"""
    # Récupère les données des craft
    craft_df = pd.read_csv('touch_database/data/craft_detailed.csv')
    
    # Créer le dictionnaire final
    craft_data = {}
    
    # Grouper par item_name
    for item_name in craft_df['item_name'].unique():
        item_data = craft_df[craft_df['item_name'] == item_name]
        
        # Prendre les données de base (même pour tous les ingrédients)
        first_row = item_data.iloc[0]
        
        has_recipe = bool(first_row['has_recipe'])
        has_job = not pd.isna(first_row['job'])
        
        if has_recipe and has_job:
            craft_data[item_name] = {
                "category": first_row['category'],
                "has_recipe": has_recipe,
                "job": first_row['job'],
                "job_level": float(first_row['job_level']),
                "ingredient_names": item_data['ingredient_name'].dropna().tolist(),
                "ingredient_ids": [int(id) for id in item_data['ingredient_id'].dropna().tolist()],
                "quantities": [int(qty) for qty in item_data['quantity'].dropna().tolist()]
            }
        else:
            craft_data[item_name] = {
                "category": first_row['category'],
                "has_recipe": has_recipe,
                "job": None,
                "job_level": None,
                "ingredient_names": [],
                "ingredient_ids": [],
                "quantities": []
            }
    
    # Sauvegarder le JSON
    with open('touch_database/data/json/craft.json', 'w', encoding='utf-8') as f:
        json.dump(craft_data, f, ensure_ascii=False, indent=4)
    
    print("Craft JSON built")

if __name__ == "__main__":
    items_details_json()
    image_json()
    jobs_json()
    build_craft_json()