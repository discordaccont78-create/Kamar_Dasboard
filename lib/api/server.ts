
import { AppSettings, Segment, Schedule, GroupConfig } from '../../types/index';

const API_BASE = '/api';

export interface SystemConfig {
  settings: AppSettings;
  groups: GroupConfig[];
  segments: Segment[];
  schedules: Schedule[];
}

// --- FETCHING (Keep monolithic fetch for startup speed) ---
export const fetchSystemConfig = async (): Promise<SystemConfig | null> => {
  try {
    const response = await fetch(`${API_BASE}/config`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000) // Increased timeout for initial load
    });
    if (!response.ok) throw new Error("Server response not OK");
    return await response.json();
  } catch (e) {
    console.warn("[Sync] Failed to fetch config from server:", e);
    return null;
  }
};

// --- MODULAR SAVING (Granular Updates) ---

export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
  try {
    // Lightweight endpoint for frequent UI changes
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return response.ok;
  } catch (e) {
    console.error("[Sync] Settings save failed:", e);
    return false;
  }
};

export const saveSegments = async (payload: { segments: Segment[], groups: GroupConfig[] }): Promise<boolean> => {
  try {
    // Heavier payload, only called when structure changes
    const response = await fetch(`${API_BASE}/segments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (e) {
    console.error("[Sync] Segments save failed:", e);
    return false;
  }
};

export const saveSchedules = async (schedules: Schedule[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedules),
    });
    return response.ok;
  } catch (e) {
    console.error("[Sync] Schedules save failed:", e);
    return false;
  }
};
