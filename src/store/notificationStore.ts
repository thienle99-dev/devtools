import { create } from 'zustand';

export interface AppNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    description?: string;
    timestamp: number;
    read: boolean;
}

interface NotificationStore {
    notifications: AppNotification[];
    updateAvailable: boolean;
    latestVersion?: string;
    
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    setUpdateAvailable: (available: boolean, version?: string) => void;
    getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    updateAvailable: true, // Mock an update for demo purposes
    latestVersion: 'v0.2.1-stable',

    addNotification: (notification) => set((state) => ({
        notifications: [
            {
                ...notification,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                read: false,
            },
            ...state.notifications,
        ].slice(0, 50), // Keep last 50 notifications
    })),

    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
        ),
    })),

    clearAll: () => set({ notifications: [] }),

    setUpdateAvailable: (available, version) => set({ 
        updateAvailable: available, 
        latestVersion: version 
    }),

    getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
