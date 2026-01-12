import { useEffect, useMemo } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
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
import { cn } from '../../utils/cn';
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
                dragHandle: '.custom-drag-handle', // Optional
            };
        });
    }, [workflow, stepResults]);

    // Calculate Edges from linear sequence (for now)
    // TODO: In a real graph builder, edges would be stored separately or derived logic would be smarter.
    // For now, we visualize the array order as edges.
    const initialEdges: Edge[] = useMemo(() => {
        const edges: Edge[] = [];
        for (let i = 0; i < steps.length - 1; i++) {
            edges.push({
                id: `e-${steps[i].id}-${steps[i+1].id}`,
                source: steps[i].id,
                target: steps[i+1].id,
                animated: true,
                style: { stroke: 'var(--color-border)' },
            });
        }
        return edges;
    }, [steps]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync external changes (e.g. from list view add/remove) to local state
    // Note: this is a bit tricky with ReactFlow internal state. 
    // Usually you want one source of truth.
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);
    
    // Persist node movements
    const handleNodeDragStop = (_: any, node: Node) => {
        // Save new position to store
        updateStep(workflowId, node.id, {
            metadata: { ...node.data.metadata, position: node.position }
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
                nodeTypes={nodeTypes}
                onNodeDragStop={handleNodeDragStop}
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
