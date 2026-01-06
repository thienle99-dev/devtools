# Xnapper - Next Implementation Steps

**Ngày tạo**: 2026-01-06  
**Priority Features**: Crop Tool, Share, Templates, Batch Processing

---

## 🎯 Priority 1: Crop Tool (TODO Line 304)

### Current Status
- ❌ Crop logic placeholder trong `CanvasPreview.tsx` (line 304)
- ✅ Store đã có `cropBounds`, `isCropping` state
- ✅ Utility file `crop.ts` đã tồn tại
- ❌ UI controls chưa có

### Implementation Plan

#### Step 1: Add Crop Tool UI
**File**: `src/tools/screenshot/components/AnnotationToolbar.tsx`

```typescript
// Add crop tool button
import { Crop } from 'lucide-react';

// In tools array:
{ 
  id: 'crop', 
  label: 'Crop', 
  icon: Crop,
  description: 'Crop image'
}
```

#### Step 2: Implement Crop Interaction
**File**: `src/tools/screenshot/components/CanvasPreview.tsx`

Replace TODO at line 304 with:

```typescript
const handleMouseDown = (opt: any) => {
    const { isCropping } = useXnapperStore.getState();
    
    if (isCropping) {
        // Start crop selection
        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getScenePoint(opt.e);
        
        // Create crop rectangle
        const cropRect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'rgba(0, 0, 0, 0.3)',
            stroke: '#3b82f6',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockRotation: true,
        });
        
        canvas.add(cropRect);
        cropRectRef.current = cropRect;
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };
        
        return;
    }
    
    // ... rest of annotation logic
};

const handleMouseMove = (opt: any) => {
    const { isCropping } = useXnapperStore.getState();
    
    if (isCropping && isDrawingRef.current && cropRectRef.current) {
        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getScenePoint(opt.e);
        const start = startPointRef.current;
        
        const left = Math.min(start.x, pointer.x);
        const top = Math.min(start.y, pointer.y);
        const width = Math.abs(pointer.x - start.x);
        const height = Math.abs(pointer.y - start.y);
        
        cropRectRef.current.set({ left, top, width, height });
        canvas.requestRenderAll();
        return;
    }
    
    // ... rest of annotation logic
};

const handleMouseUp = () => {
    const { isCropping, setCropBounds } = useXnapperStore.getState();
    
    if (isCropping && cropRectRef.current) {
        // Save crop bounds
        const rect = cropRectRef.current;
        setCropBounds({
            x: rect.left || 0,
            y: rect.top || 0,
            width: rect.width || 0,
            height: rect.height || 0,
        });
        
        isDrawingRef.current = false;
        startPointRef.current = null;
        return;
    }
    
    // ... rest of annotation logic
};
```

#### Step 3: Add Crop Apply/Cancel Buttons
**File**: `src/tools/screenshot/components/PreviewSection.tsx`

```typescript
// Add crop controls when isCropping is true
{isCropping && (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-glass-panel p-3 rounded-lg border border-border-glass">
        <Button
            variant="primary"
            onClick={handleApplyCrop}
            size="sm"
        >
            Apply Crop
        </Button>
        <Button
            variant="secondary"
            onClick={handleCancelCrop}
            size="sm"
        >
            Cancel
        </Button>
    </div>
)}
```

#### Step 4: Integrate Crop Utility
**File**: `src/tools/screenshot/utils/crop.ts`

Ensure `applyCrop` function is properly integrated:

```typescript
export async function applyCrop(
    imageDataUrl: string,
    cropBounds: CropBounds
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            
            canvas.width = cropBounds.width;
            canvas.height = cropBounds.height;
            
            ctx.drawImage(
                img,
                cropBounds.x,
                cropBounds.y,
                cropBounds.width,
                cropBounds.height,
                0,
                0,
                cropBounds.width,
                cropBounds.height
            );
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = imageDataUrl;
    });
}
```

