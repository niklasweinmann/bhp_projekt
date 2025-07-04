import type { PlacedPlant } from '../components/PlantMap';

const STORAGE_KEY = 'permakultur_designs';

export function saveDesign(design: PlacedPlant[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
}

export function loadDesign(): PlacedPlant[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}
