import React, { useMemo } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { sql } from '@codemirror/lang-sql';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';
import { useSettingsStore } from '../../store/settingsStore';
import { cn } from '../../utils/cn';

interface CodeEditorProps extends ReactCodeMirrorProps {
    language?: 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'sql' | 'yaml' | 'markdown' | 'text' | 'diff';
    className?: string;
}

const getLanguageExtension = (lang: CodeEditorProps['language']) => {
    switch (lang) {
        case 'json': return json();
        case 'javascript':
        case 'typescript': return javascript({ typescript: true });
        case 'html': return html();
        case 'css': return css();
        case 'sql': return sql();
        case 'yaml': return yaml();
        default: return [];
    }
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
    language = 'text',
    className,
    theme: propTheme,
    extensions = [],
    ...props
}) => {
    const { theme: appTheme } = useSettingsStore();

    // Create a custom glassmorphism theme
    const glassTheme = useMemo(() => {
        return EditorView.theme({
            "&": {
                backgroundColor: "transparent !important",
                height: "100%",
                color: "var(--color-text-primary)",
                fontSize: "13px", // Match existing font size
            },
            ".cm-gutters": {
                backgroundColor: "transparent !important",
                borderRight: "1px solid var(--color-glass-border)",
                color: "var(--color-text-muted)",
            },
            ".cm-gutterElement": {
                backgroundColor: "transparent !important",
            },
            ".cm-activeLine": {
                backgroundColor: "var(--color-glass-button-hover) !important",
            },
            ".cm-activeLineGutter": {
                backgroundColor: "var(--color-glass-button-hover) !important",
                color: "var(--color-text-primary)",
            },
            ".cm-cursor": {
                borderLeftColor: "var(--color-text-primary)",
            },
            ".cm-selectionBackground, ::selection": {
                backgroundColor: "rgba(79, 70, 229, 0.3) !important", // Indigo/primary selection
            },
            "&.cm-focused": {
                outline: "none",
            },
            ".cm-scroller": {
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            }
        }, { dark: appTheme === 'dark' || (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) });
    }, [appTheme]);

    // Use a base theme (like github dark/light) and override with glass, or just glass + syntax highlighting?
    // For now, let's rely on the default syntax highlighting or maybe import one.
    // However, CodeMirror default comes with some highlighting.
    // Ideally, we'd use a theme that supports transparency nicely.
    // Let's assume the default one is okayish but might need color tweaks for syntax.
    // For a "premium" feel, we might want to manually define syntax colors or import `githubDark` / `githubLight` and override the background.

    // Let's import github themes dynamically if we want, but simpler is to just let it be for now and refine syntax colors later if needed.
    // Actually, `uiw/react-codemirror` supports `theme='dark'` or `theme='light'` prop which loads a basic theme.
    // But we want transparent background.

    // Let's just pass `glassTheme` as the ONLY theme extension for now to override core styles, 
    // and let the default syntax highlighter do its job (which works based on tags).

    const langExtension = useMemo(() => getLanguageExtension(language), [language]);

    return (
        <div className={cn(
            "relative w-full h-full overflow-hidden rounded-xl border border-border-glass bg-glass-input hover:bg-glass-input-focus transition-colors",
            "focus-within:ring-1 focus-within:ring-border-glass focus-within:bg-glass-input-focus", // Focus ring
            className
        )}>
            <CodeMirror
                theme={[glassTheme, ...(Array.isArray(propTheme) ? propTheme : [propTheme].filter(Boolean))]}
                extensions={[langExtension, ...extensions]}
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