### Testing Checklist
- [ ] Crop tool button appears in toolbar
- [ ] Click crop tool activates crop mode
- [ ] Drag to create crop rectangle
- [ ] Crop rectangle has resize handles
- [ ] Apply crop updates the image
- [ ] Cancel crop removes crop rectangle
- [ ] Crop works with other features (annotations, background)

---

## 🎯 Priority 2: Share Functionality

### Implementation Plan

#### Step 1: Add Electron IPC Handler
**File**: `electron/main/index.ts` (or main process file)

```typescript
import { shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

ipcMain.handle('share-image', async (event, { dataUrl, filename }) => {
    try {
        // Save to temp file
        const tempDir = os.tmpdir();
        const tempPath = path.join(tempDir, filename);
        
        // Convert data URL to buffer
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Write file
        fs.writeFileSync(tempPath, buffer);
        
        // Open share dialog (macOS)
        if (process.platform === 'darwin') {
            // Use macOS share sheet
            const { exec } = require('child_process');
            exec(`open -a "Finder" "${tempPath}"`);
            
            // Or use native share:
            // This requires additional native module
        }
        
        return { success: true, path: tempPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Copy to clipboard
ipcMain.handle('copy-to-clipboard', async (event, dataUrl) => {
    const { nativeImage, clipboard } = require('electron');
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
    return { success: true };
});
```

#### Step 2: Add Share Buttons to ExportPanel
**File**: `src/tools/screenshot/components/ExportPanel.tsx`

```typescript
import { Share2, Copy, Download } from 'lucide-react';

// Add share section
<div className="space-y-3">
    <h3 className="text-sm font-medium">Share</h3>
    
    <div className="grid grid-cols-2 gap-2">
        <Button
            variant="secondary"
            onClick={handleCopyToClipboard}
            icon={Copy}
            size="sm"
        >
            Copy
        </Button>
        
        <Button
            variant="secondary"
            onClick={handleShare}
            icon={Share2}
            size="sm"
        >
            Share
        </Button>
    </div>
</div>

// Handlers
const handleCopyToClipboard = async () => {
    const finalImage = await generateFinalExportImage();
    await window.electron.copyToClipboard(finalImage);
    toast.success('Copied to clipboard!');
};

const handleShare = async () => {
    const finalImage = await generateFinalExportImage();
    const filename = `screenshot-${Date.now()}.png`;
    const result = await window.electron.shareImage(finalImage, filename);
    
    if (result.success) {
        toast.success('Opening share dialog...');
    } else {
        toast.error('Failed to share');
    }
};
```

#### Step 3: Add Electron Preload
**File**: `electron/preload/index.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    shareImage: (dataUrl: string, filename: string) => 
        ipcRenderer.invoke('share-image', { dataUrl, filename }),
    
    copyToClipboard: (dataUrl: string) => 
        ipcRenderer.invoke('copy-to-clipboard', dataUrl),
});
```

### Testing Checklist
- [ ] Copy to clipboard works
- [ ] Share button opens native share dialog (macOS)
- [ ] Shared image has correct format
- [ ] Share works with all export settings

---

## 🎯 Priority 3: Templates System

### Implementation Plan

#### Step 1: Define Template Structure
**File**: `src/tools/screenshot/types/templates.ts`

