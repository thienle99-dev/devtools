import React, { useEffect, useState, useRef } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { FileUp, Table, Download, Settings, Trash2, ChevronDown, Palette, Filter, Columns, Eye, EyeOff, GripVertical, X, Plus, Search } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { cn } from '@utils/cn';

const TOOL_ID = 'csv-excel';

interface CsvExcelConverterProps {
    tabId?: string;
}

interface ColumnConfig {
    originalName: string;
    displayName: string;
    selected: boolean;
    order: number;
}

interface FilterCondition {
    column: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greater' | 'less' | 'notEmpty' | 'isEmpty';
    value: string;
    caseSensitive?: boolean;
}

interface ConversionOptions {
    // Basic
    delimiter: ',' | ';' | '\t' | '|' | 'auto';
    encoding: 'UTF-8' | 'UTF-16' | 'ISO-8859-1' | 'Windows-1252';
    hasHeader: boolean;
    skipRows: number;
    
    // Sheet
    sheetName: string;
    fileName: string;
    
    // Columns
    columns: ColumnConfig[];
    
    // Filters
    filters: FilterCondition[];
    
    // Formatting
    freezeHeader: boolean;
    autoFilter: boolean;
    alternateRows: boolean;
    alternateRowColor: string;
    
    // Column
    columnWidths: 'auto' | 'fixed';
    fixedColumnWidth: number;
    
    // Cell
    trimWhitespace: boolean;
    convertEmptyToNull: boolean;
    
    // Style
    headerStyle: {
        bold: boolean;
        backgroundColor: string;
        fontColor: string;
    };
}

const DEFAULT_OPTIONS: ConversionOptions = {
    delimiter: 'auto',
    encoding: 'UTF-8',
    hasHeader: true,
    skipRows: 0,
    sheetName: 'Sheet1',
    fileName: '',
    columns: [],
    filters: [],
    freezeHeader: true,
    autoFilter: true,
    alternateRows: true,
    alternateRowColor: 'F9FAFB',
    columnWidths: 'auto',
    fixedColumnWidth: 15,
    trimWhitespace: true,
    convertEmptyToNull: false,
    headerStyle: {
        bold: true,
        backgroundColor: '4F46E5',
        fontColor: 'FFFFFF'
    }
};

