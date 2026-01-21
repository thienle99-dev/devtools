import React, { useEffect, useState, useCallback } from 'react';
import { 
    v1 as uuidv1, 
    v3 as uuidv3,
    v4 as uuidv4, 
    v5 as uuidv5, 
    v6 as uuidv6,
    v7 as uuidv7,
    validate as uuidValidate, 
    version as uuidVersion 
} from 'uuid';
import { ulid, decodeTime } from 'ulid';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Checkbox } from '@components/ui/Checkbox';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { 
    Copy, Check, RefreshCw, Fingerprint, Clock, Shuffle, Hash, 
    CheckCircle2, XCircle, Info, Sparkles, Calendar, ArrowUpDown,
    Zap, Shield, Server
} from 'lucide-react';
import { cn } from '@utils/cn';
import { toast } from 'sonner';

const TOOL_ID = 'uuid-generator';

// ID type configurations - All UUID versions + ULID
const ID_TYPES = [
    { 
        id: 'v7', 
        name: 'UUID v7', 
        subtitle: 'Unix Time',
        icon: Zap,
        color: 'text-rose-400', 
        bgColor: 'bg-rose-500/10', 
        borderColor: 'border-rose-500/20',
        description: 'Modern sortable UUID with Unix timestamp. Best for databases.',
        bits: 128,
        supportsHyphens: true,
        hasTimestamp: true,
        recommended: true
    },
    { 
        id: 'v4', 
        name: 'UUID v4', 
        subtitle: 'Random',
        icon: Shuffle,
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-500/10', 
        borderColor: 'border-emerald-500/20',
        description: 'Cryptographically random. Most common choice.',
        bits: 122,
        supportsHyphens: true,
        hasTimestamp: false,
        recommended: true
    },
    { 
        id: 'ulid', 
        name: 'ULID', 
        subtitle: 'Sortable',
        icon: ArrowUpDown,
        color: 'text-amber-400', 
        bgColor: 'bg-amber-500/10', 
        borderColor: 'border-amber-500/20',
        description: 'Lexicographically sortable, URL-safe, Crockford Base32.',
        bits: 128,
        supportsHyphens: false,
        hasTimestamp: true,
        recommended: false
    },
    { 
        id: 'v6', 
        name: 'UUID v6', 
        subtitle: 'Reordered Time',
        icon: Clock,
        color: 'text-sky-400', 
        bgColor: 'bg-sky-500/10', 
        borderColor: 'border-sky-500/20',
        description: 'Like v1 but sortable. Time bits reordered.',
        bits: 128,
        supportsHyphens: true,
        hasTimestamp: true,
        recommended: false
    },
    { 
        id: 'v1', 
        name: 'UUID v1', 
        subtitle: 'Time + MAC',
        icon: Server,
        color: 'text-cyan-400', 
        bgColor: 'bg-cyan-500/10', 
        borderColor: 'border-cyan-500/20',
        description: 'Based on timestamp and MAC address. Legacy.',
        bits: 60,
        supportsHyphens: true,
        hasTimestamp: true,
        recommended: false
    },
    { 
        id: 'v5', 
        name: 'UUID v5', 
        subtitle: 'SHA-1 Name',
        icon: Shield,
        color: 'text-violet-400', 
        bgColor: 'bg-violet-500/10', 
        borderColor: 'border-violet-500/20',
        description: 'SHA-1 hash of namespace + name. Deterministic.',
        bits: 122,
        supportsHyphens: true,
        hasTimestamp: false,
        recommended: false
    },
    { 
        id: 'v3', 
        name: 'UUID v3', 
        subtitle: 'MD5 Name',
        icon: Hash,
        color: 'text-orange-400', 
        bgColor: 'bg-orange-500/10', 
        borderColor: 'border-orange-500/20',
        description: 'MD5 hash of namespace + name. Use v5 instead.',
        bits: 122,
        supportsHyphens: true,
        hasTimestamp: false,
        recommended: false
    },
] as const;

