import React from 'react';

interface CustomCircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  trackStrokeWidth?: number;
  color?: string;
  trackColor?: string;
}

const CustomCircularProgress: React.FC<CustomCircularProgressProps> = ({
  percentage,
  size = 80,
  strokeWidth = 10,
  trackStrokeWidth = 8,
  color = '#10B981',
  trackColor = '#E5E7EB',
}) => {
  const radius = (size - Math.max(strokeWidth, trackStrokeWidth)) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={trackStrokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex items-center justify-center inset-0">
          <span className="text-xl font-bold text-gray-700">
            {percentage}%
          </span>
      </div>
    </div>
  );
};

export default CustomCircularProgress;