export const CsvExcelConverter: React.FC<CsvExcelConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [allData, setAllData] = useState<any[]>([]); // Full dataset for filtering
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'basic' | 'columns' | 'formatting' | 'styling'>('basic');
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    const data = toolData || {
        input: '',
        options: DEFAULT_OPTIONS
    };

    const options: ConversionOptions = { ...DEFAULT_OPTIONS, ...data.options };

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    // Update preview when input changes
    useEffect(() => {
        if (data.input) {
            const parseConfig: any = {
                header: options.hasHeader,
                skipEmptyLines: true,
                delimiter: options.delimiter === 'auto' ? '' : options.delimiter
            };

            // Skip rows if needed
            let inputText = data.input;
            if (options.skipRows > 0) {
                const lines = data.input.split('\n');
                inputText = lines.slice(options.skipRows).join('\n');
                parseConfig.skipEmptyLines = 'greedy';
            }

            const parsed = Papa.parse(inputText, parseConfig) as any;
            setAllData(parsed.data || []);
            
            // Apply filters
            const filtered = applyFilters(parsed.data || [], options.filters);
            setPreviewData(filtered.slice(0, 10)); // Preview only first 10
            
            // Auto-detect columns and initialize column config if not set
            if (parsed.data && parsed.data.length > 0 && options.columns.length === 0) {
                const detectedColumns = Object.keys(parsed.data[0]);
                const columnConfigs: ColumnConfig[] = detectedColumns.map((col, idx) => ({
                    originalName: col,
                    displayName: col,
                    selected: true,
                    order: idx
                }));
                
                updateOption('columns', columnConfigs);
            }
        } else {
            setPreviewData([]);
            setAllData([]);
        }
    }, [data.input, options.delimiter, options.hasHeader, options.skipRows, options.filters]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            setToolData(effectiveId, {
                input: text,
                options: { ...options, fileName: file.name.replace(/\.[^/.]+$/, "") }
            });
            setLoading(false);
        };

        reader.onerror = () => {
            setLoading(false);
        };

        reader.readAsText(file);
    };

    const calculateColumnWidths = (data: any[]): { [col: string]: number } => {
        if (!data || data.length === 0) return {};
        
        const widths: { [col: string]: number } = {};
        const keys = Object.keys(data[0]);
        
        keys.forEach(key => {
            let maxLen = key.length;
            data.forEach(row => {
                const val = String(row[key] || '');
                if (val.length > maxLen) maxLen = val.length;
            });
            // Add some padding and cap at 50
            widths[key] = Math.min(Math.max(maxLen + 2, 10), 50);
        });
        
        return widths;
    };

    const handleConvertAndDownload = () => {
        if (!data.input) return;
        setLoading(true);

        try {
            // Parse full data
            const parseConfig: any = {
                header: options.hasHeader,
                skipEmptyLines: 'greedy',
                delimiter: options.delimiter === 'auto' ? '' : options.delimiter
            };

            let inputText = data.input;
            
            // Skip rows if needed
            if (options.skipRows > 0) {
                const lines = data.input.split('\n');
                inputText = lines.slice(options.skipRows).join('\n');
            }

            const parsed = Papa.parse(inputText, parseConfig) as any;

            if (parsed.errors && parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
                throw new Error("Failed to parse CSV data");
            }

            // Apply filters first
            let filteredData = applyFilters(parsed.data || [], options.filters);

            // Filter and reorder columns based on selection
            let selectedColumns = options.columns
                .filter(col => col.selected)
                .sort((a, b) => a.order - b.order);
            
            // If no columns configured or none selected, use all columns
            const useAllColumns = selectedColumns.length === 0;
            
            // Process data
            let processedData = filteredData.map((row: any) => {
                const newRow: any = {};
                
                if (useAllColumns) {
                    // Use all columns as-is
                    Object.keys(row).forEach(key => {
                        let value = row[key];
                        
                        // Trim whitespace
                        if (options.trimWhitespace && typeof value === 'string') {
                            value = value.trim();
                        }
                        
                        // Convert empty to null
                        if (options.convertEmptyToNull && value === '') {
                            value = null;
                        }
                        
                        newRow[key] = value;
                    });
                } else {
                    // Only include selected columns in specified order
                    selectedColumns.forEach(colConfig => {
                        const originalKey = colConfig.originalName;
                        const displayKey = colConfig.displayName;
                        let value = row[originalKey];
                        
                        // Trim whitespace
                        if (options.trimWhitespace && typeof value === 'string') {
                            value = value.trim();
                        }
                        
                        // Convert empty to null
                        if (options.convertEmptyToNull && value === '') {
                            value = null;
                        }
                        
                        newRow[displayKey] = value;
                    });
                }
                
                return newRow;
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(processedData);

            // Calculate column widths
            if (options.columnWidths === 'auto') {
                const colWidths = calculateColumnWidths(processedData);
                ws['!cols'] = Object.values(colWidths).map(w => ({ wch: w }));
            } else {
                const colCount = Object.keys(processedData[0] || {}).length;
                ws['!cols'] = Array(colCount).fill({ wch: options.fixedColumnWidth });
            }

            // Freeze header
            if (options.freezeHeader && options.hasHeader) {
                ws['!freeze'] = { xSplit: 0, ySplit: 1 };
            }

            // Auto filter
            if (options.autoFilter && options.hasHeader) {
                const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
                ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
            }

            // Apply styling
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            
            // Header style
            if (options.hasHeader && options.headerStyle) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
                    if (!ws[cellAddress]) continue;
                    
                    ws[cellAddress].s = {
                        font: {
                            bold: options.headerStyle.bold,
                            color: { rgb: options.headerStyle.fontColor }
                        },
                        fill: {
                            fgColor: { rgb: options.headerStyle.backgroundColor }
                        },
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center'
                        }
                    };
                }
            }

            // Alternate row colors
            if (options.alternateRows) {
                const startRow = options.hasHeader ? 1 : 0;
                for (let R = startRow; R <= range.e.r; ++R) {
                    if (R % 2 === 1) {
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                            if (!ws[cellAddress]) continue;
                            
                            if (!ws[cellAddress].s) ws[cellAddress].s = {};
                            ws[cellAddress].s.fill = {
                                fgColor: { rgb: options.alternateRowColor }
                            };
                        }
                    }
                }
            }

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, options.sheetName || "Sheet1");

            // Write and download
            const fileName = (options.fileName || 'converted') + '.xlsx';
            XLSX.writeFile(wb, fileName, { cellStyles: true });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        setPreviewData([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateOption = (key: string, value: any) => {
        setToolData(effectiveId, {
            input: data.input,
            options: { ...options, [key]: value }
        });
    };

    // Column management helpers
    const toggleColumn = (originalName: string) => {
        const updated = options.columns.map(col =>
            col.originalName === originalName ? { ...col, selected: !col.selected } : col
        );
        updateOption('columns', updated);
    };

    const renameColumn = (originalName: string, newDisplayName: string) => {
        const updated = options.columns.map(col =>
            col.originalName === originalName ? { ...col, displayName: newDisplayName } : col
        );
        updateOption('columns', updated);
    };

    const moveColumn = (originalName: string, direction: 'up' | 'down') => {
        const cols = [...options.columns];
        const idx = cols.findIndex(c => c.originalName === originalName);
        if (idx === -1) return;
        
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= cols.length) return;
        
        // Swap
        [cols[idx], cols[targetIdx]] = [cols[targetIdx], cols[idx]];
        
        // Update order
        cols.forEach((col, i) => col.order = i);
        updateOption('columns', cols);
    };

    const toggleAllColumns = () => {
        const anySelected = options.columns.some(col => col.selected);
        const updated = options.columns.map(col => ({ ...col, selected: !anySelected }));
        updateOption('columns', updated);
    };

    const selectedCount = options.columns.filter(col => col.selected).length;

    // Filter helper function
    const applyFilters = (data: any[], filters: FilterCondition[]): any[] => {
        if (filters.length === 0) return data;
        
        return data.filter(row => {
            return filters.every(filter => {
                const value = String(row[filter.column] || '');
                const filterValue = filter.value;
                
                const compareValue = filter.caseSensitive ? value : value.toLowerCase();
                const compareFilter = filter.caseSensitive ? filterValue : filterValue.toLowerCase();
                
                switch (filter.operator) {
                    case 'equals':
                        return compareValue === compareFilter;
                    case 'contains':
                        return compareValue.includes(compareFilter);
                    case 'startsWith':
                        return compareValue.startsWith(compareFilter);
                    case 'endsWith':
                        return compareValue.endsWith(compareFilter);
                    case 'greater':
                        return parseFloat(value) > parseFloat(filterValue);
                    case 'less':
                        return parseFloat(value) < parseFloat(filterValue);
                    case 'notEmpty':
                        return value.trim() !== '';
                    case 'isEmpty':
                        return value.trim() === '';
                    default:
                        return true;
                }
            });
        });
    };

    const addFilter = () => {
        const firstColumn = options.columns[0]?.originalName || '';
        const newFilter: FilterCondition = {
            column: firstColumn,
            operator: 'contains',
            value: '',
            caseSensitive: false
        };
        updateOption('filters', [...options.filters, newFilter]);
    };

    const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
        const updated = [...options.filters];
        updated[index] = { ...updated[index], ...updates };
        updateOption('filters', updated);
    };

    const removeFilter = (index: number) => {
        const updated = options.filters.filter((_, i) => i !== index);
        updateOption('filters', updated);
    };

    const filteredDataCount = applyFilters(allData, options.filters).length;

    const renderSettingsPanel = () => (
        <div className="glass-panel rounded-2xl border border-border-glass overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border-glass bg-foreground/[0.02]">
                {[
                    { id: 'basic', label: 'Basic', icon: Settings },
                    { id: 'columns', label: 'Columns', icon: Columns },
                    { id: 'formatting', label: 'Formatting', icon: Filter },
                    { id: 'styling', label: 'Styling', icon: Palette }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={cn(
                            "flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2",
                            settingsTab === tab.id
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-foreground-muted hover:text-foreground hover:bg-foreground/[0.02]"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {settingsTab === 'basic' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground-secondary">Delimiter</label>
                            <select
                                value={options.delimiter}
                                onChange={(e) => updateOption('delimiter', e.target.value)}
                                className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="auto">Auto-detect</option>
                                <option value=",">Comma (,)</option>
                                <option value=";">Semicolon (;)</option>
                                <option value="\t">Tab</option>
                                <option value="|">Pipe (|)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground-secondary">Encoding</label>
                            <select
                                value={options.encoding}
                                onChange={(e) => updateOption('encoding', e.target.value)}
                                className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="UTF-8">UTF-8</option>
                                <option value="UTF-16">UTF-16</option>
                                <option value="ISO-8859-1">ISO-8859-1</option>
                                <option value="Windows-1252">Windows-1252</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                            <span className="text-sm font-medium">First row is header</span>
                            <input
                                type="checkbox"
                                checked={options.hasHeader}
                                onChange={(e) => updateOption('hasHeader', e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground-secondary">Skip rows</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={options.skipRows}
                                onChange={(e) => updateOption('skipRows', parseInt(e.target.value) || 0)}
                                className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </>
                )}

                {settingsTab === 'columns' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-foreground-primary">Select Columns</h4>
                                <p className="text-xs text-foreground-tertiary">
                                    {selectedCount} of {options.columns.length} selected
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={toggleAllColumns}
                                className="text-xs"
                            >
                                {selectedCount > 0 ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {options.columns.map((col, idx) => (
                                <div
                                    key={col.originalName}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all",
                                        col.selected
                                            ? "bg-primary/5 border-primary/30"
                                            : "bg-background/30 border-border-glass opacity-60"
                                    )}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <button
                                            onClick={() => toggleColumn(col.originalName)}
                                            className="shrink-0"
                                        >
                                            {col.selected ? (
                                                <Eye size={18} className="text-primary" />
                                            ) : (
                                                <EyeOff size={18} className="text-foreground-muted" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-foreground-tertiary mb-1">
                                                Original: <span className="font-mono">{col.originalName}</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={col.displayName}
                                                onChange={(e) => renameColumn(col.originalName, e.target.value)}
                                                placeholder="Display name..."
                                                disabled={!col.selected}
                                                className={cn(
                                                    "w-full bg-background/50 border border-border-glass rounded px-2 py-1 text-sm font-medium",
                                                    !col.selected && "opacity-50 cursor-not-allowed"
                                                )}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button
                                                onClick={() => moveColumn(col.originalName, 'up')}
                                                disabled={idx === 0}
                                                className={cn(
                                                    "p-1 rounded hover:bg-foreground/10 transition-colors",
                                                    idx === 0 && "opacity-30 cursor-not-allowed"
                                                )}
                                            >
                                                <GripVertical size={14} className="rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => moveColumn(col.originalName, 'down')}
                                                disabled={idx === options.columns.length - 1}
                                                className={cn(
                                                    "p-1 rounded hover:bg-foreground/10 transition-colors",
                                                    idx === options.columns.length - 1 && "opacity-30 cursor-not-allowed"
                                                )}
                                            >
                                                <GripVertical size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {col.displayName !== col.originalName && (
                                        <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                            Will be renamed in Excel
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {options.columns.length === 0 && (
                            <div className="text-center py-8 text-foreground-tertiary">
                                <Columns size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No columns detected yet</p>
                                <p className="text-xs">Upload a CSV file to see columns</p>
                            </div>
                        )}
                    </>
                )}

                {settingsTab === 'formatting' && (
                    <>
                        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                            <span className="text-sm font-medium">Freeze header row</span>
                            <input
                                type="checkbox"
                                checked={options.freezeHeader}
                                onChange={(e) => updateOption('freezeHeader', e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                            <span className="text-sm font-medium">Enable auto-filter</span>
                            <input
                                type="checkbox"
                                checked={options.autoFilter}
                                onChange={(e) => updateOption('autoFilter', e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground-secondary">Column Width</label>
                            <select
                                value={options.columnWidths}
                                onChange={(e) => updateOption('columnWidths', e.target.value)}
                                className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="auto">Auto-fit content</option>
                                <option value="fixed">Fixed width</option>
                            </select>
                        </div>

                        {options.columnWidths === 'fixed' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground-secondary">Fixed Width</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="100"
                                    value={options.fixedColumnWidth}
                                    onChange={(e) => updateOption('fixedColumnWidth', parseInt(e.target.value) || 15)}
                                    className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                            <span className="text-sm font-medium">Trim whitespace</span>
                            <input
                                type="checkbox"
                                checked={options.trimWhitespace}
                                onChange={(e) => updateOption('trimWhitespace', e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                            <span className="text-sm font-medium">Empty cells to null</span>
                            <input
                                type="checkbox"
                                checked={options.convertEmptyToNull}
                                onChange={(e) => updateOption('convertEmptyToNull', e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass"
                            />
                        </div>
                    </>
                )}

                {settingsTab === 'styling' && (
                    <>
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-foreground-secondary uppercase">Header Style</h4>
                            
                            <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                                <span className="text-sm font-medium">Bold text</span>
                                <input
                                    type="checkbox"
                                    checked={options.headerStyle.bold}
                                    onChange={(e) => updateOption('headerStyle', { ...options.headerStyle, bold: e.target.checked })}
                                    className="w-4 h-4 rounded border-border-glass"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground-secondary">Background Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={'#' + options.headerStyle.backgroundColor}
                                        onChange={(e) => updateOption('headerStyle', { ...options.headerStyle, backgroundColor: e.target.value.slice(1) })}
                                        className="w-12 h-10 rounded-lg border border-border-glass"
                                    />
                                    <input
                                        type="text"
                                        value={options.headerStyle.backgroundColor}
                                        onChange={(e) => updateOption('headerStyle', { ...options.headerStyle, backgroundColor: e.target.value })}
                                        placeholder="4F46E5"
                                        className="flex-1 bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground-secondary">Text Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={'#' + options.headerStyle.fontColor}
                                        onChange={(e) => updateOption('headerStyle', { ...options.headerStyle, fontColor: e.target.value.slice(1) })}
                                        className="w-12 h-10 rounded-lg border border-border-glass"
                                    />
                                    <input
                                        type="text"
                                        value={options.headerStyle.fontColor}
                                        onChange={(e) => updateOption('headerStyle', { ...options.headerStyle, fontColor: e.target.value })}
                                        placeholder="FFFFFF"
                                        className="flex-1 bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border-glass space-y-3">
                            <h4 className="text-xs font-bold text-foreground-secondary uppercase">Row Style</h4>
                            
                            <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                                <span className="text-sm font-medium">Alternate row colors</span>
                                <input
                                    type="checkbox"
                                    checked={options.alternateRows}
                                    onChange={(e) => updateOption('alternateRows', e.target.checked)}
                                    className="w-4 h-4 rounded border-border-glass"
                                />
                            </div>

                            {options.alternateRows && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground-secondary">Alternate Row Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={'#' + options.alternateRowColor}
                                            onChange={(e) => updateOption('alternateRowColor', e.target.value.slice(1))}
                                            className="w-12 h-10 rounded-lg border border-border-glass"
                                        />
                                        <input
                                            type="text"
                                            value={options.alternateRowColor}
                                            onChange={(e) => updateOption('alternateRowColor', e.target.value)}
                                            placeholder="F9FAFB"
                                            className="flex-1 bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <ToolPane
            title="CSV to Excel Converter"
            description="Convert CSV files to Excel (XLSX) format with advanced options"
            onClear={handleClear}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Upload Area */}
                {!data.input ? (
                    <div
                        className="flex-1 min-h-[300px] border-2 border-dashed border-border-glass rounded-2xl flex flex-col items-center justify-center p-12 hover:bg-bg-glass-hover transition-all cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv"
                            className="hidden"
                        />
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <FileUp size={40} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Drop your CSV file here</h3>
                        <p className="text-foreground-secondary text-sm">or click to browse from your computer</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col space-y-6 min-h-0">
                        {/* File Info & Quick Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 glass-panel rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                    <Table size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest leading-none mb-1">Source File</p>
                                    <p className="font-bold truncate text-sm">{(options.fileName || 'file')}.csv</p>
                                </div>
                                <button
                                    onClick={handleClear}
                                    className="p-2 hover:bg-red-500/10 text-foreground-muted hover:text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="p-4 glass-panel rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                                    <Settings size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest leading-none mb-1">Sheet Name</p>
                                    <input
                                        type="text"
                                        value={options.sheetName}
                                        onChange={(e) => updateOption('sheetName', e.target.value)}
                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold placeholder:text-foreground-muted"
                                        placeholder="Sheet1"
                                    />
                                </div>
                            </div>

                            <div className="p-4 glass-panel rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <Download size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest leading-none mb-1">Target Filename</p>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={options.fileName}
                                            onChange={(e) => updateOption('fileName', e.target.value)}
                                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold placeholder:text-foreground-muted"
                                            placeholder="output"
                                        />
                                        <span className="text-xs text-foreground-muted font-bold">.xlsx</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Toggle */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="flex items-center justify-between p-4 glass-panel rounded-2xl hover:bg-foreground/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Settings size={20} className="text-primary" />
                                <span className="font-bold text-sm">Advanced Options</span>
                            </div>
                            <ChevronDown
                                size={20}
                                className={cn(
                                    "text-foreground-muted transition-transform",
                                    showSettings && "rotate-180"
                                )}
                            />
                        </button>

                        {/* Settings Panel */}
                        {showSettings && renderSettingsPanel()}

                        {/* Filters Panel */}
                        {showFilterPanel && (
                            <div className="glass-panel rounded-2xl border border-border-glass p-4 space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Filter size={18} className="text-blue-400" />
                                        <h4 className="text-sm font-bold">Data Filters</h4>
                                        <span className="text-xs text-foreground-tertiary">
                                            {filteredDataCount} / {allData.length} rows
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={addFilter} icon={Plus} className="text-xs">
                                            Add Filter
                                        </Button>
                                        <button
                                            onClick={() => setShowFilterPanel(false)}
                                            className="p-1 hover:bg-foreground/10 rounded transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {options.filters.length === 0 ? (
                                    <div className="text-center py-6 text-foreground-tertiary">
                                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No filters applied</p>
                                        <p className="text-xs mt-1">Click "Add Filter" to filter rows before converting</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {options.filters.map((filter, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-background/30 rounded-lg">
                                                <select
                                                    value={filter.column}
                                                    onChange={(e) => updateFilter(idx, { column: e.target.value })}
                                                    className="bg-background/50 border border-border-glass rounded px-2 py-1 text-xs"
                                                >
                                                    {options.columns.map(col => (
                                                        <option key={col.originalName} value={col.originalName}>
                                                            {col.displayName}
                                                        </option>
                                                    ))}
                                                </select>

                                                <select
                                                    value={filter.operator}
                                                    onChange={(e) => updateFilter(idx, { operator: e.target.value as any })}
                                                    className="bg-background/50 border border-border-glass rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="contains">Contains</option>
                                                    <option value="equals">Equals</option>
                                                    <option value="startsWith">Starts with</option>
                                                    <option value="endsWith">Ends with</option>
                                                    <option value="greater">Greater than</option>
                                                    <option value="less">Less than</option>
                                                    <option value="notEmpty">Not empty</option>
                                                    <option value="isEmpty">Is empty</option>
                                                </select>

                                                {!['notEmpty', 'isEmpty'].includes(filter.operator) && (
                                                    <input
                                                        type="text"
                                                        value={filter.value}
                                                        onChange={(e) => updateFilter(idx, { value: e.target.value })}
                                                        placeholder="Value..."
                                                        className="flex-1 bg-background/50 border border-border-glass rounded px-2 py-1 text-xs"
                                                    />
                                                )}

                                                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={filter.caseSensitive}
                                                        onChange={(e) => updateFilter(idx, { caseSensitive: e.target.checked })}
                                                        className="w-3 h-3"
                                                    />
                                                    Aa
                                                </label>

                                                <button
                                                    onClick={() => removeFilter(idx)}
                                                    className="p-1 hover:bg-red-500/10 text-foreground-muted hover:text-red-500 rounded transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Preview Table */}
                        <div className="flex-1 flex flex-col min-h-0 glass-panel rounded-2xl overflow-hidden border border-border-glass">
                            <div className="px-4 py-3 border-b border-border-glass bg-foreground/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                        Preview ({previewData.length} / {filteredDataCount} rows)
                                    </span>
                                    {selectedCount < options.columns.length && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-primary/10 text-primary">
                                            {selectedCount} of {options.columns.length} cols
                                        </span>
                                    )}
                                    {options.filters.length > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-500/10 text-blue-500">
                                            {options.filters.length} {options.filters.length === 1 ? 'Filter' : 'Filters'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                                        className="text-xs"
                                        icon={Filter}
                                    >
                                        Filters
                                    </Button>
                                <div className="flex items-center gap-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500/10 text-emerald-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    CSV Parsed
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10">
                                        <tr>
                                            {/* Row Number Header */}
                                            {previewData.length > 0 && (
                                                <th 
                                                    className="px-3 py-2 border-b border-border-glass w-12 cursor-pointer hover:bg-foreground/5 transition-all group"
                                                    onClick={toggleAllColumns}
                                                    title={`${selectedCount === options.columns.length ? 'Hide' : 'Show'} all columns`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        {selectedCount === options.columns.length ? (
                                                            <Eye size={14} className="text-primary" />
                                                        ) : selectedCount > 0 ? (
                                                            <Eye size={14} className="text-primary opacity-50" />
                                                        ) : (
                                                            <EyeOff size={14} className="text-foreground-muted opacity-50 group-hover:text-primary group-hover:opacity-100" />
                                                        )}
                                                    </div>
                                                </th>
                                            )}
                                            
                                            {previewData.length > 0 && (() => {
                                                // Always show ALL columns, sorted by order
                                                const columnsToShow = options.columns.length > 0
                                                    ? [...options.columns].sort((a, b) => a.order - b.order)
                                                    : Object.keys(previewData[0]).map((key, idx) => ({
                                                        originalName: key,
                                                        displayName: key,
                                                        selected: true,
                                                        order: idx
                                                    }));
                                                
                                                return columnsToShow.map((col) => {
                                                    const isSelected = col.selected;
                                                    return (
                                                        <th 
                                                            key={col.originalName} 
                                                            className={cn(
                                                                "px-3 py-2 border-b border-border-glass font-bold max-w-[200px] transition-all group relative",
                                                                isSelected 
                                                                    ? "text-foreground-primary bg-primary/5" 
                                                                    : "text-foreground-muted opacity-40 bg-red-500/5"
                                                            )}
                                                        >
                                                            {/* Skip indicator for unselected columns */}
                                                            {!isSelected && (
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                                                                    <div className="text-[9px] font-bold text-red-500 rotate-[-10deg] px-1 py-0.5 border border-red-500/50 rounded bg-red-500/10">
                                                                        SKIP
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div 
                                                                className="flex items-center gap-2 cursor-pointer relative z-10"
                                                                onClick={() => toggleColumn(col.originalName)}
                                                                title={`Click to ${isSelected ? 'hide (will skip export)' : 'show (will export)'} column`}
                                                            >
                                                                {/* Eye Icon */}
                                                                <div className="shrink-0">
                                                                    {isSelected ? (
                                                                        <Eye size={16} className="text-primary" />
                                                                    ) : (
                                                                        <EyeOff size={16} className="text-red-500 opacity-60" />
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Column Name */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={cn(
                                                                        "truncate transition-all font-bold",
                                                                        !isSelected && "line-through decoration-red-500/50"
                                                                    )}>
                                                                        {col.displayName}
                                                                    </div>
                                                                    {col.displayName !== col.originalName && (
                                                                        <div className={cn(
                                                                            "text-[9px] font-normal mt-0.5 truncate",
                                                                            isSelected ? "text-emerald-500" : "text-foreground-tertiary opacity-50"
                                                                        )}>
                                                                            (was: {col.originalName})
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </th>
                                                    );
                                                });
                                            })()}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-glass">
                                        {previewData.slice(0, 10).map((row, idx) => {
                                            // Always show ALL columns, sorted by order
                                            const columnsToShow = options.columns.length > 0
                                                ? [...options.columns].sort((a, b) => a.order - b.order)
                                                : Object.keys(row).map((key, idx) => ({
                                                    originalName: key,
                                                    displayName: key,
                                                    selected: true,
                                                    order: idx
                                                }));
                                            
                                            return (
                                            <tr key={idx} className="hover:bg-foreground/[0.02] transition-colors">
                                                    {/* Row Number */}
                                                    <td className="px-3 py-2 text-foreground-tertiary text-center font-mono text-[10px] w-12">
                                                        {idx + 1}
                                                    </td>
                                                    
                                                    {columnsToShow.map((col) => (
                                                        <td 
                                                            key={col.originalName} 
                                                            className={cn(
                                                                "px-3 py-2 truncate max-w-[200px] transition-all",
                                                                col.selected 
                                                                    ? "text-foreground-muted" 
                                                                    : "text-foreground-tertiary opacity-30 line-through decoration-red-500/30"
                                                            )}
                                                        >
                                                            {String(row[col.originalName])}
                                                    </td>
                                                ))}
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Download Button */}
                        <div className="flex justify-end pt-2">
                            <Button
                                variant="primary"
                                size="lg"
                                className="px-8 font-black gap-2 h-14"
                                onClick={handleConvertAndDownload}
                                icon={Download}
                                loading={loading}
                            >
                                CONVERT & DOWNLOAD XLSX
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
