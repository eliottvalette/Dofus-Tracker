import pandas as pd
import requests
import os
from urllib.parse import urlparse
import time
from pathlib import Path

def download_image(url, local_path):
    """Télécharge une image depuis une URL et la sauvegarde localement"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Créer le dossier parent s'il n'existe pas
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        # Sauvegarder l'image
        with open(local_path, 'wb') as f:
            f.write(response.content)
        
        return True
    except Exception as e:
        print(f"Erreur lors du téléchargement de {url}: {e}")
        return False

def get_filename_from_url(url):
    """Extrait le nom de fichier depuis l'URL"""
    parsed_url = urlparse(url)
    filename = os.path.basename(parsed_url.path)
    return filename

def process_csv_with_images():
    """Traite le CSV en téléchargeant les images et ajoutant la colonne local_url"""
    
    # Lire le CSV
    csv_path = "database/data/merged.csv"
    df = pd.read_csv(csv_path)
    
    # Créer le dossier pour les images
    images_dir = "database/images"
    os.makedirs(images_dir, exist_ok=True)
    
    # Ajouter la colonne local_url
    df['local_url'] = ''
    
    total_rows = len(df)
    successful_downloads = 0
    
    print(f"Début du téléchargement de {total_rows} images...")
    
    for index, row in df.iterrows():
        original_url = row['original_image_url']
        
        if pd.isna(original_url) or original_url == '':
            continue
            
        # Générer le nom de fichier local
        filename = get_filename_from_url(original_url)
        local_path = os.path.join(images_dir, filename)
        local_url = f"/images/{filename}"  # URL relative pour l'interface web
        
        # Télécharger l'image si elle n'existe pas déjà
        if not os.path.exists(local_path):
            if download_image(original_url, local_path):
                successful_downloads += 1
                print(f"✓ Téléchargé: {filename} ({index + 1}/{total_rows})")
            else:
                print(f"✗ Échec: {filename} ({index + 1}/{total_rows})")
        else:
            successful_downloads += 1
            print(f"✓ Déjà existant: {filename} ({index + 1}/{total_rows})")
        
        # Mettre à jour la colonne local_url
        df.at[index, 'local_url'] = local_url
    
    # Sauvegarder le CSV mis à jour
    output_path = "database/data/merged_with_local_images.csv"
    df.to_csv(output_path, index=False)
    
    print(f"\nTraitement terminé!")
    print(f"Images téléchargées avec succès: {successful_downloads}/{total_rows}")
    print(f"CSV mis à jour sauvegardé dans: {output_path}")
    
    return df

def process_jobs_images():
    """Traite le CSV des métiers en téléchargeant les images et ajoutant la colonne local_url"""
    csv_path = "database/data/jobs_list.csv"
    df = pd.read_csv(csv_path)
    
    # Créer le dossier pour les images
    images_dir = "database/images/jobs"
    os.makedirs(images_dir, exist_ok=True)
    
    # Ajouter la colonne local_url
    df['local_url'] = ''
    
    total_rows = len(df)
    successful_downloads = 0
    
    print(f"Début du téléchargement de {total_rows} images...")
    
    for index, row in df.iterrows():
        original_url = row['image_url']
            
        # Générer le nom de fichier local
        filename = get_filename_from_url(original_url)
        local_path = os.path.join(images_dir, filename)
        local_url = f"/images/jobs/{filename}"  # URL relative pour l'interface web
        
        # Télécharger l'image si elle n'existe pas déjà
        if not os.path.exists(local_path):
            if download_image(original_url, local_path):
                successful_downloads += 1
                print(f"✓ Téléchargé: {filename} ({index + 1}/{total_rows})")
            else:
                print(f"✗ Échec: {filename} ({index + 1}/{total_rows})")
        else:
            successful_downloads += 1
            print(f"✓ Déjà existant: {filename} ({index + 1}/{total_rows})")
        
        # Mettre à jour la colonne local_url
        df.at[index, 'local_url'] = local_url
    
    # Sauvegarder le CSV mis à jour
    output_path = "database/data/jobs_list_with_local_images.csv"
    df.to_csv(output_path, index=False)
    
    print(f"\nTraitement terminé!")
    print(f"Images téléchargées avec succès: {successful_downloads}/{total_rows}")
    print(f"CSV mis à jour sauvegardé dans: {output_path}")

if __name__ == "__main__":
    # process_csv_with_images() 
    process_jobs_images()