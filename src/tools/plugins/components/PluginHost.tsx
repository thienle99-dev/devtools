import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';

interface PluginHostProps {
    tabId: string;
    pluginId?: string; // If coming from definition
}

export const PluginHost: React.FC<PluginHostProps> = ({ pluginId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPlugin = async () => {
            if (!pluginId) {
                setError('Plugin ID not specified');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // In a real implementation, we would use window.require or dynamic import
                // along with the plugin's install path from PluginManager.
                // For now, this is a placeholder where we'd load the .js bundle.
                
                console.log(`[PluginHost] Loading plugin: ${pluginId}`);
                
                // Simulate loading delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Placeholder error since we don't have actual plugin bundles yet
                setError(`Plugin UI rendering for "${pluginId}" is coming in the next update. The core logic is installed and ready.`);
                setIsLoading(false);
            } catch (err: any) {
                console.error('[PluginHost] Failed to load plugin:', err);
                setError(err.message || 'Failed to load plugin component');
                setIsLoading(false);
            }
        };

        loadPlugin();
    }, [pluginId]);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background/30 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Package className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-lg">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-foreground mb-1">Cài đặt Plugin...</h2>
                        <p className="text-sm text-muted-foreground">Đang chuẩn bị môi trường chạy...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full"
                >
                    <Card className="p-8 border-rose-500/20 bg-rose-500/5 backdrop-blur-md">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                <AlertTriangle className="w-8 h-8 text-rose-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-foreground">Sửa lỗi Plugin</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {error}
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => window.location.reload()}
                                >
                                    Tải lại ứng dụng
                                </Button>
                                <Button 
                                    variant="primary" 
                                    className="flex-1"
                                    onClick={() => window.location.href = '#/marketplace'}
                                >
                                    Vào Marketplace
                                </Button>
                            </div>
                        </div>
                    </Card>
                    <div className="mt-8 p-4 rounded-xl bg-secondary/20 border border-border text-xs text-muted-foreground text-center">
                        Tip: Bạn có thể gỡ và cài đặt lại plugin nếu vấn đề vẫn tiếp diễn.
                    </div>
                </motion.div>
            </div>
        );
    }

    // Tạm thời UI placeholder khi chưa có PluginComponent thực sự
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <Card className="p-8 border border-border bg-background/60 backdrop-blur-md">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Package className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">Plugin đang chờ UI</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Logic của plugin đã được cài đặt. Giao diện tương tác sẽ được cập nhật trong các phiên bản tiếp theo.
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.href = '#/marketplace'}
                        >
                            Quay lại Marketplace
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
