import React from 'react';

export const WindowControls: React.FC = () => {
    return (
        <div className="flex items-center px-4 h-12 select-none drag sticky top-0 z-40">
            {/* macOS tự động vẽ traffic lights tại trafficLightPosition, không cần vẽ thêm */}
            {/* Spacer để tránh overlap với traffic lights (khoảng 78px cho 3 nút + spacing) */}
            <div className="w-20" />
            <div className="flex-1 text-center text-xs font-medium text-foreground-muted tracking-wider uppercase">
                DevTools
            </div>
            <div className="w-20" /> {/* Spacer để cân bằng */}
        </div>
    );
};
