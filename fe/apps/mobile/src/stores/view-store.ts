import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type TimelineMode = 'horizontal' | 'week';

interface ViewState {
  timelineMode: TimelineMode;
  setTimelineMode: (mode: TimelineMode) => void;
  hydrate: () => Promise<void>;
}

const TIMELINE_MODE_KEY = 'lifespan_timeline_mode';
const VALID_MODES: TimelineMode[] = ['horizontal', 'week'];

export const useViewStore = create<ViewState>((set) => ({
  timelineMode: 'horizontal',

  setTimelineMode: (mode) => {
    SecureStore.setItemAsync(TIMELINE_MODE_KEY, mode);
    set({ timelineMode: mode });
  },

  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(TIMELINE_MODE_KEY);
      if (stored && VALID_MODES.includes(stored as TimelineMode)) {
        set({ timelineMode: stored as TimelineMode });
      }
    } catch {
      // ignore
    }
  },
}));
