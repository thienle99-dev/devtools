import { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    MarkerType,
    type Edge,
    type Node,
    useNodesState,
    useEdgesState,
    Panel,
    Handle,
    Position,
    type NodeProps,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../../store/workflowStore';
import { TOOLS } from '../registry';
import { cn } from '@utils/cn';
import { Package, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// --- Custom Node Component ---
const ToolNode = ({ data, selected }: NodeProps) => {
    const { tool, label, status } = data;
    const Icon = tool?.icon || Package;
    
    return (
        <div className={cn(
            "min-w-[200px] bg-[var(--color-glass-panel)] backdrop-blur-xl border-2 rounded-xl transition-all shadow-lg",
            selected ? "border-indigo-500 shadow-indigo-500/20" : "border-border-glass hover:border-indigo-500/30",
            status === 'running' && "border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
            status === 'error' && "border-rose-500/50 bg-rose-500/5",
            status === 'success' && "border-emerald-500/50"
        )}>
            <Handle type="target" position={Position.Top} className="!bg-foreground-muted w-3 h-3" />
            
            <div className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-indigo-500/10 shrink-0", tool?.color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{label || tool?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-foreground-muted truncate">{tool?.description}</div>
                </div>
                {status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
                {status === 'success' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                {status === 'error' && <AlertCircle className="w-3 h-3 text-rose-400" />}
            </div>

            {/* Input/Output Badges if known */}
            <div className="px-3 pb-2 flex justify-between text-[8px] font-mono text-foreground-muted uppercase tracking-wider">
                <span>{tool?.inputTypes?.[0] || 'Any'}</span>
                <span>{tool?.outputTypes?.[0] || 'Any'}</span>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-foreground-muted w-3 h-3" />
        </div>
    );
};

const nodeTypes = {
    tool: ToolNode,
};

interface VisualPipelineProps {
    workflowId: string;
    stepResults?: Record<string, any>;
}

const VisualPipelineCanvas = ({ workflowId, stepResults = {} }: VisualPipelineProps) => {
    const { workflows, updateStep } = useWorkflowStore();
    
    const workflow = useMemo(() => 
        workflows.find(w => w.id === workflowId), 
    [workflows, workflowId]);

    const steps = workflow?.steps || [];

    // Calculate Nodes from Steps
    const initialNodes: Node[] = useMemo(() => {
        if (!workflow) return [];
        return workflow.steps.map((step, index) => {
            const tool = TOOLS.find(t => t.id === step.toolId);
            return {
                id: step.id,
                type: 'tool',
                position: step.metadata?.position || { x: 250, y: index * 150 + 50 },
                data: {
                    tool,
                    label: step.label,
                    options: step.options,
                    status: stepResults[step.id]?.status
                },
                dragHandle: '.custom-drag-handle',
            };
        });
    }, [workflow, stepResults]);

    const initialEdges: Edge[] = useMemo(() => {
        const edges: Edge[] = [];
        for (let i = 0; i < steps.length - 1; i++) {
            edges.push({
                id: `e-${steps[i].id}-${steps[i+1].id}`,
                source: steps[i].id,
                target: steps[i+1].id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: 'var(--color-indigo-500)', strokeWidth: 2, opacity: 0.5 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: 'var(--color-indigo-500)',
                },
            });
        }
        return edges;
    }, [steps]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync external changes
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);
    
    // Persist node movements
    const handleNodeDragStop = (_: any, node: Node) => {
        updateStep(workflowId, node.id, {
            metadata: { ...node.data.metadata, position: node.position }
        });
    };

    const onConnect = (params: any) => {
        const { source, target } = params;
        if (!workflow || source === target) return;

        const sourceIndex = workflow.steps.findIndex(s => s.id === source);
        const targetIndex = workflow.steps.findIndex(s => s.id === target);

        if (sourceIndex === -1 || targetIndex === -1) return;

        // Reorder: Move target to immediately follow source
        const newSteps = [...workflow.steps];
        const [movedStep] = newSteps.splice(targetIndex, 1);
        
        // Actually, since we spliced out, let's just find the new index of source
        const newSourceIndex = newSteps.findIndex(s => s.id === source);
        newSteps.splice(newSourceIndex + 1, 0, movedStep);
        
        useWorkflowStore.getState().reorderSteps(workflowId, newSteps);
    };

    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();

        const toolId = event.dataTransfer.getData('application/reactflow');
        if (!toolId || !reactFlowInstance) return;

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        // Add step with this position
        useWorkflowStore.getState().addStep(workflowId, {
            toolId,
            options: {},
            label: undefined,
            metadata: { position }
        });
    };

    if (!workflow) return <div className="p-8 text-center text-foreground-muted">Workflow not found</div>;

    return (
        <div className="w-full h-full min-h-[500px] bg-black/5 rounded-xl border border-border-glass overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onNodeDragStop={handleNodeDragStop}
                onInit={setReactFlowInstance}
                onDragOver={onDragOver}
                onDrop={onDrop}
                fitView
                className="bg-dots-pattern"
            >
                <Background color="#6366f1" gap={20} size={1} variant={BackgroundVariant.Dots} className="opacity-5" />
                <Controls className="bg-[var(--color-glass-panel)] border border-border-glass rounded-lg shadow-xl" />
                <MiniMap 
                    nodeStrokeColor="#6366f1"
                    nodeColor="#1e1e2e"
                    maskColor="rgba(0, 0, 0, 0.2)"
                    className="bg-[var(--color-glass-panel)] border border-border-glass rounded-lg shadow-xl" 
                />
                
                <Panel position="top-right" className="bg-[var(--color-glass-panel)] p-2 rounded-lg border border-border-glass font-mono text-xs text-foreground-muted">
                    Visual Editor (Beta)
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default function VisualPipelineDesignerWrapper(props: VisualPipelineProps) {
    return (
        <ReactFlowProvider>
            <VisualPipelineCanvas {...props} />
        </ReactFlowProvider>
    );
}
