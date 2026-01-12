import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkflowStep {
    id: string;
    toolId: string;
    options: Record<string, any>;
    label?: string;
    disabled?: boolean;
    metadata?: Record<string, any>; // For visual builder (position, etc)
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    createdAt: number;
    updatedAt: number;
    isFavorite?: boolean;
}

interface WorkflowStore {
    workflows: Workflow[];
    activeWorkflowId: string | null;

    // Actions
    addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
    deleteWorkflow: (id: string) => void;
    duplicateWorkflow: (id: string) => string;
    toggleFavorite: (id: string) => void;
    setActiveWorkflow: (id: string | null) => void;

    // Step management for active workflow
    addStep: (workflowId: string, step: Omit<WorkflowStep, 'id'>) => void;
    updateStep: (workflowId: string, stepId: string, step: Partial<WorkflowStep>) => void;
    removeStep: (workflowId: string, stepId: string) => void;
    reorderSteps: (workflowId: string, steps: WorkflowStep[]) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
    persist<WorkflowStore>(
        (set) => ({
            workflows: [],
            activeWorkflowId: null,

            addWorkflow: (w) => {
                const id = crypto.randomUUID();
                const now = Date.now();
                const newWorkflow: Workflow = {
                    ...w,
                    id,
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({
                    workflows: [...state.workflows, newWorkflow]
                }));
                return id;
            },

            updateWorkflow: (id, w) => set((state) => ({
                workflows: state.workflows.map((wf) =>
                    wf.id === id ? { ...wf, ...w, updatedAt: Date.now() } : wf
                )
            })),

            deleteWorkflow: (id) => set((state) => ({
                workflows: state.workflows.filter((wf) => wf.id !== id),
                activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId
            })),

            duplicateWorkflow: (id) => {
                let newId = crypto.randomUUID();
                set((state) => {
                    const original = state.workflows.find(w => w.id === id);
                    if (!original) return {};
                    const newWorkflow: Workflow = {
                        ...original,
                        id: newId,
                        name: `${original.name} (Copy)`,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        // Regenerate step IDs to avoid conflicts
                        steps: original.steps.map(s => ({ ...s, id: crypto.randomUUID() }))
                    };
                    return { workflows: [...state.workflows, newWorkflow] };
                });
                return newId;
            },

            toggleFavorite: (id) => set((state) => ({
                workflows: state.workflows.map((wf) =>
                    wf.id === id ? { ...wf, isFavorite: !wf.isFavorite, updatedAt: Date.now() } : wf
                )
            })),

            setActiveWorkflow: (id) => set({ activeWorkflowId: id }),

            addStep: (workflowId, step) => set((state) => ({
                workflows: state.workflows.map((wf) => {
                    if (wf.id !== workflowId) return wf;
                    const newStep: WorkflowStep = {
                        ...step,
                        id: crypto.randomUUID()
                    };
                    return {
                        ...wf,
                        steps: [...wf.steps, newStep],
                        updatedAt: Date.now()
                    };
                })
            })),

            updateStep: (workflowId, stepId, step) => set((state) => ({
                workflows: state.workflows.map((wf) => {
                    if (wf.id !== workflowId) return wf;
                    return {
                        ...wf,
                        steps: wf.steps.map((s) => s.id === stepId ? { ...s, ...step } : s),
                        updatedAt: Date.now()
                    };
                })
            })),

            removeStep: (workflowId, stepId) => set((state) => ({
                workflows: state.workflows.map((wf) => {
                    if (wf.id !== workflowId) return wf;
                    return {
                        ...wf,
                        steps: wf.steps.filter((s) => s.id !== stepId),
                        updatedAt: Date.now()
                    };
                })
            })),

            reorderSteps: (workflowId, steps) => set((state) => ({
                workflows: state.workflows.map((wf) =>
                    wf.id === workflowId ? { ...wf, steps, updatedAt: Date.now() } : wf
                )
            })),
        }),
        {
            name: 'antigravity-workflows',
        }
    ) as unknown as StateCreator<WorkflowStore>
);
