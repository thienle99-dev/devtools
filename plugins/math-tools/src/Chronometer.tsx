import React, { useState, useEffect, useRef } from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Timer, Play, Pause, RotateCcw, Clock, Bell, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'chronometer';

export const Chronometer: React.FC = () => {
    const { data, setToolData } = useToolState(TOOL_ID);
    const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');

    // Stopwatch state
    const [swTime, setSwTime] = useState(0);
    const [swRunning, setSwRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const swIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Timer state
    const [timerInput, setTimerInput] = useState({ h: 0, m: 5, s: 0 });
    const [timerRemaining, setTimerRemaining] = useState(300); // 5 min default
    const [timerRunning, setTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initial state from store
    useEffect(() => {
        if (data?.options?.laps) setLaps(data.options.laps);
    }, [data]);

    // Stopwatch effect
    useEffect(() => {
        if (swRunning) {
            swIntervalRef.current = setInterval(() => {
                setSwTime(prev => prev + 10);
            }, 10);
        } else {
            if (swIntervalRef.current) clearInterval(swIntervalRef.current);
        }
        return () => {
            if (swIntervalRef.current) clearInterval(swIntervalRef.current);
        };
    }, [swRunning]);

    // Timer effect
    useEffect(() => {
        if (timerRunning) {
            timerIntervalRef.current = setInterval(() => {
                setTimerRemaining(prev => {
                    if (prev <= 0) {
                        setTimerRunning(false);
                        toast.success('Timer finished!', {
                            icon: <Bell className="w-4 h-4" />,
                            duration: 5000
                        });
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [timerRunning]);

    const formatSwTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const formatTimerTime = (s: number) => {
        const hours = Math.floor(s / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const seconds = s % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleLap = () => {
        const newLaps = [swTime, ...laps];
        setLaps(newLaps.slice(0, 50));
        setToolData(TOOL_ID, { options: { laps: newLaps } });
    };

    const resetSw = () => {
        setSwRunning(false);
        setSwTime(0);
        setLaps([]);
        setToolData(TOOL_ID, { options: { laps: [] } });
    };

    const startTimer = () => {
        const totalSeconds = timerInput.h * 3600 + timerInput.m * 60 + timerInput.s;
        if (totalSeconds <= 0) return;
        setTimerRemaining(totalSeconds);
        setTimerRunning(true);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex gap-1 p-1 bg-foreground/5 rounded-2xl border border-border-glass w-fit self-center">
                <button
                    onClick={() => setMode('stopwatch')}
                    className={`px-8 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'stopwatch'
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'text-foreground/40 hover:bg-foreground/5'
                        }`}
                >
                    Stopwatch
                </button>
                <button
                    onClick={() => setMode('timer')}
                    className={`px-8 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'timer'
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'text-foreground/40 hover:bg-foreground/5'
                        }`}
                >
                    Timer
                </button>
            </div>

            <div className="flex-1 flex flex-col gap-6 items-center justify-center max-w-4xl w-full mx-auto">
                {mode === 'stopwatch' ? (
                    <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center h-full">
                        <div className="flex-1 glass-panel p-12 flex flex-col items-center justify-center gap-12 w-full lg:min-h-[500px]">
                            <div className="flex flex-col items-center gap-2">
                                <Clock className="w-8 h-8 text-indigo-400 opacity-50 mb-4" />
                                <div className="text-7xl lg:text-8xl font-black text-foreground tracking-tight font-mono">
                                    {formatSwTime(swTime)}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <Button
                                    size="lg"
                                    variant={swRunning ? 'secondary' : 'primary'}
                                    onClick={() => setSwRunning(!swRunning)}
                                    className="w-40 h-16 text-xl rounded-full"
                                    icon={swRunning ? Pause : Play}
                                >
                                    {swRunning ? 'Pause' : 'Start'}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={swRunning ? handleLap : resetSw}
                                    className="w-40 h-16 text-xl rounded-full"
                                    icon={swRunning ? Timer : RotateCcw}
                                >
                                    {swRunning ? 'Lap' : 'Reset'}
                                </Button>
                            </div>
                        </div>

                        {laps.length > 0 && (
                            <div className="w-full lg:w-80 glass-panel overflow-hidden flex flex-col max-h-[500px]">
                                <div className="p-4 border-b border-border-glass bg-foreground/5 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">Laps</span>
                                    <Button size="sm" variant="ghost" icon={Trash2} onClick={resetSw} />
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                    {laps.map((lap, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-foreground/5 border border-border-glass">
                                            <span className="text-xs text-foreground/30 font-bold">Lap {laps.length - i}</span>
                                            <span className="text-sm font-mono text-foreground/80">{formatSwTime(lap)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full glass-panel p-12 flex flex-col items-center justify-center gap-12 max-w-2xl min-h-[500px]">
                        {!timerRunning && timerRemaining === (timerInput.h * 3600 + timerInput.m * 60 + timerInput.s) ? (
                            <div className="flex flex-col items-center gap-8 w-full">
                                <div className="flex items-center gap-4">
                                    <TimerInput val={timerInput.h} onChange={(v) => setTimerInput({ ...timerInput, h: v })} label="Hours" />
                                    <span className="text-4xl text-foreground/20 font-light mt-4">:</span>
                                    <TimerInput val={timerInput.m} onChange={(v) => setTimerInput({ ...timerInput, m: v })} label="Minutes" />
                                    <span className="text-4xl text-foreground/20 font-light mt-4">:</span>
                                    <TimerInput val={timerInput.s} onChange={(v) => setTimerInput({ ...timerInput, s: v })} label="Seconds" />
                                </div>
                                <Button
                                    size="lg"
                                    variant="primary"
                                    onClick={startTimer}
                                    className="w-48 h-16 text-xl rounded-full"
                                    icon={Play}
                                >
                                    Start Timer
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Bell className={`w-8 h-8 mb-4 ${timerRemaining <= 10 ? 'text-rose-400 animate-pulse' : 'text-indigo-400 opacity-50'}`} />
                                    <div className={`text-8xl lg:text-9xl font-black tracking-tight font-mono ${timerRemaining <= 10 ? 'text-rose-400' : 'text-foreground'}`}>
                                        {formatTimerTime(timerRemaining)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <Button
                                        size="lg"
                                        variant={timerRunning ? 'secondary' : 'primary'}
                                        onClick={() => setTimerRunning(!timerRunning)}
                                        className="w-40 h-16 text-xl rounded-full"
                                        icon={timerRunning ? Pause : Play}
                                    >
                                        {timerRunning ? 'Pause' : 'Resume'}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => {
                                            setTimerRunning(false);
                                            setTimerRemaining(timerInput.h * 3600 + timerInput.m * 60 + timerInput.s);
                                        }}
                                        className="w-40 h-16 text-xl rounded-full"
                                        icon={RotateCcw}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TimerInput: React.FC<{ val: number; onChange: (v: number) => void; label: string }> = ({ val, onChange, label }) => (
    <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">{label}</span>
        <input
            type="number"
            value={val.toString().padStart(2, '0')}
            onChange={(e) => onChange(Math.min(Math.max(parseInt(e.target.value) || 0, 0), label === 'Hours' ? 99 : 59))}
            className="w-24 h-24 rounded-2xl bg-foreground/5 border border-border-glass text-4xl font-black text-center text-foreground focus:outline-none focus:border-indigo-500/50 focus:bg-foreground/10 transition-all"
        />
    </div>
);
