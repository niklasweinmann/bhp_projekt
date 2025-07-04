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

// Hilfsfunktion, um Token zu holen
function getToken() {
  return localStorage.getItem('auth_token');
}

export async function saveDesignServer(name: string, design: any) {
  const token = getToken();
  await fetch('http://localhost:9000/api/designs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    },
    body: JSON.stringify({ name, design })
  });
}

export async function loadDesignServer(name: string) {
  const token = getToken();
  const res = await fetch(`http://localhost:9000/api/designs/${name}`, {
    headers: token ? { 'Authorization': 'Bearer ' + token } : undefined
  });
  if (!res.ok) throw new Error('Design nicht gefunden');
  return await res.json();
}

export async function listDesignsServer() {
  const token = getToken();
  const res = await fetch('http://localhost:9000/api/designs', {
    headers: token ? { 'Authorization': 'Bearer ' + token } : undefined
  });
  return (await res.json()).designs as string[];
}
