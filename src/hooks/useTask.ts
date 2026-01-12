import { useCallback, useRef } from 'react';
import { useTaskStore } from '../store/taskStore';

export const useTask = (toolId: string) => {
    const { addTask, updateTask, completeTask, failTask, removeTask } = useTaskStore();
    const taskIdRef = useRef<string | null>(null);

    const runTask = useCallback(async <T>(
        name: string, 
        taskFn: (
            updateProgress: (progress: number, message?: string) => void,
            checkCancelled: () => boolean
        ) => Promise<T>,
        options: { cancelable?: boolean; removeOnComplete?: boolean } = {}
    ): Promise<T | undefined> => {
        const taskId = addTask({
            toolId,
            name,
            cancelable: options.cancelable,
        });
        taskIdRef.current = taskId;
        
        let cancelled = false;
        
        // Register cancel handler in the store item itself so the UI can call it
        if (options.cancelable) {
            updateTask(taskId, {
                onCancel: () => {
                    cancelled = true;
                    failTask(taskId, 'Cancelled by user');
                    taskIdRef.current = null;
                }
            });
        }

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
            taskIdRef.current = null;
        }
    }, [addTask, toolId, updateTask, completeTask, failTask, removeTask]);

    return { runTask };
};
