import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import React, { useMemo } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GraphProps {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
  min?: number;
  max?: number;
  label?: string;
}

export const Graph: React.FC<GraphProps> = React.memo(({ 
  data, 
  labels, 
  color, 
  height = 60,
  min = 0,
  max = 100,
  label = 'Usage'
}) => {
  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      label,
      data,
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    }]
  }), [data, labels, color, label]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: {
        display: false,
        min,
        max
      }
    }
  }), [min, max]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
});

Graph.displayName = 'Graph';
