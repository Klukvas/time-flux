import { create } from 'zustand';

export type TimelineMode = 'horizontal' | 'week';

interface ViewState {
  timelineMode: TimelineMode;
  setTimelineMode: (mode: TimelineMode) => void;
  hydrate: () => void;
}

const TIMELINE_MODE_KEY = 'lifespan_timeline_mode';
const VALID_MODES: TimelineMode[] = ['horizontal', 'week'];

export const useViewStore = create<ViewState>((set) => ({
  timelineMode: 'week',

  setTimelineMode: (mode) => {
    localStorage.setItem(TIMELINE_MODE_KEY, mode);
    set({ timelineMode: mode });
  },

  hydrate: () => {
    const stored = localStorage.getItem(TIMELINE_MODE_KEY) as string | null;
    set({
      timelineMode: stored && VALID_MODES.includes(stored as TimelineMode) ? (stored as TimelineMode) : 'week',
    });
  },
}));
