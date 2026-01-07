import React from 'react';
import { Card } from '../../../components/ui/Card';
import { 
    CheckCircle2, 
    Settings, 
    Music, 
    Video, 
    MonitorPlay, 
    Smartphone, 
    Tv,
    Box
} from 'lucide-react';

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
        if (format === newFormat) return;
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

    const estimateSize = (q: string): string => {
        if (!videoInfo?.lengthSeconds) return 'Unknown';
        
        let sizeEst = 0;
        const lengthMB = videoInfo.lengthSeconds / 60;
        
        if (format === 'video') {
            const bitrateMap: Record<string, number> = {
                '4320p': 150, '2160p': 60, '1440p': 30,
                '1080p': 15, '720p': 7.5, '480p': 4,
                '360p': 2.5, '240p': 1.5, '144p': 1
            };
            sizeEst = lengthMB * (bitrateMap[q] || 5);
        } else {
            const bitrateMapApi: Record<string, number> = {
                '0': 2.5, // 320k
                '5': 1.5, // 192k
                '9': 1.0  // 128k
            };
            sizeEst = lengthMB * (bitrateMapApi[q] || 1);
        }
        
        return sizeEst < 1024 
            ? `${sizeEst.toFixed(0)} MB` 
            : `${(sizeEst / 1024).toFixed(1)} GB`;
    };

    const getQualityIcon = (q: string) => {
        if (q.includes('4320') || q.includes('2160')) return <Tv className="w-5 h-5" />;
        if (q.includes('1440') || q.includes('1080')) return <MonitorPlay className="w-5 h-5" />;
        return <Smartphone className="w-5 h-5" />;
    };

    const getQualityLabel = (q: string) => {
        const labels: Record<string, string> = {
            '4320p': '8K Ultra HD',
            '2160p': '4K Ultra HD',
            '1440p': '2K QHD',
            '1080p': 'Full HD',
            '720p': 'High Definition',
            '480p': 'Standard Definition',
            '360p': 'Low Quality',
            '240p': 'Very Low Quality',
            '144p': 'Data Saver'
        };
        return labels[q] || 'Video';
    };

    return (
        <div className="space-y-4">
             {/* Format Tabs - Segmented Control Style */}
            <div className="bg-background-tertiary/50 p-1.5 rounded-2xl border border-border-glass flex gap-1">
                <button
                    onClick={() => handleFormatChange('video')}
                    disabled={disabled}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        format === 'video'
                            ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'text-foreground-secondary hover:text-foreground-primary hover:bg-white/5'
                    }`}
                >
                    <Video className="w-4 h-4" />
                    Video
                </button>
                <button
                    onClick={() => handleFormatChange('audio')}
                    disabled={disabled}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        format === 'audio'
                            ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/20'
                            : 'text-foreground-secondary hover:text-foreground-primary hover:bg-white/5'
                    }`}
                >
                    <Music className="w-4 h-4" />
                    Audio
                </button>
            </div>

            {/* Main Selection Card */}
            <Card className="p-1 bg-glass-panel border-border-glass overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border-glass bg-background-secondary/30">
                     <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground-secondary uppercase tracking-wider flex items-center gap-2">
                            <Box className="w-3.5 h-3.5 text-blue-400" />
                            Container
                        </label>
                        <div className="flex gap-2">
                             {(format === 'video' ? ['mp4', 'mkv', 'webm'] : ['mp3', 'm4a', 'wav']).map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => setContainer(fmt)}
                                    disabled={disabled}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                                        container === fmt
                                            ? format === 'video' 
                                                ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                                                : 'bg-pink-500/10 border-pink-500/50 text-pink-400'
                                            : 'border-transparent text-foreground-tertiary hover:text-foreground-secondary hover:bg-white/5'
                                    }`}
                                >
                                    {fmt}
                                </button>
                             ))}
                        </div>
                     </div>
                </div>

                <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                     <div className="px-3 py-2 text-xs font-bold text-foreground-secondary uppercase tracking-wider flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-purple-400" />
                        Quality
                     </div>
                     
                     {format === 'video' ? (
                        /* Video List */
                        (videoInfo?.availableQualities || ['1080p', '720p', '480p']).map((q: string) => (
                             <button
                                key={q}
                                onClick={() => setQuality(q)}
                                disabled={disabled}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                                    quality === q
                                        ? 'bg-red-500/5 border-red-500/30 shadow-inner'
                                        : 'border-transparent hover:bg-white/5 hover:border-white/5'
                                }`}
                             >
                                <div className="flex items-center gap-4">
                                     <div className={`p-2 rounded-lg ${
                                         quality === q ? 'bg-red-500/10 text-red-400' : 'bg-background-tertiary text-foreground-tertiary group-hover:bg-background-secondary group-hover:text-foreground-secondary'
                                     }`}>
                                         {getQualityIcon(q)}
                                     </div>
                                     <div className="text-left">
                                         <div className={`text-sm font-bold ${
                                             quality === q ? 'text-red-400' : 'text-foreground-primary'
                                         }`}>
                                            {q}
                                         </div>
                                         <div className="text-xs text-foreground-secondary opacity-80">
                                            {getQualityLabel(q)}
                                         </div>
                                     </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-mono font-medium text-foreground-secondary">
                                        ~{estimateSize(q)}
                                    </div>
                                    {quality === q && (
                                        <div className="flex justify-end mt-1">
                                            <CheckCircle2 className="w-4 h-4 text-red-500" />
                                        </div>
                                    )}
                                </div>
                             </button>
                        ))
                     ) : (
                        /* Audio List */
                        [
                            { id: '0', label: 'Best Quality', detail: '320kbps' },
                            { id: '5', label: 'High Quality', detail: '192kbps' },
                            { id: '9', label: 'Standard', detail: '128kbps' }
                        ].map((opt) => (
                             <button
                                key={opt.id}
                                onClick={() => setQuality(opt.id)}
                                disabled={disabled}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                                    quality === opt.id
                                        ? 'bg-pink-500/5 border-pink-500/30 shadow-inner'
                                        : 'border-transparent hover:bg-white/5 hover:border-white/5'
                                }`}
                             >
                                <div className="flex items-center gap-4">
                                     <div className={`p-2 rounded-lg ${
                                         quality === opt.id ? 'bg-pink-500/10 text-pink-400' : 'bg-background-tertiary text-foreground-tertiary group-hover:bg-background-secondary group-hover:text-foreground-secondary'
                                     }`}>
                                         <Music className="w-5 h-5" />
                                     </div>
                                     <div className="text-left">
                                         <div className={`text-sm font-bold ${
                                             quality === opt.id ? 'text-pink-400' : 'text-foreground-primary'
                                         }`}>
                                            {opt.label}
                                         </div>
                                         <div className="text-xs text-foreground-secondary opacity-80">
                                            {opt.detail}
                                         </div>
                                     </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-mono font-medium text-foreground-secondary">
                                        ~{estimateSize(opt.id)}
                                    </div>
                                    {quality === opt.id && (
                                        <div className="flex justify-end mt-1">
                                            <CheckCircle2 className="w-4 h-4 text-pink-500" />
                                        </div>
                                    )}
                                </div>
                             </button>
                        ))
                     )}
                </div>
            </Card>
        </div>
    );
};
