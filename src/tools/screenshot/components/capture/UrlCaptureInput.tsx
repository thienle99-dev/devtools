import React from 'react';
import { Globe } from 'lucide-react';

interface UrlCaptureInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

export const UrlCaptureInput: React.FC<UrlCaptureInputProps> = ({ value, onChange, onSubmit }) => (
    <div className="space-y-3">
        <h3
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
        >
            <Globe className="w-4 h-4 inline mr-2" />
            Web Page URL
        </h3>
        <div className="space-y-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-5 py-4 bg-glass-panel border-2 border-border-glass rounded-2xl focus:border-indigo-500 focus:outline-none font-medium transition-all shadow-sm"
                style={{ color: 'var(--color-text-primary)' }}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                autoFocus
            />
            <p
                className="text-xs flex items-start gap-2 px-2"
                style={{ color: 'var(--color-text-muted)' }}
            >
                <span>💡</span>
                <span>We'll capture the full scrolling page automatically</span>
            </p>
        </div>
    </div>
);

UrlCaptureInput.displayName = 'UrlCaptureInput';
