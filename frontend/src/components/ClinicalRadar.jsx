import React from 'react';
import { 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';

/**
 * ClinicalRadar - A reusable visualization for therapeutic domain performance.
 * 
 * @param {Object} domains - Object with domain keys (cognitive, motor, social, speech) 
 *                           containing accuracy values.
 * @param {number} size - Optional height for the chart.
 */
export default function ClinicalRadar({ domains = {}, size = 300 }) {
  const domainLabels = {
    cognitive: "Cognitive",
    motor: "Fine Motor",
    social: "Social",
    speech: "Speech/Lang"
  };

  const chartData = Object.keys(domainLabels).map(key => ({
    subject: domainLabels[key],
    A: domains[key] ? Math.round(domains[key].accuracy * 100) : 0,
    fullMark: 100
  }));

  return (
    <div className="clinical-radar-wrapper" style={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Clinical Pulse"
            dataKey="A"
            stroke="#6366F1"
            fill="#6366F1"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
