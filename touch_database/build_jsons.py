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
        item_details = items_df[items_df['nom'] == item_name]
        items_details_data[item_name] = item_details.to_dict(orient='records')
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

if __name__ == "__main__":
    items_details_json()
    image_json()
    jobs_json()