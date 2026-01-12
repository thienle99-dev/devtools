import { useCallback, useRef } from 'react';
import { useTaskStore } from '../store/taskStore';
import { toast } from 'sonner';

export const useTask = (toolId: string) => {
    const { addTask, updateTask, completeTask, failTask, removeTask } = useTaskStore();
    const taskIdRef = useRef<string | null>(null);

    const runTask = useCallback(async <T>(
        name: string, 
        taskFn: (
            updateProgress: (progress: number, message?: string) => void,
            checkCancelled: () => boolean
        ) => Promise<T>,
        options: { cancelable?: boolean; removeOnComplete?: boolean; warningThresholdMs?: number } = {}
    ): Promise<T | undefined> => {
        const taskId = addTask({
            toolId,
            name,
            cancelable: options.cancelable,
        });
        taskIdRef.current = taskId;
        
        let cancelled = false;
        const warningThreshold = options.warningThresholdMs || 10000; // Default 10s

        // Register cancel handler
        if (options.cancelable) {
            updateTask(taskId, {
                onCancel: () => {
                    cancelled = true;
                    failTask(taskId, 'Cancelled by user');
                    taskIdRef.current = null;
                }
            });
        }

        // Performance warning timer
        const warningTimer = setTimeout(() => {
            if (!cancelled && taskIdRef.current === taskId) {
                toast.warning(`Task "${name}" is taking longer than expected.`, {
                    description: "It's still running in the background.",
                    duration: 5000,
                });
            }
        }, warningThreshold);

        try {
            const result = await taskFn((progress, message) => {
                if (!cancelled) {
                    updateTask(taskId, { progress, message });
                }
            }, () => cancelled);

            if (!cancelled) {
                completeTask(taskId);
                if (options.removeOnComplete) {
                    setTimeout(() => removeTask(taskId), 2000);
                }
                return result;
            }
        } catch (e) {
            if (!cancelled) {
                failTask(taskId, (e as Error).message);
            }
            throw e;
        } finally {
            clearTimeout(warningTimer);
            taskIdRef.current = null;
        }
    }, [addTask, toolId, updateTask, completeTask, failTask, removeTask]);

    return { runTask };
};
