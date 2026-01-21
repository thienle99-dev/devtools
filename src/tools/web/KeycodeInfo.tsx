import { useState, useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '@components/ui/Card';

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  isComposing: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
}

export const KeycodeInfo = () => {
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setKeyInfo({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        location: e.location,
        isComposing: e.isComposing,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        repeat: e.repeat
      });
    };

    // We can attach to window for global capture when this component is mounted
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ToolPane
      title="Keycode Info"
      description="Press any key to get its Javascript keyboard event information"
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 bg-muted/10 rounded-xl border border-border">
            {!keyInfo ? (
                <div className="text-muted-foreground animate-pulse flex flex-col items-center">
                    <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/50 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-4xl">⌨️</span>
                    </div>
                    <h2 className="text-2xl font-bold">Press any key</h2>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in duration-200">
                    <div className="text-8xl font-bold text-foreground mb-2 font-mono">
                        {keyInfo.key === ' ' ? 'Space' : keyInfo.key}
                    </div>
                    <div className="text-2xl text-primary font-mono">
                        {keyInfo.code}
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
            {!keyInfo ? (
                <div className="flex items-center justify-center h-full text-muted-foreground italic p-8 border border-dashed border-border rounded-xl">
                    Event details will appear here...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <Card className="p-4 space-y-4">
                        <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2">Event Properties</h3>
                        <InfoRow label="e.key" value={keyInfo.key} />
                        <InfoRow label="e.code" value={keyInfo.code} />
                        <InfoRow label="e.which" value={keyInfo.which} />
                        <InfoRow label="e.keyCode" value={keyInfo.keyCode} deprecated />
                    </Card>

                    <Card className="p-4 space-y-4">
                        <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2">Modifiers & State</h3>
                         <InfoRow label="Shift" value={keyInfo.shiftKey} type="boolean" />
                         <InfoRow label="Ctrl" value={keyInfo.ctrlKey} type="boolean" />
                         <InfoRow label="Alt" value={keyInfo.altKey} type="boolean" />
                         <InfoRow label="Meta (Cmd/Win)" value={keyInfo.metaKey} type="boolean" />
                         <InfoRow label="Repeat" value={keyInfo.repeat} type="boolean" />
                    </Card>
                     <Card className="p-4 space-y-4">
                        <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2">Details</h3>
                        <InfoRow label="Location" value={locationMap[keyInfo.location] || keyInfo.location} />
                        <InfoRow label="Is Composing" value={keyInfo.isComposing} type="boolean" />
                    </Card>
                </div>
            )}
        </div>
      </div>
    </ToolPane>
  );
};

const InfoRow = ({ label, value, deprecated, type = 'text' }: { label: string, value: any, deprecated?: boolean, type?: 'text' | 'boolean' }) => (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
        <span className="text-muted-foreground font-mono text-sm flex items-center">
            {label}
            {deprecated && <span className="ml-2 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded uppercase">Deprecated</span>}
        </span>
        {type === 'boolean' ? (
             <span className={`text-sm font-mono px-2 py-0.5 rounded ${value ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {value.toString()}
            </span>
        ) : (
             <span className="text-foreground font-mono text-lg font-semibold bg-muted/50 px-2 rounded">
                 {typeof value === 'string' && value === ' ' ? '(Space)' : value}
             </span>
        )}
    </div>
);

const locationMap: Record<number, string> = {
    0: '0 - Standard',
    1: '1 - Left',
    2: '2 - Right',
    3: '3 - Numpad'
};
