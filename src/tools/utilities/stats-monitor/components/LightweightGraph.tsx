import React, { useMemo } from 'react';

interface LightweightGraphProps {
  data: number[];
  color: string;
  height?: number;
  min?: number;
  max?: number;
}

export const LightweightGraph: React.FC<LightweightGraphProps> = React.memo(({ 
  data, 
  color, 
  height = 60,
  min = 0,
  max = 100
}) => {
  const { path, fillPath, width } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', fillPath: '', width: 200 };
    }
    
    const svgWidth = 200; // Fixed width for SVG
    const stepX = data.length > 1 ? svgWidth / (data.length - 1) : 0;
    const range = max - min || 1; // Avoid division by zero
    
    const points = data.map((value, index) => {
      const x = index * stepX;
      const normalizedValue = Math.max(min, Math.min(max, value)); // Clamp value
      const y = height - ((normalizedValue - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    const pathData = `M ${points}`;
    const fillPathData = `${pathData} L ${svgWidth},${height} L 0,${height} Z`;
    
    return { 
      path: pathData, 
      fillPath: fillPathData, 
      width: svgWidth 
    };
  }, [data, height, min, max]);

  const gradientId = useMemo(() => `gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`, [color]);

  return (
    <svg 
      width="100%" 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {fillPath && (
        <path
          d={fillPath}
          fill={`url(#${gradientId})`}
        />
      )}
      {path && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
});

LightweightGraph.displayName = 'LightweightGraph';

