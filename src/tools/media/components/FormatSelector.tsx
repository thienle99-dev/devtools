import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, FileVideo, Settings, Music, Video } from 'lucide-react';

interface FormatSelectorProps {
    format: 'video' | 'audio' | 'best';
    setFormat: (f: 'video' | 'audio' | 'best') => void;
    quality: string;
    setQuality: (q: string) => void;
    container: string;
    setContainer: (c: string) => void;
    videoInfo?: any;
    disabled?: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
    format,
    setFormat,
    quality,
    setQuality,
    container,
    setContainer,
    videoInfo,
    disabled
}) => {

    const handleFormatChange = (newFormat: 'video' | 'audio') => {
        setFormat(newFormat);
        // Reset defaults
        if (newFormat === 'video') {
            setQuality(videoInfo?.availableQualities?.[0] || '1080p');
            setContainer('mp4');
        } else {
            setQuality('0');
            setContainer('mp3');
        }
    };

    return (
        <Card className="p-6 bg-glass-panel border-border-glass">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground-primary">Download Options</h3>
                <div className="flex bg-glass-panel rounded-lg p-1 border border-border-glass">
                    <button
                        onClick={() => handleFormatChange('video')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                            format === 'video' ? 'bg-red-500/20 text-red-400' : 'text-foreground-secondary hover:text-foreground'
                        }`}
                        disabled={disabled}
                    >
                        <Video className="w-3.5 h-3.5" />
                        Video
                    </button>
                    <button
                        onClick={() => handleFormatChange('audio')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                            format === 'audio' ? 'bg-pink-500/20 text-pink-400' : 'text-foreground-secondary hover:text-foreground'
                        }`}
                        disabled={disabled}
                    >
                        <Music className="w-3.5 h-3.5" />
                        Audio
                    </button>
                </div>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
                <label className="text-sm font-medium text-foreground-primary block mb-2 flex items-center gap-2">
                    <FileVideo className="w-4 h-4 text-blue-400" />
                    Output Container
                </label>
                <div className="flex gap-2 flex-wrap">
                    {(format === 'video' ? ['mp4', 'mkv', 'webm'] : ['mp3', 'm4a', 'wav', 'flac', 'opus']).map(fmt => (
                        <button
                            key={fmt}
                            onClick={() => setContainer(fmt)}
                            disabled={disabled}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all uppercase ${
                                container === fmt 
                                    ? format === 'video' 
                                        ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                                        : 'bg-pink-500/20 text-pink-400 border-pink-500/50'
                                    : 'bg-glass-panel text-foreground-secondary border-border-glass hover:bg-white/5 hover:text-foreground-primary'
                            }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground-primary flex items-center gap-2">
                        <Settings className="w-4 h-4 text-purple-400" />
                        {format === 'video' ? 'Select Video Quality' : 'Select Audio Quality'}
                    </label>
                    {format === 'video' && (
                        <span className="text-[10px] text-foreground-tertiary bg-background-tertiary px-2 py-1 rounded-full font-mono">
                            {(container || 'MP4').toUpperCase()} (H.264)
                        </span>
                    )}
                </div>

                {format === 'video' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(videoInfo?.availableQualities && videoInfo.availableQualities.length > 0
                            ? videoInfo.availableQualities 
                            : ['1080p', '720p', '480p', '360p']
                        ).map((q: string) => {
                            const labels: Record<string, string> = {
                                '4320p': '8K Ultra HD',
                                '2160p': '4K Ultra HD',
                                '1440p': '2K QHD',
                                '1080p': 'Full HD',
                                '720p': 'HD',
                                '480p': 'SD',
                                '360p': 'Low',
                                '240p': 'Very Low',
                                '144p': 'Potato'
                            };
                            
                            // Estimate size
                            const lengthMB = (videoInfo?.lengthSeconds || 0) / 60;
                            const bitrateMap: Record<string, number> = {
                                '4320p': 150, '2160p': 60, '1440p': 30,
                                '1080p': 15, '720p': 7.5, '480p': 4,
                                '360p': 2.5, '240p': 1.5, '144p': 1
                            };
                            const sizeEst = lengthMB * (bitrateMap[q] || 5);
                            const sizeStr = sizeEst < 1024 ? `${sizeEst.toFixed(0)} MB` : `${(sizeEst / 1024).toFixed(1)} GB`;

                            return (
                                <button
                                    key={q}
                                    onClick={() => setQuality(q)}
                                    disabled={disabled}
                                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                                        quality === q 
                                            ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_4px_20px_-12px_var(--red-500)]' 
                                            : 'bg-glass-panel border-transparent hover:bg-background-secondary hover:border-border-glass text-foreground-secondary hover:text-foreground-primary'
                                    }`}
                                >
                                    {quality === q && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-red-500 shadow-[0_-2px_8px_var(--red-500)]" />}
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm">{q}</span>
                                        {quality === q && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] opacity-70">{labels[q] || 'Video'}</span>
                                        <span className="text-[10px] font-mono opacity-50">~{sizeStr}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: '0', label: 'Best Quality', detail: '320kbps', size: 2.5 },
                            { id: '5', label: 'High Quality', detail: '192kbps', size: 1.5 },
                            { id: '9', label: 'Standard', detail: '128kbps', size: 1.0 }
                        ].map((opt) => {
                            const lengthMB = (videoInfo?.lengthSeconds || 0) / 60;
                            const sizeEst = lengthMB * opt.size;
                            const sizeStr = `${sizeEst.toFixed(1)} MB`;

                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => setQuality(opt.id)}
                                    disabled={disabled}
                                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                                        quality === opt.id 
                                            ? 'bg-pink-500/10 border-pink-500 text-pink-400 shadow-[0_4px_20px_-12px_var(--pink-500)]' 
                                            : 'bg-glass-panel border-transparent hover:bg-background-secondary hover:border-border-glass text-foreground-secondary hover:text-foreground-primary'
                                    }`}
                                >
                                    {quality === opt.id && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-pink-500 shadow-[0_-2px_8px_var(--pink-500)]" />}
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm px-2 py-0.5 rounded-full bg-background/30 border border-white/5">{opt.label}</span>
                                        {quality === opt.id && <CheckCircle2 className="w-4 h-4 text-pink-500" />}
                                    </div>
                                    <div className="flex justify-between items-end mt-2 px-1">
                                        <span className="text-[10px] font-mono opacity-60">{(container || 'MP3').toUpperCase()} • {opt.detail}</span>
                                        <span className="text-[10px] font-mono opacity-50">~{sizeStr}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
};
