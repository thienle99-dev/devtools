import React, { useMemo, useState, useEffect } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { useSettingsStore } from '../../store/settingsStore';
import { cn } from '@utils/cn';
import { loadCodeMirrorLanguage } from '@utils/lazyLoad';

interface CodeEditorProps extends ReactCodeMirrorProps {
    language?: 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'sql' | 'yaml' | 'markdown' | 'text' | 'diff' | 'xml';
    className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    language = 'text',
    className,
    theme: propTheme,
    extensions = [],
    ...props
}) => {
    const { theme: appTheme } = useSettingsStore();
    const [langExt, setLangExt] = useState<any>([]);

    // Lazy load language extension
    useEffect(() => {
        let active = true;
        if (language === 'text' || !language) {
            setLangExt([]);
            return;
        }

        loadCodeMirrorLanguage(language).then((m: any) => {
            if (active && m) {
                // Determine the correct function call based on common CM6 patterns
                const extFn = m[language === 'xml' ? 'xml' : language === 'typescript' ? 'javascript' : language];
                if (typeof extFn === 'function') {
                    setLangExt(language === 'typescript' ? extFn({ typescript: true }) : extFn());
                } else if (m.default && typeof m.default === 'function') {
                    setLangExt(m.default());
                } else {
                    setLangExt([]);
                }
            }
        }).catch(err => {
            console.error(`Failed to load language ${language}:`, err);
            if (active) setLangExt([]);
        });

        return () => { active = false; };
    }, [language]);

    // Create a custom glassmorphism theme
    const glassTheme = useMemo(() => {
        const isDark = appTheme === 'dark' || (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        return EditorView.theme({
            "&": {
                backgroundColor: "transparent !important",
                height: "100%",
                color: isDark ? "#e2e8f0" : "#1e293b",
                fontSize: "13px",
            },
            ".cm-gutters": {
                backgroundColor: "transparent !important",
                borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                color: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
            },
            ".cm-activeLine": {
                backgroundColor: "rgba(99, 102, 241, 0.05) !important",
            },
            ".cm-activeLineGutter": {
                backgroundColor: "rgba(99, 102, 241, 0.1) !important",
                color: "var(--accent-color, #6366f1)",
            },
            ".cm-cursor": {
                borderLeftColor: "var(--accent-color, #6366f1)",
            },
            ".cm-selectionBackground, ::selection": {
                backgroundColor: "rgba(99, 102, 241, 0.25) !important",
            },
            "&.cm-focused": {
                outline: "none",
            },
            ".cm-scroller": {
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            }
        }, { dark: isDark });
    }, [appTheme]);

    return (
        <div className={cn(
            "relative w-full h-full overflow-hidden rounded-xl border border-border-glass bg-glass-input/50 focus-within:bg-glass-input/80 transition-all duration-300",
            className
        )}>
            <CodeMirror
                theme={[glassTheme, ...(Array.isArray(propTheme) ? propTheme : [propTheme].filter(Boolean))]}
                extensions={[langExt, ...extensions]}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    history: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    defaultKeymap: true,
                    searchKeymap: true,
                    historyKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                }}
                className="h-full w-full"
                height="100%"
                {...props}
            />
        </div>
    );
};