```typescript
export interface ScreenshotTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    category: 'code' | 'social' | 'presentation' | 'custom';
    
    // Settings
    background: Background | null;
    backgroundPadding: number;
    autoBalance: boolean;
    
    // Redaction rules
    autoRedact: boolean;
    redactionPatterns: string[]; // Pattern types to auto-detect
    redactionMethod: 'blur' | 'pixelate' | 'solid';
    
    // Export settings
    exportFormat: ExportFormat;
    exportQuality: number;
    outputConfig?: OutputConfig;
    
    // Annotation presets
    annotationConfig?: Partial<AnnotationConfig>;
}

export const BUILT_IN_TEMPLATES: ScreenshotTemplate[] = [
    {
        id: 'code-showcase',
        name: 'Code Showcase',
        description: 'Perfect for sharing code snippets',
        category: 'code',
        background: {
            type: 'gradient',
            gradient: {
                type: 'linear',
                angle: 135,
                colors: ['#667eea', '#764ba2']
            }
        },
        backgroundPadding: 60,
        autoBalance: true,
        autoRedact: true,
        redactionPatterns: ['email', 'apiKey', 'ip'],
        redactionMethod: 'blur',
        exportFormat: 'png',
        exportQuality: 100,
        outputConfig: {
            mode: 'preset',
            preset: 'twitter-16-9'
        }
    },
    {
        id: 'social-post',
        name: 'Social Media Post',
        description: 'Optimized for Instagram/Twitter',
        category: 'social',
        background: {
            type: 'gradient',
            gradient: {
                type: 'linear',
                angle: 45,
                colors: ['#f093fb', '#f5576c']
            }
        },
        backgroundPadding: 40,
        autoBalance: true,
        autoRedact: false,
        redactionPatterns: [],
        redactionMethod: 'blur',
        exportFormat: 'jpg',
        exportQuality: 90,
        outputConfig: {
            mode: 'preset',
            preset: 'instagram-square'
        }
    },
    {
        id: 'presentation',
        name: 'Presentation',
        description: 'Clean look for slides',
        category: 'presentation',
        background: {
            type: 'solid',
            color: '#ffffff'
        },
        backgroundPadding: 80,
        autoBalance: true,
        autoRedact: true,
        redactionPatterns: ['email', 'phone'],
        redactionMethod: 'solid',
        exportFormat: 'png',
        exportQuality: 100,
        outputConfig: {
            mode: 'original'
        }
    }
];
```

#### Step 2: Add Templates to Store
**File**: `src/store/xnapperStore.ts`

```typescript
interface XnapperState {
    // ... existing state
    
    // Templates
    templates: ScreenshotTemplate[];
    activeTemplate: string | null;
    applyTemplate: (templateId: string) => void;
    saveAsTemplate: (name: string, description: string) => void;
    deleteTemplate: (templateId: string) => void;
}

// In store implementation:
templates: BUILT_IN_TEMPLATES,
activeTemplate: null,

applyTemplate: (templateId) => set((state) => {
    const template = state.templates.find(t => t.id === templateId);
    if (!template) return state;
    
    return {
        activeTemplate: templateId,
        background: template.background,
        backgroundPadding: template.backgroundPadding,
        autoBalance: template.autoBalance,
        exportFormat: template.exportFormat,
        exportQuality: template.exportQuality,
        annotationConfig: {
            ...state.annotationConfig,
            ...template.annotationConfig
        }
    };
}),

saveAsTemplate: (name, description) => set((state) => {
    const newTemplate: ScreenshotTemplate = {
        id: `custom-${Date.now()}`,
        name,
        description,
        category: 'custom',
        background: state.background,
        backgroundPadding: state.backgroundPadding,
        autoBalance: state.autoBalance,
        autoRedact: false,
        redactionPatterns: [],
        redactionMethod: 'blur',
        exportFormat: state.exportFormat,
        exportQuality: state.exportQuality,
        annotationConfig: state.annotationConfig
    };
    
    return {
        templates: [...state.templates, newTemplate]
    };
}),

deleteTemplate: (templateId) => set((state) => ({
    templates: state.templates.filter(t => t.id !== templateId && !t.id.startsWith('custom-'))
})),
```

#### Step 3: Create Templates Panel
**File**: `src/tools/screenshot/components/TemplatesPanel.tsx`

