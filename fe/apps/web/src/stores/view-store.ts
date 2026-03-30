import { create } from 'zustand';

export type TimelineMode = 'zoom' | 'week';
export type ZoomLevel = 'year' | 'month' | 'weeks';

interface ViewState {
  timelineMode: TimelineMode;
  zoomLevel: ZoomLevel;
  selectedYear: number | null;
  selectedMonth: number | null;

  setTimelineMode: (mode: TimelineMode) => void;
  drillIntoYear: (year: number) => void;
  drillIntoMonth: (month: number) => void;
  zoomOut: () => void;
  resetToYearView: () => void;
  hydrate: () => void;
}

const TIMELINE_MODE_KEY = 'timeflux_timeline_mode';
const VALID_MODES: TimelineMode[] = ['zoom', 'week'];

export const useViewStore = create<ViewState>((set) => ({
  timelineMode: 'zoom',
  zoomLevel: 'year',
  selectedYear: null,
  selectedMonth: null,

  setTimelineMode: (mode) => {
    localStorage.setItem(TIMELINE_MODE_KEY, mode);
    set({
      timelineMode: mode,
      zoomLevel: 'year',
      selectedYear: null,
      selectedMonth: null,
    });
  },

  drillIntoYear: (year) => {
    set({ zoomLevel: 'month', selectedYear: year, selectedMonth: null });
  },

  drillIntoMonth: (month) => {
    set({ zoomLevel: 'weeks', selectedMonth: month });
  },

  zoomOut: () => {
    set((state) => {
      if (state.zoomLevel === 'weeks') {
        return { zoomLevel: 'month', selectedMonth: null };
      }
      if (state.zoomLevel === 'month') {
        return { zoomLevel: 'year', selectedYear: null, selectedMonth: null };
      }
      return state;
    });
  },

  resetToYearView: () => {
    set({ zoomLevel: 'year', selectedYear: null, selectedMonth: null });
  },

  hydrate: () => {
    const stored = localStorage.getItem(TIMELINE_MODE_KEY) as string | null;
    // Backward compat: 'horizontal' → 'zoom'
    const migrated = stored === 'horizontal' ? 'zoom' : stored;
    set({
      timelineMode:
        migrated && VALID_MODES.includes(migrated as TimelineMode)
          ? (migrated as TimelineMode)
          : 'zoom',
      zoomLevel: 'year',
      selectedYear: null,
      selectedMonth: null,
    });
  },
}));
