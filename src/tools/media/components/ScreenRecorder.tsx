import React, { useState, useRef, useEffect } from 'react';
import { Video, Disc, StopCircle, MonitorPlay, Download, Share2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { logger } from '../../../utils/logger';
import { formatDuration, formatBytes } from '@utils/format';

export const ScreenRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [stream]);

    const startRecording = async () => {
        try {
            // Request screen capture
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: true // Request system audio if available
            });

            setStream(displayStream);

            // Preview stream
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = displayStream;
            }

            // Setup recording
            const mediaRecorder = new MediaRecorder(displayStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setRecordedChunks(chunks);
                setRecordedVideoUrl(url);
                setIsRecording(false);

                // Stop all tracks
                displayStream.getTracks().forEach(track => track.stop());
                setStream(null);

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };

            // Handle user stopping share via browser UI
            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setRecordedVideoUrl(null);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            logger.info('Screen recording started');

        } catch (error) {
            console.error('Error starting screen recording:', error);
            logger.error('Screen recording failed', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const downloadRecording = () => {
        if (!recordedVideoUrl) return;
        const a = document.createElement('a');
        a.href = recordedVideoUrl;
        a.download = `screen-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };



    return (
        <div className="h-full flex flex-col overflow-y-auto p-1">
            <div className="space-y-6 mx-auto w-full pb-10 max-w-4xl">

                {/* Control Panel */}
                <div className="flex justify-center mb-6">
                    {!isRecording && !recordedVideoUrl && (
                        <Card
                            className="p-8 border-2 border-dashed border-border-glass hover:border-indigo-500/50 hover:bg-glass-panel/50 cursor-pointer transition-all group w-full max-w-md flex flex-col items-center gap-4"
                            onClick={startRecording}
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Disc className="w-8 h-8 text-red-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-foreground">Start Recording</h3>
                                <p className="text-sm text-foreground-secondary mt-1">
                                    Capture your screen, window, or tab
                                </p>
                            </div>
                        </Card>
                    )}

                    {isRecording && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-full flex items-center gap-3 animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                                <span className="font-mono text-xl text-red-400 font-bold">{formatDuration(recordingTime)}</span>
                            </div>
                            <Button
                                variant="danger"
                                size="lg"
                                onClick={stopRecording}
                                icon={StopCircle}
                                className="w-48"
                            >
                                Stop Recording
                            </Button>
                        </div>
                    )}
                </div>

                {/* Preview / Result Area */}
                {(isRecording || recordedVideoUrl) && (
                    <Card className="p-1 overflow-hidden bg-black/40 border-border-glass">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                                ref={videoPreviewRef}
                                src={recordedVideoUrl || undefined}
                                autoPlay
                                muted={isRecording} // Mute preview while recording to avoid feedback
                                controls={!!recordedVideoUrl}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {recordedVideoUrl && (
                            <div className="p-4 flex justify-between items-center bg-glass-panel/50">
                                <div className="text-sm text-foreground-secondary">
                                    <span className="font-semibold text-foreground">Recording Complete</span>
                                    <span className="mx-2">•</span>
                                    {formatDuration(recordingTime)}
                                    <span className="mx-2">•</span>
                                    {formatBytes(recordedChunks.reduce((a, b) => a + b.size, 0))}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        onClick={downloadRecording}
                                        icon={Download}
                                    >
                                        Download
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setRecordedVideoUrl(null);
                                            setRecordedChunks([]);
                                        }}
                                    >
                                        Record Again
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Info / Tips */}
                {!isRecording && !recordedVideoUrl && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-glass-panel border border-border-glass/50">
                            <MonitorPlay className="w-5 h-5 text-indigo-400 mb-2" />
                            <h4 className="text-sm font-semibold text-foreground">High Quality</h4>
                            <p className="text-xs text-foreground-secondary mt-1">Records in VP9 WebM format for high quality and low file size.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-glass-panel border border-border-glass/50">
                            <Video className="w-5 h-5 text-purple-400 mb-2" />
                            <h4 className="text-sm font-semibold text-foreground">Flexible Source</h4>
                            <p className="text-xs text-foreground-secondary mt-1">Choose any screen, window, or browser tab to capture.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-glass-panel border border-border-glass/50">
                            <Share2 className="w-5 h-5 text-green-400 mb-2" />
                            <h4 className="text-sm font-semibold text-foreground">Video Ready</h4>
                            <p className="text-xs text-foreground-secondary mt-1">Use recorded videos directly in the Video to Frame extractor.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
