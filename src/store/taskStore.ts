import { create } from 'zustand';

export interface Task {
    id: string;
    toolId: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    message?: string;
    cancelable?: boolean;
    onCancel?: () => void;
    startTime: number;
}

interface TaskStore {
    tasks: Task[];
    addTask: (task: Omit<Task, 'id' | 'progress' | 'status' | 'startTime'>) => string;
    updateTask: (id: string, updates: Partial<Task>) => void;
    completeTask: (id: string) => void;
    failTask: (id: string, error: string) => void;
    removeTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
    tasks: [],
    addTask: (task) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            tasks: [...state.tasks, {
                ...task,
                id,
                status: 'pending',
                progress: 0,
                startTime: Date.now()
            }]
        }));
        return id;
    },
    updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    completeTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'completed', progress: 100 } : t)
    })),
    failTask: (id, error) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'error', message: error } : t)
    })),
    removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
    })),
}));
