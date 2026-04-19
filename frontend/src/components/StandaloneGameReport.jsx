import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from 'recharts';
import UiIcon from './ui/UiIcon';
import { AmbientParticles, SuccessBurst } from './AmbientEffects';
import './StandaloneGameReport.css';

/**
 * StandaloneGameReport - Detailed analysis for individual games.
 */
export default function StandaloneGameReport({ 
  gameName = "Game", 
  score = 0, 
  total = 10, 
  accuracy = 0, 
  duration = 0, 
  skills = [],
  onAction,
  actionLabel = "Bak to Games"
}) {
  const percentage = Math.round(accuracy * 100);
  
  // Dynamic skill breakdown data
  const chartData = skills.map((s, i) => ({
    name: s,
    value: percentage - (i * 5) + (Math.random() * 10), // Simulated variance for aesthetic
    color: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'][i % 4]
  }));

  return (
    <div className="analysis-overlay">
      <AmbientParticles />
      <SuccessBurst trigger={true} />
      
      <div className="analysis-card">
        <div className="analysis-header">
          <div className="analysis-title-group">
            <span className="analysis-badge">Diagnostic Pulse</span>
            <h1>{gameName} Analysis</h1>
          </div>
          <div className="analysis-score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" className="percentage">{percentage}%</text>
            </svg>
          </div>
        </div>

        <div className="analysis-grid">
          <div className="analysis-chart-section">
            <h3>Focus Area Performance</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analysis-stats-section">
            <div className="analysis-stat-row">
              <div className="stat-pill">
                <span className="stat-label">Points</span>
                <span className="stat-val">{score} / {total}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Time</span>
                <span className="stat-val">{duration}s</span>
              </div>
            </div>

            <div className="ai-insight-mini">
              <div className="insight-header">
                <UiIcon name="ai" size={16} title="" />
                <span>Buddy's Observation</span>
              </div>
              <p>
                {percentage >= 80 
                  ? "Incredible focus! You hit those targets with precision. Your hand-eye coordination is sharpening rapidly."
                  : "Great effort! I noticed you were very careful with your choices. Let's practice a bit more to get even faster!"}
              </p>
            </div>
          </div>
        </div>

        <div className="analysis-footer">
          <button 
            className="analysis-btn-primary" 
            onClick={() => onAction && onAction({ score, total, accuracy, duration })}
          >
            {actionLabel} 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
