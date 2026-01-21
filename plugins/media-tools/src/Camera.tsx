import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Camera as CameraIcon, Video, Download, RefreshCw, Trash2, CameraOff, Image as ImageIcon, Circle } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { toast } from 'sonner';

const TOOL_ID = 'camera';

interface CameraProps {
    tabId?: string;
    mode?: 'photo' | 'video';
}

export const Camera: React.FC<CameraProps> = ({ tabId, mode }) => {
    const effectiveId = tabId || TOOL_ID;
    const { addToHistory } = useToolState(effectiveId);
    
    // If no mode provided, show both (default behavior)
    const activeMode = mode || 'both';

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [capturedImages, setCapturedImages] = useState<{ url: string; time: number }[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const getDevices = useCallback(async () => {
        try {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);
            if (videoDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error('Error listing devices:', err);
        }
    }, [selectedDeviceId]);

    const startStream = useCallback(async (deviceId?: string) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        setLoading(true);
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
                audio: true
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setLoading(false);
        } catch (err) {
            console.error('Error accessing camera:', err);
            toast.error('Could not access camera. Please check permissions.');
            setLoading(false);
        }
    }, [stream]);

    useEffect(() => {
        addToHistory(effectiveId);
        getDevices();
        startStream();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        const url = canvas.toDataURL('image/png');
        setCapturedImages(prev => [{ url, time: Date.now() }, ...prev]);
        toast.success('Photo captured!');
    };

    const startRecording = () => {
        if (!stream) return;
        setRecordedChunks([]);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9,opus'
        });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks(prev => [...prev, event.data]);
            }
        };
        mediaRecorder.onstop = () => {
            setIsRecording(false);
            toast.success('Recording saved!');
        };
        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    };

    const downloadVideo = () => {
        if (recordedChunks.length === 0) return;
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onClear = () => {
        setCapturedImages([]);
        setRecordedChunks([]);
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title={activeMode === 'photo' ? "Webcam Photo" : activeMode === 'video' ? "Video Recorder" : "Camera & Recorder"}
            description={activeMode === 'photo' ? "Capture high-quality photos from your webcam" : activeMode === 'video' ? "Record and save videos directly from your webcam" : "Capture photos or record videos directly from your webcam"}
            onClear={onClear}
        >
            <div className="flex flex-col h-full gap-6">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                    {/* Viewport */}
                    <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                        <div className="relative flex-1 bg-black rounded-3xl border border-border-glass overflow-hidden group shadow-2xl">
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 text-white gap-3">
                                    <RefreshCw className="animate-spin" />
                                    <span className="text-sm font-medium">Initializing Camera...</span>
                                </div>
                            )}
                            {!stream && !loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-foreground-secondary gap-4">
                                    <CameraOff size={64} strokeWidth={1} />
                                    <p className="text-sm font-medium">No camera stream available</p>
                                    <Button variant="primary" onClick={() => startStream(selectedDeviceId)}>
                                        Retry Connection
                                    </Button>
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay Controls */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                {(activeMode === 'both' || activeMode === 'photo') && (
                                    <button
                                        onClick={capturePhoto}
                                        className="p-3 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"
                                        title="Take Photo"
                                    >
                                        <CameraIcon size={24} />
                                    </button>
                                )}
                                {activeMode === 'both' && <div className="w-[1px] h-8 bg-white/20 mx-2" />}
                                {(activeMode === 'both' || activeMode === 'video') && (
                                    <>
                                        {isRecording ? (
                                            <button
                                                onClick={stopRecording}
                                                className="p-3 bg-rose-500 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl animate-pulse"
                                                title="Stop Recording"
                                            >
                                                <Circle size={24} fill="white" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={startRecording}
                                                className="p-3 bg-white/20 hover:bg-rose-500 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"
                                                title="Start Recording"
                                            >
                                                <Video size={24} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Recording Indicator */}
                            {isRecording && (
                                <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-rose-500/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                    Recording
                                </div>
                            )}
                        </div>

                        {/* Device Selector */}
                        <div className="flex items-center gap-4 px-4">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary shrink-0">Select Input:</span>
                                <select
                                    value={selectedDeviceId}
                                    onChange={(e) => {
                                        setSelectedDeviceId(e.target.value);
                                        startStream(e.target.value);
                                    }}
                                    className="flex-1 h-9 bg-foreground/[0.03] border border-border-glass rounded-xl text-xs px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {devices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button variant="ghost" size="sm" onClick={getDevices} className="rounded-xl">
                                <RefreshCw size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Gallery Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary flex items-center gap-2">
                                <ImageIcon size={14} className="text-primary" />
                                Recent Captures
                            </h3>
                            {recordedChunks.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={downloadVideo}
                                    className="gap-2 text-[10px] font-black uppercase"
                                >
                                    <Download size={12} />
                                    Get Video
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {capturedImages.length === 0 && recordedChunks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-foreground-muted opacity-30 gap-4 mt-12">
                                    <CameraIcon size={48} strokeWidth={1} />
                                    <p className="text-xs font-medium italic">Photos will appear here</p>
                                </div>
                            ) : (
                                <>
                                    {capturedImages.map((img, i) => (
                                        <div key={i} className="group relative glass-panel rounded-2xl overflow-hidden border border-border-glass bg-black/20 shadow-lg transition-all hover:scale-[1.02]">
                                            <img src={img.url} className="w-full aspect-video object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        const a = document.createElement('a');
                                                        a.href = img.url;
                                                        a.download = `photo-${img.time}.png`;
                                                        a.click();
                                                    }}
                                                    className="p-2 bg-white text-black rounded-lg hover:bg-primary hover:text-white transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-mono text-white/60">
                                                {new Date(img.time).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status bar */}
                <div className="glass-panel p-4 rounded-2xl border border-border-glass bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Circle size={16} fill={isRecording ? "currentColor" : "none"} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-tight">Camera Status</p>
                            <p className="text-xs font-medium text-foreground-secondary">
                                {isRecording ? 'Currently Recording Video' : stream ? 'Camera is Live' : 'Not Connected'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-tight text-foreground-muted">Resolution</p>
                        <p className="text-xs font-mono text-primary">
                            {videoRef.current?.videoWidth ? `${videoRef.current.videoWidth} x ${videoRef.current.videoHeight}` : '---'}
                        </p>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