// Predefined namespaces for UUID v3/v5
const NAMESPACES = [
    { id: 'dns', name: 'DNS', value: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', example: 'example.com' },
    { id: 'url', name: 'URL', value: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', example: 'https://example.com/page' },
    { id: 'oid', name: 'OID', value: '6ba7b812-9dad-11d1-80b4-00c04fd430c8', example: '1.2.3.4' },
    { id: 'x500', name: 'X500', value: '6ba7b814-9dad-11d1-80b4-00c04fd430c8', example: 'cn=John,dc=example,dc=com' },
    { id: 'custom', name: 'Custom', value: '', example: '' },
];

type IdType = typeof ID_TYPES[number]['id'];

interface GeneratedId {
    value: string;
    type: IdType;
    timestamp?: Date;
}

interface UuidGeneratorProps {
    tabId?: string;
}

export const UuidGenerator: React.FC<UuidGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'generate' | 'validate'>('generate');
    const [validateInput, setValidateInput] = useState('');

    // Default options
    const defaultOptions = {
        type: 'v4' as IdType,
        count: 5,
        hyphens: true,
        uppercase: false,
        prefix: '',
        namespace: 'url',
        customNamespace: '',
        name: ''
    };

    const options = { ...defaultOptions, ...toolData?.options };
    const generatedIds: GeneratedId[] = toolData?.options?.generatedIds || [];

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const updateOption = useCallback((key: string, value: string | number | boolean) => {
        setToolData(effectiveId, { options: { ...options, [key]: value } });
    }, [effectiveId, options, setToolData]);

    const generateIds = useCallback(() => {
        const count = Math.min(Math.max(1, options.count || 1), 100);
        const type = options.type || 'v4';
        const ids: GeneratedId[] = [];

        // Get namespace for v3/v5
        const getNamespace = () => {
            if (options.namespace === 'custom') {
                return options.customNamespace;
            }
            return NAMESPACES.find(n => n.id === options.namespace)?.value || NAMESPACES[1].value;
        };

        for (let i = 0; i < count; i++) {
            let id = '';
            let timestamp: Date | undefined;

            try {
                switch (type) {
                    case 'v1':
                        id = uuidv1();
                        timestamp = extractV1Timestamp(id);
                        break;
                    case 'v3':
                        const ns3 = getNamespace();
                        const name3 = options.name || `item-${i + 1}`;
                        id = uuidv3(name3, ns3);
                        break;
                    case 'v4':
                        id = uuidv4();
                        break;
                    case 'v5':
                        const ns5 = getNamespace();
                        const name5 = options.name || `item-${i + 1}`;
                        id = uuidv5(name5, ns5);
                        break;
                    case 'v6':
                        id = uuidv6();
                        timestamp = extractV6Timestamp(id);
                        break;
                    case 'v7':
                        id = uuidv7();
                        timestamp = extractV7Timestamp(id);
                        break;
                    case 'ulid':
                        id = ulid();
                        timestamp = new Date(decodeTime(id));
                        break;
                    default:
                        id = uuidv4();
                }
            } catch (error) {
                console.error(`Error generating ${type}:`, error);
                id = uuidv4(); // Fallback
            }

            // Apply formatting
            if (!options.hyphens && type !== 'ulid') {
                id = id.replace(/-/g, '');
            }
            if (options.uppercase) {
                id = id.toUpperCase();
            }
            if (options.prefix) {
                id = options.prefix + id;
            }

            ids.push({ value: id, type, timestamp });
        }

        setToolData(effectiveId, { options: { ...options, generatedIds: ids } });
        
        const typeConfig = ID_TYPES.find(t => t.id === type);
        toast.success(`Generated ${count} ${typeConfig?.name || type.toUpperCase()}${count > 1 ? 's' : ''}`);
    }, [effectiveId, options, setToolData]);

    // Extract timestamp from UUID v1
    const extractV1Timestamp = (uuid: string): Date | undefined => {
        try {
            const parts = uuid.split('-');
            if (parts.length !== 5) return undefined;
            
            const timeLow = parts[0];
            const timeMid = parts[1];
            const timeHigh = parts[2].substring(1); // Remove version nibble
            
            const timestampHex = timeHigh + timeMid + timeLow;
            const timestamp = parseInt(timestampHex, 16);
            
            // UUID timestamp is 100-nanosecond intervals since Oct 15, 1582
            const epochDiff = 122192928000000000n;
            const unixTimestamp = (BigInt(timestamp) - epochDiff) / 10000n;
            
            return new Date(Number(unixTimestamp));
        } catch {
            return undefined;
        }
    };

    // Extract timestamp from UUID v6 (reordered v1)
    const extractV6Timestamp = (uuid: string): Date | undefined => {
        try {
            const parts = uuid.split('-');
            if (parts.length !== 5) return undefined;
            
            // v6 has time bits in order: time_high, time_mid, time_low
            const timeHigh = parts[0];
            const timeMid = parts[1];
            const timeLow = parts[2].substring(1); // Remove version nibble
            
            const timestampHex = timeHigh + timeMid + timeLow;
            const timestamp = parseInt(timestampHex, 16);
            
            // UUID timestamp is 100-nanosecond intervals since Oct 15, 1582
            const epochDiff = 122192928000000000n;
            const unixTimestamp = (BigInt(timestamp) - epochDiff) / 10000n;
            
            return new Date(Number(unixTimestamp));
        } catch {
            return undefined;
        }
    };

    // Extract timestamp from UUID v7 (Unix epoch milliseconds)
    const extractV7Timestamp = (uuid: string): Date | undefined => {
        try {
            const hex = uuid.replace(/-/g, '');
            // First 48 bits (12 hex chars) are Unix timestamp in milliseconds
            const timestampHex = hex.substring(0, 12);
            const timestamp = parseInt(timestampHex, 16);
            
            return new Date(timestamp);
        } catch {
            return undefined;
        }
    };

    const handleCopy = (index: number, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedIndex(index);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleCopyAll = () => {
        const allIds = generatedIds.map(id => id.value).join('\n');
        if (allIds) {
            navigator.clipboard.writeText(allIds);
            toast.success('All IDs copied');
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        setValidateInput('');
    };

    // Validation logic
    const validateId = (input: string): { valid: boolean; type?: string; version?: number; timestamp?: Date; versionName?: string } => {
        const trimmed = input.trim();
        if (!trimmed) return { valid: false };

        // Check if ULID (26 chars, Crockford Base32)
        if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(trimmed)) {
            try {
                const timestamp = new Date(decodeTime(trimmed.toUpperCase()));
                return { valid: true, type: 'ULID', timestamp, versionName: 'ULID' };
            } catch {
                return { valid: false };
            }
        }

        // Check UUID (with or without hyphens)
        const uuidWithHyphens = trimmed.length === 32 
            ? `${trimmed.slice(0,8)}-${trimmed.slice(8,12)}-${trimmed.slice(12,16)}-${trimmed.slice(16,20)}-${trimmed.slice(20)}`
            : trimmed;

        if (uuidValidate(uuidWithHyphens)) {
            const version = uuidVersion(uuidWithHyphens);
            let timestamp: Date | undefined;
            let versionName = `v${version}`;
            
            switch (version) {
                case 1:
                    timestamp = extractV1Timestamp(uuidWithHyphens);
                    versionName = 'v1 (Time + MAC)';
                    break;
                case 3:
                    versionName = 'v3 (MD5 Name)';
                    break;
                case 4:
                    versionName = 'v4 (Random)';
                    break;
                case 5:
                    versionName = 'v5 (SHA-1 Name)';
                    break;
                case 6:
                    timestamp = extractV6Timestamp(uuidWithHyphens);
                    versionName = 'v6 (Reordered Time)';
                    break;
                case 7:
                    timestamp = extractV7Timestamp(uuidWithHyphens);
                    versionName = 'v7 (Unix Time)';
                    break;
            }
            
            return { valid: true, type: 'UUID', version, timestamp, versionName };
        }

        return { valid: false };
    };

    const validationResult = validateId(validateInput);
    const selectedType = ID_TYPES.find(t => t.id === options.type);

    return (
        <ToolPane
            title="UUID / ULID Generator"
            description="Generate and validate unique identifiers"
            onClear={handleClear}
            onCopy={handleCopyAll}
            actions={
                activeTab === 'generate' && (
                    <Button variant="primary" onClick={generateIds} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Generate
                    </Button>
                )
            }
        >
            <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
                {/* Tab Switcher */}
                <div className="flex rounded-xl overflow-hidden border border-border-glass bg-black/20 p-1 w-fit">
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'generate' 
                                ? "bg-indigo-500 text-white shadow-lg" 
                                : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate
                    </button>
                    <button
                        onClick={() => setActiveTab('validate')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'validate' 
                                ? "bg-indigo-500 text-white shadow-lg" 
                                : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Validate
                    </button>
                </div>

                {activeTab === 'generate' ? (
                    <>
                        {/* Type Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                                <Fingerprint className="w-3.5 h-3.5" />
                                ID Type
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {ID_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = options.type === type.id;
                                    
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => updateOption('type', type.id)}
                                            className={cn(
                                                "relative p-4 rounded-xl border transition-all text-left",
                                                isSelected 
                                                    ? `${type.borderColor} ${type.bgColor} ring-2 ring-offset-2 ring-offset-background ring-current ${type.color}`
                                                    : "border-border-glass bg-black/20 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    isSelected ? type.bgColor : "bg-white/5"
                                                )}>
                                                    <Icon className={cn("w-4 h-4", isSelected ? type.color : "text-foreground-muted")} />
                                                </div>
                                                <div>
                                                    <p className={cn("font-bold text-sm", isSelected ? type.color : "text-foreground")}>
                                                        {type.name}
                                                    </p>
                                                    <p className="text-[10px] text-foreground-muted">{type.subtitle}</p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-foreground-muted/70 line-clamp-2">
                                                {type.description}
                                            </p>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCircle2 className={cn("w-4 h-4", type.color)} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Input
                                label="Quantity"
                                type="number"
                                min="1"
                                max="100"
                                value={options.count}
                                onChange={(e) => updateOption('count', parseInt(e.target.value) || 1)}
                                fullWidth
                            />
                            
                            <Input
                                label="Prefix (optional)"
                                type="text"
                                placeholder="e.g., user_, order_"
                                value={options.prefix}
                                onChange={(e) => updateOption('prefix', e.target.value)}
                                fullWidth
                            />

                            <div className="flex items-end pb-2 gap-4">
                                <Checkbox
                                    id="hyphens"
                                    label="Hyphens"
                                    checked={options.hyphens}
                                    disabled={!selectedType?.supportsHyphens}
                                    onChange={(e) => updateOption('hyphens', e.target.checked)}
                                />
                                <Checkbox
                                    id="uppercase"
                                    label="Uppercase"
                                    checked={options.uppercase}
                                    onChange={(e) => updateOption('uppercase', e.target.checked)}
                                />
                            </div>
                        </div>

                        {/* UUID v3/v5 specific options (namespace-based) */}
                        {(options.type === 'v3' || options.type === 'v5') && (
                            <div className={cn(
                                "p-4 rounded-xl border space-y-4",
                                options.type === 'v5' ? "border-violet-500/20 bg-violet-500/5" : "border-orange-500/20 bg-orange-500/5"
                            )}>
                                <div className={cn(
                                    "flex items-center gap-2",
                                    options.type === 'v5' ? "text-violet-400" : "text-orange-400"
                                )}>
                                    <Info className="w-4 h-4" />
                                    <span className="text-xs font-semibold">
                                        UUID {options.type} requires a namespace and name (deterministic output)
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Namespace</label>
                                        <div className="flex flex-wrap gap-2">
                                            {NAMESPACES.map(ns => (
                                                <button
                                                    key={ns.id}
                                                    onClick={() => updateOption('namespace', ns.id)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                                        options.namespace === ns.id
                                                            ? options.type === 'v5' ? "bg-violet-500 text-white" : "bg-orange-500 text-white"
                                                            : "bg-white/5 text-foreground-muted hover:bg-white/10"
                                                    )}
                                                >
                                                    {ns.name}
                                                </button>
                                            ))}
                                        </div>
                                        {options.namespace === 'custom' && (
                                            <Input
                                                placeholder="Custom namespace UUID..."
                                                value={options.customNamespace}
                                                onChange={(e) => updateOption('customNamespace', e.target.value)}
                                                className="font-mono text-xs mt-2"
                                                fullWidth
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            label="Name"
                                            placeholder={NAMESPACES.find(n => n.id === options.namespace)?.example || "e.g., example.com"}
                                            value={options.name}
                                            onChange={(e) => updateOption('name', e.target.value)}
                                            fullWidth
                                        />
                                        {options.type === 'v3' && (
                                            <p className="text-[10px] text-orange-400/80">
                                                Note: v3 uses MD5 (less secure). Consider using v5 (SHA-1) instead.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Generated IDs */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Generated IDs
                                </label>
                                {generatedIds.length > 0 && (
                                    <span className="text-xs text-foreground-muted">
                                        {generatedIds.length} {generatedIds[0]?.type.toUpperCase()}(s)
                                    </span>
                                )}
                            </div>

                            {generatedIds.length > 0 ? (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {generatedIds.map((id, index) => {
                                        const typeConfig = ID_TYPES.find(t => t.id === id.type);
                                        const isCopied = copiedIndex === index;

                                        return (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "group flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                    typeConfig?.borderColor,
                                                    typeConfig?.bgColor,
                                                    "hover:border-opacity-50"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={cn("font-mono text-sm truncate", typeConfig?.color)}>
                                                            {id.value}
                                                        </span>
                                                    </div>
                                                    {id.timestamp && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
                                                            <Calendar className="w-3 h-3" />
                                                            {id.timestamp.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="glass"
                                                    size="sm"
                                                    onClick={() => handleCopy(index, id.value)}
                                                    className={cn(
                                                        "shrink-0 opacity-0 group-hover:opacity-100 transition-all",
                                                        isCopied && "opacity-100 bg-emerald-500/20 border-emerald-500/30"
                                                    )}
                                                >
                                                    {isCopied ? (
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-dashed border-border-glass rounded-xl">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Fingerprint className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <p className="text-foreground-muted font-medium">No IDs generated yet</p>
                                    <p className="text-xs text-foreground-muted/60 mt-1">
                                        Click "Generate" to create unique identifiers
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Validate Tab */
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Enter UUID or ULID to validate
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000 or 01ARZ3NDEKTSV4RRFFQ69G5FAV"
                                value={validateInput}
                                onChange={(e) => setValidateInput(e.target.value)}
                                className={cn(
                                    "font-mono",
                                    validateInput && validationResult.valid && "border-emerald-500/50 bg-emerald-500/5",
                                    validateInput && !validationResult.valid && "border-red-500/50 bg-red-500/5"
                                )}
                                fullWidth
                            />
                        </div>

                        {validateInput && (
                            <div className={cn(
                                "p-6 rounded-xl border",
                                validationResult.valid 
                                    ? "border-emerald-500/30 bg-emerald-500/5" 
                                    : "border-red-500/30 bg-red-500/5"
                            )}>
                                <div className="flex items-center gap-3 mb-4">
                                    {validationResult.valid ? (
                                        <>
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-emerald-400">Valid {validationResult.type}</p>
                                                {validationResult.versionName && (
                                                    <p className="text-sm text-foreground-muted">{validationResult.versionName}</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                                <XCircle className="w-6 h-6 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-red-400">Invalid ID</p>
                                                <p className="text-sm text-foreground-muted">Not a valid UUID or ULID format</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {validationResult.valid && validationResult.timestamp && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                                        <Calendar className="w-4 h-4 text-cyan-400" />
                                        <div>
                                            <p className="text-xs text-foreground-muted">Embedded Timestamp</p>
                                            <p className="font-mono text-sm text-cyan-400">
                                                {validationResult.timestamp.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info Panel */}
                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-indigo-400">Supported Formats & Versions</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-foreground-muted">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-foreground">UUID Versions:</p>
                                            <ul className="space-y-0.5">
                                                <li>• <strong className="text-cyan-400">v1</strong> - Time + MAC address</li>
                                                <li>• <strong className="text-orange-400">v3</strong> - MD5 namespace hash</li>
                                                <li>• <strong className="text-emerald-400">v4</strong> - Random</li>
                                                <li>• <strong className="text-violet-400">v5</strong> - SHA-1 namespace hash</li>
                                                <li>• <strong className="text-sky-400">v6</strong> - Reordered time (sortable)</li>
                                                <li>• <strong className="text-rose-400">v7</strong> - Unix timestamp (sortable)</li>
                                            </ul>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-foreground">Timestamps:</p>
                                            <ul className="space-y-0.5">
                                                <li>• v1, v6: Gregorian timestamp</li>
                                                <li>• v7: Unix milliseconds</li>
                                                <li>• ULID: Unix milliseconds</li>
                                                <li>• v3, v4, v5: No timestamp</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Version Comparison Info */}
                {activeTab === 'generate' && generatedIds.length === 0 && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border border-indigo-500/20">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-indigo-400">Choosing the Right UUID Version</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-foreground-muted">
                                    <div className="space-y-1.5">
                                        <p><strong className="text-rose-400">v7</strong> - Best for databases (sortable, modern)</p>
                                        <p><strong className="text-emerald-400">v4</strong> - Best for general use (random)</p>
                                        <p><strong className="text-amber-400">ULID</strong> - URL-safe alternative to v7</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p><strong className="text-violet-400">v5</strong> - Deterministic from name</p>
                                        <p><strong className="text-sky-400">v6</strong> - v1 but sortable</p>
                                        <p><strong className="text-cyan-400">v1</strong> - Legacy, avoid if possible</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
