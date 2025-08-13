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
    const response = await fetch('/data/jobs_list_with_local_images.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n').slice(1); // Skip header
    
    const jobs: Job[] = lines
      .filter(line => line.trim())
      .map(line => {
        const [job_id, job_name, job_slug, job_url, image_url, local_url] = line.split(',').map(field => 
          field.replace(/^"|"$/g, '')
        );
        return {
          job_id: parseInt(job_id),
          job_name,
          job_slug,
          job_url,
          image_url,
          local_url
        };
      });
    
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