```typescript
import React from 'react';
import { useXnapperStore } from '../../../store/xnapperStore';
import { Button } from '../../../components/ui/Button';
import { Save, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const TemplatesPanel: React.FC = () => {
    const { templates, activeTemplate, applyTemplate, saveAsTemplate, deleteTemplate } = useXnapperStore();
    
    const [showSaveDialog, setShowSaveDialog] = React.useState(false);
    const [templateName, setTemplateName] = React.useState('');
    const [templateDesc, setTemplateDesc] = React.useState('');
    
    const handleSaveTemplate = () => {
        if (!templateName.trim()) return;
        saveAsTemplate(templateName, templateDesc);
        setShowSaveDialog(false);
        setTemplateName('');
        setTemplateDesc('');
    };
    
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Templates</h3>
                <Button
                    variant="secondary"
                    size="sm"
                    icon={Save}
                    onClick={() => setShowSaveDialog(true)}
                >
                    Save Current
                </Button>
            </div>
            
            {/* Built-in Templates */}
            <div className="space-y-2">
                <h4 className="text-xs text-foreground-secondary">Built-in</h4>
                <div className="grid grid-cols-1 gap-2">
                    {templates.filter(t => t.category !== 'custom').map(template => (
                        <button
                            key={template.id}
                            onClick={() => applyTemplate(template.id)}
                            className={cn(
                                "p-3 rounded-lg border text-left transition-all hover:border-indigo-500",
                                activeTemplate === template.id
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-border-glass bg-glass-panel"
                            )}
                        >
                            <div className="font-medium text-sm">{template.name}</div>
                            <div className="text-xs text-foreground-secondary mt-1">
                                {template.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Custom Templates */}
            {templates.some(t => t.category === 'custom') && (
                <div className="space-y-2">
                    <h4 className="text-xs text-foreground-secondary">Custom</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {templates.filter(t => t.category === 'custom').map(template => (
                            <div
                                key={template.id}
                                className={cn(
                                    "p-3 rounded-lg border transition-all group",
                                    activeTemplate === template.id
                                        ? "border-indigo-500 bg-indigo-500/10"
                                        : "border-border-glass bg-glass-panel"
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <button
                                        onClick={() => applyTemplate(template.id)}
                                        className="flex-1 text-left"
                                    >
                                        <div className="font-medium text-sm">{template.name}</div>
                                        <div className="text-xs text-foreground-secondary mt-1">
                                            {template.description}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => deleteTemplate(template.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Save Template Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-glass-panel border border-border-glass rounded-lg p-6 w-96">
                        <h3 className="text-lg font-medium mb-4">Save Template</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Template name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border-glass rounded-lg"
                            />
                            <textarea
                                placeholder="Description (optional)"
                                value={templateDesc}
                                onChange={(e) => setTemplateDesc(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border-glass rounded-lg resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="primary"
                                onClick={handleSaveTemplate}
                                disabled={!templateName.trim()}
                            >
                                Save
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowSaveDialog(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
```

#### Step 4: Add Templates Tab to Main UI
**File**: `src/tools/screenshot/Xnapper.tsx`

```typescript
import { TemplatesPanel } from './components/TemplatesPanel';
import { Layout } from 'lucide-react';

// Add to panels array:
const panels: Array<{ id: SidePanel; label: string; icon: any }> = [
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'redaction', label: 'Redaction', icon: Shield },
    { id: 'background', label: 'Background', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'history', label: 'History', icon: Clock },
];

// Add to panel content:
{activePanel === 'templates' && <TemplatesPanel />}
```

### Testing Checklist
- [ ] Built-in templates appear
- [ ] Clicking template applies settings
- [ ] Save current settings as template
- [ ] Custom templates persist
- [ ] Delete custom templates
- [ ] Template preview shows correct settings

---

## 🎯 Priority 4: Batch Processing

### Implementation Plan

#### Step 1: Add Batch Mode to Store
**File**: `src/store/xnapperStore.ts`

