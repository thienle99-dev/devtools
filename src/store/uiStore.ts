import { create } from 'zustand';

interface UIStore {
    isSidebarOpen: boolean;
    activeToolId: string | null;
    searchQuery: string;
    commandPaletteOpen: boolean;

    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    setActiveToolId: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    setCommandPaletteOpen: (open: boolean) => void;
    toggleCommandPalette: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isSidebarOpen: true,
    activeToolId: null,
    searchQuery: '',
    commandPaletteOpen: false,

    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setActiveToolId: (id) => set({ activeToolId: id }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
}));
