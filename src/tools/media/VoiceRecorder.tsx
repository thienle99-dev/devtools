import React, { useState, useRef, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Mic, Square, Play, Pause, Download, Trash2, Volume2, Activity } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { toast } from 'sonner';
import { cn } from '@utils/cn';

const TOOL_ID = 'voice-recorder';

export const VoiceRecorder: React.FC<{ tabId?: string }> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { addToHistory } = useToolState(effectiveId);

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [visualizerData, setVisualizerData] = useState<number[]>(new Array(40).fill(2));

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        addToHistory(effectiveId);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            // Setup Visualizer
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            const updateVisualizer = () => {
                if (!analyzerRef.current) return;
                const bufferLength = analyzerRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyzerRef.current.getByteFrequencyData(dataArray);

                // Sample 40 points from the data
                const sampled = [];
                for (let i = 0; i < 40; i++) {
                    const idx = Math.floor(i * (bufferLength / 40));
                    sampled.push(Math.max(2, (dataArray[idx] / 255) * 40));
                }
                setVisualizerData(sampled);
                animationFrameRef.current = requestAnimationFrame(updateVisualizer);
            };
            updateVisualizer();

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                setIsRecording(false);
                setIsPaused(false);
                if (timerRef.current) clearInterval(timerRef.current);
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                setVisualizerData(new Array(40).fill(2));

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            toast.success('Recording started');
        } catch (err) {
            console.error('Error starting recording:', err);
            toast.error('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;
        if (isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const onClear = () => {
        if (audioURL) URL.revokeObjectURL(audioURL);
        setAudioURL(null);
        setDuration(0);
    };

    return (
        <ToolPane
            title="Voice Recorder"
            description="Record, play back, and download audio from your microphone"
            onClear={onClear}
        >
            <div className="flex flex-col items-center justify-center h-full gap-8 py-12">
                {/* Visualizer / Status Area */}
                <div className="w-full max-w-2xl aspect-[3/1] glass-panel rounded-3xl border border-border-glass flex flex-col items-center justify-center gap-6 overflow-hidden relative bg-black/20">
                    {isRecording ? (
                        <div className="flex items-end gap-1 h-32">
                            {visualizerData.map((h, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-2 rounded-full transition-all duration-75",
                                        isPaused ? "bg-foreground/20" : "bg-primary shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"
                                    )}
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    ) : audioURL ? (
                        <div className="flex flex-col items-center gap-4">
                            <audio src={audioURL} controls className="w-80 h-10 accent-primary" />
                            <p className="text-xs text-foreground-muted font-mono">Length: {formatTime(duration)}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-foreground-muted/30">
                            <Mic size={64} strokeWidth={1} />
                            <p className="text-sm font-medium italic">Ready to record</p>
                        </div>
                    )}

                    <div className="absolute top-6 right-8 flex items-center gap-3">
                        {isRecording && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white animate-pulse">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                {isPaused ? 'Paused' : 'Recording'}
                            </div>
                        )}
                        <span className="text-xl font-mono font-bold text-foreground/80">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    {!isRecording && !audioURL ? (
                        <button
                            onClick={startRecording}
                            className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                        >
                            <Mic size={32} className="group-hover:animate-bounce" />
                        </button>
                    ) : isRecording ? (
                        <div className="flex items-center gap-6">
                            <button
                                onClick={togglePause}
                                className="w-16 h-16 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                            >
                                {isPaused ? <Play size={24} /> : <Pause size={24} />}
                            </button>
                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                            >
                                <Square size={32} fill="white" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Button variant="primary" size="lg" onClick={() => {
                                const a = document.createElement('a');
                                a.href = audioURL!;
                                a.download = `voice-recording-${Date.now()}.webm`;
                                a.click();
                            }} className="rounded-2xl gap-2 font-black uppercase text-xs">
                                <Download size={16} />
                                Download Recording
                            </Button>
                            <Button variant="ghost" size="lg" onClick={onClear} className="rounded-2xl text-foreground-secondary hover:text-red-400">
                                <Trash2 size={20} />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {!isRecording && !audioURL && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                        <div className="glass-panel p-6 rounded-3xl border border-border-glass flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Volume2 size={24} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">Audio Format</h4>
                                <p className="text-sm font-bold">WEBM / OPUS</p>
                            </div>
                        </div>
                        <div className="glass-panel p-6 rounded-3xl border border-border-glass flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">Sample Rate</h4>
                                <p className="text-sm font-bold">48.0 kHz</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
