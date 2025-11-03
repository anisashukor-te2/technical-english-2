import React from 'react';

interface LineChartProps {
  data: number[];
  labels: string[];
  title: string;
  color: string;
  yAxisLabel: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, labels, title, color, yAxisLabel }) => {
  if (!data || data.length === 0) {
    return (
        <div className="flex items-center justify-center h-48 bg-slate-900/50 rounded-lg">
            <p className="text-slate-500">Not enough data to display chart.</p>
        </div>
    );
  }
  
  const width = 300;
  const height = 150;
  const padding = 30;
  const maxY = Math.max(...data, 0);
  const xStep = (width - padding * 2) / (data.length - 1);

  const points = data
    .map((d, i) => {
      const y = height - padding - ((d / (maxY === 0 ? 1 : maxY)) * (height - padding * 2));
      const x = padding + i * xStep;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <h4 className="text-center font-semibold text-slate-300 mb-2">{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-axis */}
        <line x1={padding} y1={padding / 2} x2={padding} y2={height - padding} stroke="#475569" />
        <text x={padding - 5} y={padding / 2 + 5} textAnchor="end" fontSize="10" fill="#94A3B8">{maxY}</text>
        <text x={padding - 5} y={height - padding} textAnchor="end" fontSize="10" fill="#94A3B8">0</text>
        <text transform={`translate(10, ${height/2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="#94A3B8">{yAxisLabel}</text>


        {/* X-axis */}
        <line x1={padding} y1={height - padding} x2={width - padding / 2} y2={height - padding} stroke="#475569" />
        {labels.map((label, i) => (
           <text key={label} x={padding + i * xStep} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#94A3B8">{label}</text>
        ))}

        {/* Data line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
        {/* Data points */}
        {data.map((d, i) => {
           const y = height - padding - ((d / (maxY === 0 ? 1 : maxY)) * (height - padding * 2));
           const x = padding + i * xStep;
           return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
    </div>
  );
};

export default LineChart;