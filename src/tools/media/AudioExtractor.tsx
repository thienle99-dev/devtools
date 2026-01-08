import { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToast, ToastContainer } from '@components/ui/Toast';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Select } from '@components/ui/Select';
import { 
    Music, 
    Upload, 
    FileAudio, 
    Download,
    Scissors,
    Volume2,
    TrendingUp,
    TrendingDown,
    FolderOpen,
    Trash2,
    Settings,
    Loader2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { cn } from '@utils/cn';
import { formatBytes, formatDuration } from '@utils/format';
import type { AudioExtractionOptions, AudioExtractionProgress, AudioInfo, AudioFormat, AudioBitrate } from '@/types/audio-extractor';

export default function AudioExtractor() {
    // State
    const [inputFile, setInputFile] = useState<string | null>(null);
    const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
    const [loadingInfo, setLoadingInfo] = useState(false);
    
    // Options
    const [format, setFormat] = useState<AudioFormat>('mp3');
    const [bitrate, setBitrate] = useState<AudioBitrate>('192k');
    const [sampleRate, setSampleRate] = useState<44100 | 48000>(44100);
    const [channels, setChannels] = useState<1 | 2>(2);
    
    // Trim
    const [trimEnabled, setTrimEnabled] = useState(false);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    
    // Effects
    const [normalize, setNormalize] = useState(false);
    const [fadeIn, setFadeIn] = useState(0);
    const [fadeOut, setFadeOut] = useState(0);
    
    // Output
    const [outputFolder, setOutputFolder] = useState('');
    
    // Processing
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState<AudioExtractionProgress | null>(null);
    const [currentId, setCurrentId] = useState<string | null>(null);
    
    const { toasts, removeToast, success, error } = useToast();

    // Listen for progress
    useEffect(() => {
        const cleanup = window.audioAPI.onProgress((prog: AudioExtractionProgress) => {
            setProgress(prog);
            
            if (prog.state === 'complete') {
                setProcessing(false);
                success('Audio extracted successfully!', prog.filename);
                // Reset
                setInputFile(null);
                setAudioInfo(null);
                setProgress(null);
            } else if (prog.state === 'error') {
                setProcessing(false);
                error('Extraction failed', prog.error || 'Unknown error');
            }
        });

        return cleanup;
    }, []);

    const handleChooseFile = async () => {
        const file = await window.audioAPI.chooseInputFile();
        if (file) {
            setInputFile(file);
            loadAudioInfo(file);
        }
    };

    const loadAudioInfo = async (filePath: string) => {
        setLoadingInfo(true);
        try {
            const info = await window.audioAPI.getInfo(filePath);
            setAudioInfo(info);
            
            if (!info.hasAudio) {
                error('No audio found', 'This file does not contain an audio stream');
                setInputFile(null);
                setAudioInfo(null);
            } else {
                // Set default trim end to duration
                setTrimEnd(Math.floor(info.duration));
            }
        } catch (err) {
            console.error(err);
            error('Failed to load file info');
            setInputFile(null);
        } finally {
            setLoadingInfo(false);
        }
    };

    const handleChooseOutputFolder = async () => {
        const folder = await window.audioAPI.chooseOutputFolder();
        if (folder) {
            setOutputFolder(folder);
        }
    };

    const handleExtract = async () => {
        if (!inputFile || !audioInfo) return;

        const id = crypto.randomUUID();
        setCurrentId(id);
        setProcessing(true);

        const options: AudioExtractionOptions = {
            id,
            inputPath: inputFile,
            outputPath: outputFolder || undefined,
            format,
            bitrate: format === 'wav' || format === 'flac' ? undefined : bitrate,
            sampleRate,
            channels,
            trim: trimEnabled ? { start: trimStart, end: trimEnd } : undefined,
            normalize,
            fadeIn: fadeIn > 0 ? fadeIn : undefined,
            fadeOut: fadeOut > 0 ? fadeOut : undefined
        };

        try {
            await window.audioAPI.extract(options);
        } catch (err) {
            console.error(err);
            error('Extraction failed', String(err));
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        if (currentId) {
            window.audioAPI.cancel(currentId);
            setProcessing(false);
            setProgress(null);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && files[0]) {
            const file = files[0];
            // @ts-ignore - File.path is available in Electron
            const filePath = file.path || '';
            if (filePath) {
                setInputFile(filePath);
                loadAudioInfo(filePath);
            }
        }
    };

    const renderFileSelector = () => (
        <Card className="p-8 bg-background/40 border-border-glass backdrop-blur-sm">
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border-glass rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={handleChooseFile}
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/20">
                        <FileAudio className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-1">Choose a file or drag & drop</h3>
                        <p className="text-sm text-foreground-muted">Supports video and audio files</p>
                    </div>
                    <Button variant="primary" className="mt-2">
                        <Upload className="w-4 h-4 mr-2" />
                        Browse Files
                    </Button>
                </div>
            </div>
        </Card>
    );

    const renderFileInfo = () => {
        if (!audioInfo || !inputFile) return null;

        return (
            <Card className="p-4 bg-background/40 border-border-glass backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{inputFile.split(/[\\/]/).pop()}</h4>
                        <div className="flex items-center gap-3 text-xs text-foreground-muted mt-1">
                            <span>{formatDuration(audioInfo.duration)}</span>
                            <span>•</span>
                            <span>{audioInfo.codec.toUpperCase()}</span>
                            <span>•</span>
                            <span>{audioInfo.sampleRate / 1000}kHz</span>
                            <span>•</span>
                            <span>{audioInfo.channels === 2 ? 'Stereo' : 'Mono'}</span>
                            <span>•</span>
                            <span>{formatBytes(audioInfo.size)}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setInputFile(null); setAudioInfo(null); }}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
        );
    };

    const renderOptions = () => (
        <div className="space-y-6">
            {/* Format & Quality */}
            <Card className="p-6 bg-background/40 border-border-glass backdrop-blur-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground-muted mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Output Settings
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value as AudioFormat)}
                        options={[
                            { value: 'mp3', label: 'MP3 (Universal)' },
                            { value: 'aac', label: 'AAC (High Quality)' },
                            { value: 'flac', label: 'FLAC (Lossless)' },
                            { value: 'wav', label: 'WAV (Uncompressed)' },
                            { value: 'ogg', label: 'OGG Vorbis' },
                            { value: 'm4a', label: 'M4A (Apple)' }
                        ]}
                        fullWidth
                    />
                    
                    {format !== 'wav' && format !== 'flac' && (
                        <Select
                            label="Bitrate"
                            value={bitrate}
                            onChange={(e) => setBitrate(e.target.value as AudioBitrate)}
                            options={[
                                { value: '64k', label: '64 kbps (Low)' },
                                { value: '128k', label: '128 kbps (Standard)' },
                                { value: '192k', label: '192 kbps (High)' },
                                { value: '256k', label: '256 kbps (Very High)' },
                                { value: '320k', label: '320 kbps (Maximum)' }
                            ]}
                            fullWidth
                        />
                    )}
                    
                    <Select
                        label="Sample Rate"
                        value={sampleRate.toString()}
                        onChange={(e) => setSampleRate(parseInt(e.target.value) as 44100 | 48000)}
                        options={[
                            { value: '44100', label: '44.1 kHz (CD Quality)' },
                            { value: '48000', label: '48 kHz (Studio)' }
                        ]}
                        fullWidth
                    />
                    
                    <Select
                        label="Channels"
                        value={channels.toString()}
                        onChange={(e) => setChannels(parseInt(e.target.value) as 1 | 2)}
                        options={[
                            { value: '2', label: 'Stereo' },
                            { value: '1', label: 'Mono' }
                        ]}
                        fullWidth
                    />
                </div>
            </Card>

            {/* Trim */}
            {audioInfo && (
                <Card className="p-6 bg-background/40 border-border-glass backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-foreground-muted flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            Trim Audio
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={trimEnabled}
                                onChange={(e) => setTrimEnabled(e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass"
                            />
                            <span className="text-sm">Enable</span>
                        </label>
                    </div>
                    
                    {trimEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-foreground-muted mb-2 block">Start (seconds)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={audioInfo.duration}
                                    value={trimStart}
                                    onChange={(e) => setTrimStart(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-foreground-muted mb-2 block">End (seconds)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={audioInfo.duration}
                                    value={trimEnd}
                                    onChange={(e) => setTrimEnd(Math.min(audioInfo.duration, parseInt(e.target.value) || 0))}
                                    className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Effects */}
            <Card className="p-6 bg-background/40 border-border-glass backdrop-blur-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground-muted mb-4 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Audio Effects
                </h3>
                
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={normalize}
                            onChange={(e) => setNormalize(e.target.checked)}
                            className="w-4 h-4 rounded border-border-glass"
                        />
                        <div className="flex-1">
                            <div className="font-medium text-sm">Normalize Volume</div>
                            <div className="text-xs text-foreground-muted">Automatically adjust volume levels</div>
                        </div>
                    </label>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-foreground-muted mb-2 block flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Fade In (seconds)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.5}
                                value={fadeIn}
                                onChange={(e) => setFadeIn(parseFloat(e.target.value) || 0)}
                                className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-foreground-muted mb-2 block flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                Fade Out (seconds)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.5}
                                value={fadeOut}
                                onChange={(e) => setFadeOut(parseFloat(e.target.value) || 0)}
                                className="w-full bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Output Folder */}
            <Card className="p-6 bg-background/40 border-border-glass backdrop-blur-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground-muted mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Output Location
                </h3>
                
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={outputFolder || 'Default Downloads Folder'}
                        readOnly
                        className="flex-1 bg-background/50 border border-border-glass rounded-lg px-3 py-2 text-sm cursor-default"
                    />
                    <Button variant="secondary" onClick={handleChooseOutputFolder}>
                        Choose
                    </Button>
                </div>
            </Card>

            {/* Extract Button */}
            <Button
                variant="primary"
                onClick={handleExtract}
                disabled={!inputFile || !audioInfo || processing || loadingInfo}
                className="w-full h-14 text-base font-semibold shadow-xl shadow-primary/20"
            >
                {processing ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Extracting...
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5 mr-2" />
                        Extract Audio
                    </>
                )}
            </Button>
        </div>
    );

    const renderProgress = () => {
        if (!progress || !processing) return null;

        return (
            <Card className="p-6 bg-background/40 border-border-glass backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        progress.state === 'processing' && "bg-blue-500/10 text-blue-400",
                        progress.state === 'complete' && "bg-green-500/10 text-green-400",
                        progress.state === 'error' && "bg-red-500/10 text-red-400"
                    )}>
                        {progress.state === 'processing' && <Loader2 className="w-6 h-6 animate-spin" />}
                        {progress.state === 'complete' && <CheckCircle2 className="w-6 h-6" />}
                        {progress.state === 'error' && <XCircle className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1">
                        <h4 className="font-medium">{progress.filename}</h4>
                        <div className="flex items-center gap-3 text-xs text-foreground-muted mt-1">
                            <span>{Math.round(progress.percent)}%</span>
                            {progress.speed && <span>• {progress.speed.toFixed(1)}x speed</span>}
                        </div>
                    </div>
                    
                    {progress.state === 'processing' && (
                        <Button variant="ghost" size="sm" onClick={handleCancel}>
                            Cancel
                        </Button>
                    )}
                </div>
                
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${progress.percent}%` }}
                    />
                </div>
            </Card>
        );
    };

    return (
        <ToolPane
            title="Audio Extractor"
            description="Extract and process audio from video files with advanced options"
        >
            <ToastContainer toasts={toasts} onClose={removeToast} />
            
            <div className="max-w-4xl mx-auto p-8 space-y-6">
                {!inputFile && renderFileSelector()}
                
                {inputFile && (
                    <>
                        {renderFileInfo()}
                        {renderProgress()}
                        {renderOptions()}
                    </>
                )}
            </div>
        </ToolPane>
    );
}
