import React from 'react';
import './ProgressIndicator.css';

/**
 * ProgressIndicator Component
 * 
 * Displays progress with:
 * - Circular progress indicator (60px diameter, 4px stroke)
 * - Linear progress bar (full width, 8px height)
 * - Gradient color from Warm Blue to Success Green
 * - Smooth animation (300ms transition)
 * - Percentage-based progress display
 */
export function ProgressIndicator({
  progress = 0,
  type = 'linear',
  showLabel = true,
  size = 'medium',
  animated = true,
  className = '',
  ...props
}) {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  if (type === 'circular') {
    return (
      <CircularProgress
        progress={normalizedProgress}
        showLabel={showLabel}
        size={size}
        animated={animated}
        className={className}
        {...props}
      />
    );
  }

  return (
    <LinearProgress
      progress={normalizedProgress}
      showLabel={showLabel}
      animated={animated}
      className={className}
      {...props}
    />
  );
}

/**
 * LinearProgress Component
 * Full width progress bar
 */
function LinearProgress({
  progress,
  showLabel,
  animated,
  className = '',
  ...props
}) {
  const containerClasses = [
    'progress-indicator',
    'progress-linear',
    animated && 'animated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} {...props}>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Progress: ${progress}%`}
        />
      </div>
      {showLabel && (
        <div className="progress-label">{Math.round(progress)}%</div>
      )}
    </div>
  );
}

/**
 * CircularProgress Component
 * Circular progress indicator
 */
function CircularProgress({
  progress,
  showLabel,
  size = 'medium',
  animated,
  className = '',
  ...props
}) {
  const containerClasses = [
    'progress-indicator',
    'progress-circular',
    `size-${size}`,
    animated && 'animated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Calculate SVG dimensions based on size
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80,
  };

  const diameter = sizeMap[size] || sizeMap.medium;
  const radius = diameter / 2;
  const circumference = 2 * Math.PI * (radius - 4); // 4px stroke width
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={containerClasses} {...props}>
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="progress-circle-svg"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Progress: ${progress}%`}
      >
        {/* Background circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 4}
          className="progress-circle-background"
        />
        {/* Progress circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 4}
          className="progress-circle-fill"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      {showLabel && (
        <div className="progress-circle-label">{Math.round(progress)}%</div>
      )}
    </div>
  );
}

export default ProgressIndicator;