```typescript
interface XnapperState {
    // ... existing state
    
    // Batch processing
    batchMode: boolean;
    setBatchMode: (enabled: boolean) => void;
    batchScreenshots: Screenshot[];
    addToBatch: (screenshot: Screenshot) => void;
    removeFromBatch: (id: string) => void;
    clearBatch: () => void;
    batchSettings: {
        applyTemplate?: string;
        autoRedact: boolean;
        exportFormat: ExportFormat;
        exportQuality: number;
    };
    setBatchSettings: (settings: Partial<typeof batchSettings>) => void;
}

// Implementation:
batchMode: false,
setBatchMode: (enabled) => set({ batchMode: enabled }),
batchScreenshots: [],
addToBatch: (screenshot) => set((state) => ({
    batchScreenshots: [...state.batchScreenshots, screenshot]
})),
removeFromBatch: (id) => set((state) => ({
    batchScreenshots: state.batchScreenshots.filter(s => s.id !== id)
})),
clearBatch: () => set({ batchScreenshots: [] }),
batchSettings: {
    autoRedact: false,
    exportFormat: 'png',
    exportQuality: 90
},
setBatchSettings: (settings) => set((state) => ({
    batchSettings: { ...state.batchSettings, ...settings }
})),
```

#### Step 2: Create Batch Processing Panel
**File**: `src/tools/screenshot/components/BatchPanel.tsx`

```typescript
import React from 'react';
import { useXnapperStore } from '../../../store/xnapperStore';
import { Button } from '../../../components/ui/Button';
import { Upload, Download, Trash2, Settings } from 'lucide-react';
import { generateFinalImage } from '../utils/exportUtils';
import { toast } from 'sonner';

export const BatchPanel: React.FC = () => {
    const {
        batchScreenshots,
        addToBatch,
        removeFromBatch,
        clearBatch,
        batchSettings,
        setBatchSettings,
        templates
    } = useXnapperStore();
    
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    
    const handleAddFiles = async (files: FileList) => {
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const screenshot = {
                    id: `batch-${Date.now()}-${Math.random()}`,
                    dataUrl: e.target?.result as string,
                    width: 0, // Will be calculated
                    height: 0,
                    timestamp: Date.now(),
                    format: 'png' as const
                };
                addToBatch(screenshot);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleProcessBatch = async () => {
        if (batchScreenshots.length === 0) return;
        
        setIsProcessing(true);
        const results: string[] = [];
        
        for (let i = 0; i < batchScreenshots.length; i++) {
            const screenshot = batchScreenshots[i];
            setProgress(((i + 1) / batchScreenshots.length) * 100);
            
            try {
                // Apply template if selected
                let settings = { ...batchSettings };
                if (batchSettings.applyTemplate) {
                    const template = templates.find(t => t.id === batchSettings.applyTemplate);
                    if (template) {
                        settings = {
                            ...settings,
                            // Apply template settings
                        };
                    }
                }
                
                // Process image
                const finalImage = await generateFinalImage(screenshot.dataUrl, {
                    autoBalance: true,
                    redactionAreas: [],
                    background: null,
                    backgroundPadding: 40
                });
                
                results.push(finalImage);
            } catch (error) {
                console.error('Failed to process:', screenshot.id, error);
            }
        }
        
        // Download all as zip or individual files
        await downloadBatchResults(results);
        
        setIsProcessing(false);
        setProgress(0);
        toast.success(`Processed ${results.length} images!`);
    };
    
    const downloadBatchResults = async (results: string[]) => {
        // For now, download individually
        // TODO: Create zip file
        for (let i = 0; i < results.length; i++) {
            const link = document.createElement('a');
            link.href = results[i];
            link.download = `batch-${i + 1}.${batchSettings.exportFormat}`;
            link.click();
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Batch Processing</h3>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={Upload}
                        onClick={() => document.getElementById('batch-upload')?.click()}
                    >
                        Add Files
                    </Button>
                    <input
                        id="batch-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                    />
                </div>
            </div>
            
            {/* Batch Settings */}
            <div className="p-3 bg-glass-panel rounded-lg border border-border-glass space-y-3">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Settings</span>
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs text-foreground-secondary">Template</label>
                    <select
                        value={batchSettings.applyTemplate || ''}
                        onChange={(e) => setBatchSettings({ applyTemplate: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border-glass rounded-lg text-sm"
                    >
                        <option value="">None</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={batchSettings.autoRedact}
                        onChange={(e) => setBatchSettings({ autoRedact: e.target.checked })}
                        className="rounded"
                    />
                    <label className="text-sm">Auto-redact sensitive data</label>
                </div>
            </div>
            
            {/* Batch Queue */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">
                        {batchScreenshots.length} files
                    </span>
                    {batchScreenshots.length > 0 && (
                        <button
                            onClick={clearBatch}
                            className="text-xs text-red-400 hover:text-red-300"
                        >
                            Clear All
                        </button>
                    )}
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                    {batchScreenshots.map((screenshot, index) => (
                        <div
                            key={screenshot.id}
                            className="flex items-center gap-3 p-2 bg-glass-panel rounded-lg border border-border-glass"
                        >
                            <img
                                src={screenshot.dataUrl}
                                alt={`Batch ${index + 1}`}
                                className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">Image {index + 1}</div>
                                <div className="text-xs text-foreground-secondary">
                                    {screenshot.width} × {screenshot.height}
                                </div>
                            </div>
                            <button
                                onClick={() => removeFromBatch(screenshot.id)}
                                className="p-1 hover:bg-red-500/20 rounded"
                            >
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Process Button */}
            {batchScreenshots.length > 0 && (
                <div className="space-y-2">
                    {isProcessing && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-foreground-secondary">
                                <span>Processing...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-background rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    
                    <Button
                        variant="primary"
                        onClick={handleProcessBatch}
                        disabled={isProcessing}
                        icon={Download}
                        className="w-full"
                    >
                        {isProcessing ? 'Processing...' : `Process ${batchScreenshots.length} Images`}
                    </Button>
                </div>
            )}
        </div>
    );
};
```

