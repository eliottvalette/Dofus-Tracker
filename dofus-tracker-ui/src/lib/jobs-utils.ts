export interface Job {
  job_id: number;
  job_name: string;
  job_slug: string;
  job_url: string;
  image_url: string;
  local_url: string;
}

export interface JobItemMapping {
  [jobName: string]: string[];
}

// Cache pour les données
let jobsCache: Job[] | null = null;
let jobsMapCache: JobItemMapping | null = null;

export async function loadJobs(): Promise<Job[]> {
  if (jobsCache) {
    return jobsCache;
  }

  try {
    const response = await fetch('/data/images.json');
    const imagesData = await response.json();
    
    const jobsImages = imagesData.jobs || {};
    
    const jobs: Job[] = Object.entries(jobsImages).map(([job_name, local_url], index) => ({
      job_id: index + 1, // ID généré pour compatibilité
      job_name,
      job_slug: job_name.toLowerCase().replace(/\s+/g, '-'),
      job_url: '', // URL vide par défaut
      image_url: '', // URL externe vide
      local_url: local_url as string
    }));
    
    // Trier par nom pour un meilleur UX
    jobs.sort((a, b) => a.job_name.localeCompare(b.job_name));
    
    jobsCache = jobs;
    return jobs;
  } catch (error) {
    console.error('Erreur lors du chargement des métiers:', error);
    return [];
  }
}

export async function loadJobsItemsMapping(): Promise<JobItemMapping> {
  if (jobsMapCache) {
    return jobsMapCache;
  }

  try {
    const response = await fetch('/data/jobs_map.json');
    const jobsMap: JobItemMapping = await response.json();
    
    jobsMapCache = jobsMap;
    return jobsMap;
  } catch (error) {
    console.error('Erreur lors du chargement du mapping métiers-items:', error);
    return {};
  }
}

export function getJobsForItem(itemName: string, jobsMap: JobItemMapping): string[] {
  const jobs: string[] = [];
  
  for (const [jobName, items] of Object.entries(jobsMap)) {
    if (items.includes(itemName)) {
      jobs.push(jobName);
    }
  }
  
  return jobs;
}

export function getItemsForJob(jobName: string, jobsMap: JobItemMapping): string[] {
  return jobsMap[jobName] || [];
}

export function getAllJobNames(jobsMap: JobItemMapping): string[] {
  return Object.keys(jobsMap).sort();
}

// Interface pour les items
export interface ItemDetail {
  category: string;
  nom: string;
  type: string;
  niveau: string;
  local_url: string;
}

// Cache pour les items
let itemsCache: ItemDetail[] | null = null;

export async function loadAllItemsFromJson(): Promise<ItemDetail[]> {
  if (itemsCache) {
    return itemsCache;
  }

  try {
    // Charger les données des items et des images en parallèle
    const [itemsResponse, imagesResponse] = await Promise.all([
      fetch('/data/items_details.json'),
      fetch('/data/images.json')
    ]);
    
    const itemsData = await itemsResponse.json();
    const imagesData = await imagesResponse.json();
    
    // Convertir la structure { "item_name": details } en array plat
    const items: ItemDetail[] = [];
    for (const [itemName, itemDetails] of Object.entries(itemsData)) {
      const details = itemDetails as { category: string; type: string; level: string };
      
      // Chercher l'URL de l'image dans images.json
      let localUrl = '';
      for (const category of Object.keys(imagesData)) {
        if (category !== 'jobs' && imagesData[category][itemName]) {
          localUrl = imagesData[category][itemName];
          break;
        }
      }
      
      items.push({
        category: details.category,
        nom: itemName,
        type: details.type,
        niveau: details.level,
        local_url: localUrl
      });
    }
    
    // Trier les items par niveau croissant
    const sortedItems = items.sort((a, b) => {
      const niveauA = parseInt(a.niveau.replace('Niv. ', '')) || 0;
      const niveauB = parseInt(b.niveau.replace('Niv. ', '')) || 0;
      return niveauA - niveauB;
    });
    
    itemsCache = sortedItems;
    return sortedItems;
  } catch (error) {
    console.error('Erreur lors du chargement des items:', error);
    return [];
  }
}
