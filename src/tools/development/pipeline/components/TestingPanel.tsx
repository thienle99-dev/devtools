import React from 'react';
import { Button } from '@components/ui/Button';
import { Copy, Download } from 'lucide-react';
import { cn } from '@utils/cn';

interface TestingPanelProps {
    inputValue: string;
    onInputChange: (value: string) => void;
    outputValue: string;
    onCopyOutput: () => void;
    onDownloadOutput: () => void;
    hasOutput: boolean;
}

export const TestingPanel: React.FC<TestingPanelProps> = ({
    inputValue,
    onInputChange,
    outputValue,
    onCopyOutput,
    onDownloadOutput,
    hasOutput,
}) => (
    <div className="flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <label className="text-[10px] font-bold uppercase opacity-50 ml-1 text-foreground-muted">Initial Input</label>
            <textarea
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Paste initial data here..."
                className="flex-1 glass-input rounded-xl p-4 text-xs font-mono resize-none focus:outline-none focus:border-indigo-500/50"
            />
        </div>
        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase opacity-50 ml-1 text-foreground-muted">Pipeline Output</label>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="xs" icon={Copy} onClick={onCopyOutput} />
                    <Button variant="ghost" size="xs" icon={Download} onClick={onDownloadOutput} />
                </div>
            </div>
            <textarea
                value={outputValue}
                readOnly
                placeholder="Execution result will appear here..."
                className={cn(
                    "flex-1 bg-indigo-500/5 border border-border-glass rounded-xl p-4 text-xs font-mono resize-none focus:outline-none text-foreground",
                    hasOutput && "text-indigo-400"
                )}
            />
        </div>
    </div>
);

TestingPanel.displayName = 'TestingPanel';