#### Step 3: Add Batch Tab
**File**: `src/tools/screenshot/Xnapper.tsx`

```typescript
import { BatchPanel } from './components/BatchPanel';
import { Layers } from 'lucide-react';

// Add to panels:
{ id: 'batch', label: 'Batch', icon: Layers }

// Add to panel content:
{activePanel === 'batch' && <BatchPanel />}
```

### Testing Checklist
- [ ] Upload multiple images
- [ ] Preview batch queue
- [ ] Apply template to batch
- [ ] Process batch with progress
- [ ] Download all results
- [ ] Remove individual items
- [ ] Clear entire batch

---

## 📅 Implementation Timeline

### Week 1: Crop Tool
- Day 1-2: Implement crop UI and interaction
- Day 3: Integrate crop utility
- Day 4-5: Testing and refinement

### Week 2: Share Functionality
- Day 1-2: Electron IPC handlers
- Day 3: UI integration
- Day 4-5: Testing across platforms

### Week 3: Templates System
- Day 1-2: Template structure and store
- Day 3-4: Templates UI
- Day 5: Testing and built-in templates

### Week 4: Batch Processing
- Day 1-2: Batch mode and queue
- Day 3-4: Batch processing logic
- Day 5: Testing and optimization

---

## 🎯 Success Criteria

### Crop Tool
- ✅ User can select crop area
- ✅ Crop rectangle has resize handles
- ✅ Apply crop updates image
- ✅ Works with all other features

### Share
- ✅ Copy to clipboard works
- ✅ Native share dialog opens
- ✅ Shared image has correct format

### Templates
- ✅ 3+ built-in templates
- ✅ Save custom templates
- ✅ Apply template updates all settings
- ✅ Templates persist across sessions

### Batch Processing
- ✅ Upload multiple images
- ✅ Apply settings to all
- ✅ Progress indicator
- ✅ Download all results
