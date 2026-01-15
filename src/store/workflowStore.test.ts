import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkflowStore } from './workflowStore';

// Mock crypto.randomUUID if not present
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    Object.defineProperty(global, 'crypto', {
        value: {
            randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9)
        }
    });
}

describe('Workflow Store', () => {
    beforeEach(() => {
        // Clear workflows before each test
        const state = useWorkflowStore.getState();
        state.workflows.forEach(w => state.deleteWorkflow(w.id));
    });

    it('should add a workflow', () => {
        const id = useWorkflowStore.getState().addWorkflow({
            name: 'Test Workflow',
            description: 'A test description',
            steps: []
        });

        expect(id).toBeDefined();
        expect(useWorkflowStore.getState().workflows).toHaveLength(1);
        expect(useWorkflowStore.getState().workflows[0].name).toBe('Test Workflow');
    });

    it('should update a workflow', () => {
        const id = useWorkflowStore.getState().addWorkflow({
            name: 'Original',
            steps: []
        });

        useWorkflowStore.getState().updateWorkflow(id, { name: 'Updated' });
        expect(useWorkflowStore.getState().workflows[0].name).toBe('Updated');
    });

    it('should add steps to a workflow', () => {
        const id = useWorkflowStore.getState().addWorkflow({
            name: 'Workflow with steps',
            steps: []
        });

        useWorkflowStore.getState().addStep(id, {
            toolId: 'json-viewer',
            options: { theme: 'dark' }
        });

        expect(useWorkflowStore.getState().workflows[0].steps).toHaveLength(1);
        expect(useWorkflowStore.getState().workflows[0].steps[0].toolId).toBe('json-viewer');
    });

    it('should duplicate a workflow', () => {
        const id = useWorkflowStore.getState().addWorkflow({
            name: 'Original',
            steps: [{ id: 's1', toolId: 't1', options: {} }]
        });

        const newId = useWorkflowStore.getState().duplicateWorkflow(id);
        const workflows = useWorkflowStore.getState().workflows;
        
        expect(workflows).toHaveLength(2);
        expect(newId).not.toBe(id);
        const duplicate = workflows.find(w => w.id === newId);
        expect(duplicate?.name).toBe('Original (Copy)');
        expect(duplicate?.steps[0].id).not.toBe('s1');
    });

    it('should remove steps', () => {
        const id = useWorkflowStore.getState().addWorkflow({ name: 'W', steps: [] });
        useWorkflowStore.getState().addStep(id, { toolId: 't1', options: {} });
        const stepId = useWorkflowStore.getState().workflows[0].steps[0].id;
        
        useWorkflowStore.getState().removeStep(id, stepId);
        expect(useWorkflowStore.getState().workflows[0].steps).toHaveLength(0);
    });
});
