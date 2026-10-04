import { supabase } from '@/integrations/supabase/client';

export interface PirateIdentity {
  id: number;
  name: string;
  role: string;
  bounty: string;
  imagePath: string;
  fetchedAt: string;
}

const STORAGE_KEY = 'pirateone_guest_identity';

// Get stored identity from localStorage
export function getStoredIdentity(): PirateIdentity | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading stored identity:', error);
  }
  return null;
}

// Store identity in localStorage
function storeIdentity(identity: PirateIdentity): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch (error) {
    console.error('Error storing identity:', error);
  }
}

// Fetch random pirate from edge function (bypasses CORS)
export async function fetchRandomPirate(): Promise<PirateIdentity> {
  const { data, error } = await supabase.functions.invoke('pirate-identity');
  
  if (error) {
    console.error('Edge function error:', error);
    throw new Error('Failed to fetch pirate identity');
  }
  
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    bounty: data.bounty,
    imagePath: data.imagePath,
    fetchedAt: new Date().toISOString(),
  };
}

// Get existing identity or fetch new one
export async function getGuestIdentity(): Promise<PirateIdentity> {
  // Check for stored identity first
  const stored = getStoredIdentity();
  if (stored) {
    return stored;
  }
  
  // Fetch new identity from edge function
  const identity = await fetchRandomPirate();
  storeIdentity(identity);
  return identity;
}

// Force regenerate identity
export async function regenerateIdentity(): Promise<PirateIdentity> {
  const identity = await fetchRandomPirate();
  storeIdentity(identity);
  return identity;
}

// Clear identity from storage
export function clearIdentity(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing identity:', error);
  }
}

// Get initials from pirate name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
