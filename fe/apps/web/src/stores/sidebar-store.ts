import { create } from 'zustand';

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'lifespan_sidebar_collapsed';

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  mobileOpen: false,

  setMobileOpen: (open: boolean) => {
    set({ mobileOpen: open });
  },

  toggleCollapsed: () => {
    set((state) => {
      const next = !state.collapsed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { collapsed: next };
    });
  },

  hydrate: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      try {
        set({ collapsed: JSON.parse(stored) });
      } catch {
        // ignore corrupt value
      }
    }
  },
}));
