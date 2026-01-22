import { useState, useRef, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Bold, Italic, Underline, List, ListOrdered, Link, Code, Type, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Eraser } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { githubDark } from '@uiw/codemirror-theme-github';
import { toast } from 'sonner';

const TOOL_ID = 'html-wysiwyg';

export const HtmlWysiwyg = () => {
  const [content, setContent] = useState('<p>Start editing...</p>');
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'visual' && editorRef.current) {
        if (editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }
  }, [mode]);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ icon: Icon, command, value, title }: { icon: any, command: string, value?: string, title: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => exec(command, value)}
      title={title}
      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  const handleCopy = () => {
      navigator.clipboard.writeText(content);
      toast.success('HTML copied to clipboard');
  };

  const handleClear = () => {
      setContent('');
      if (editorRef.current) editorRef.current.innerHTML = '';
  };

  return (
    <ToolPane
      title="HTML WYSIWYG Editor"
      description="Rich text editor with HTML source view"
      toolId={TOOL_ID}
    >
      <div className="h-full flex flex-col p-4 gap-4">
        {/* Toolbar */}
        <Card className="p-2 flex items-center justify-between bg-muted/50 border-border shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
                <ToolbarButton icon={Undo} command="undo" title="Undo" />
                <ToolbarButton icon={Redo} command="redo" title="Redo" />
                <div className="w-px h-6 bg-border mx-1" />
                <ToolbarButton icon={Bold} command="bold" title="Bold" />
                <ToolbarButton icon={Italic} command="italic" title="Italic" />
                <ToolbarButton icon={Underline} command="underline" title="Underline" />
                <ToolbarButton icon={Eraser} command="removeFormat" title="Clear Format" />
                <div className="w-px h-6 bg-border mx-1" />
                <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" />
                <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" />
                <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" />
                <div className="w-px h-6 bg-border mx-1" />
                <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
                <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered List" />
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        const url = prompt('Enter URL:');
                        if (url) exec('createLink', url);
                    }}
                    title="Insert Link"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                    <Link className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                 <button
                    onClick={() => setMode('visual')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'visual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                    <Type className="w-4 h-4 mr-1 inline-block" /> Visual
                 </button>
                 <button
                    onClick={() => setMode('code')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'code' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                    <Code className="w-4 h-4 mr-1 inline-block" /> Source
                 </button>
            </div>
        </Card>

        {/* Editor Area */}
        <Card className="flex-1 overflow-hidden p-0 bg-background text-foreground relative flex flex-col">
             {mode === 'visual' ? (
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="w-full h-full p-6 outline-none overflow-auto prose max-w-none dark:prose-invert"
                    style={{ minHeight: '100%' }}
                />
            ) : (
                <CodeMirror
                    value={content}
                    height="100%"
                    extensions={[html()]}
                    theme={githubDark} // Should strictly be dynamic based on theme, but githubDark is fine for code usually
                    onChange={(val) => setContent(val)}
                    className="h-full text-base"
                />
            )}
        </Card>

        <div className="flex justify-end gap-2 shrink-0">
             <Button variant="ghost" onClick={handleClear}>Clear</Button>
             <Button onClick={handleCopy}>Copy HTML</Button>
        </div>
      </div>
    </ToolPane>
  );
};
