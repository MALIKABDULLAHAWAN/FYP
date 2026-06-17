import React from 'react';
import { 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';
import UiIcon from './ui/UiIcon';
import './SessionReport.css';

/**
 * SessionReport - A premium clinical summary for a guided therapy session.
 * 
 * @param {Array} results - The results from each game in the session.
 * @param {Object} user - Current user info.
 * @param {Function} onFinish - Callback when the user closes the report.
 */
export default function SessionReport({ results = [], user = {}, onFinish }) {
  // Map games to clinical domains
  const domainMapping = {
    cognitive: { label: "Cognitive", games: ["color-match", "memory-match", "matching", "sorting", "color_match", "memory_match"], score: 0, count: 0 },
    motor: { label: "Fine Motor", games: ["bubble-pop", "shape-sort", "bubble_pop", "shape_sort"], score: 0, count: 0 },
    speech: { label: "Speech/Lang", games: ["animal-sounds", "story-adventure", "speech-sparkles", "speech-therapy", "animal_sounds", "story_adventure", "speech_therapy"], score: 0, count: 0 },
    social: { label: "Social", games: ["emotion-match", "joint-attention", "emotion_match"], score: 0, count: 0 }
  };

  // Calculate domain scores
  results.forEach(res => {
    Object.keys(domainMapping).forEach(domain => {
      if (domainMapping[domain].games.includes(res.code || res.game_id)) {
        domainMapping[domain].score += (res.accuracy || 0);
        domainMapping[domain].count += 1;
      }
    });
  });

  // Prepare data for Radar Chart
  const chartData = Object.keys(domainMapping).map(key => ({
    subject: domainMapping[key].label,
    A: domainMapping[key].count > 0 
      ? Math.round((domainMapping[key].score / domainMapping[key].count) * 100) 
      : 0,
    fullMark: 100
  }));

  const totalTrials = results.reduce((sum, r) => sum + (r.total_trials || 0), 0);
  const totalCorrect = results.reduce((sum, r) => sum + (r.correct || 0), 0);
  const overallAccuracy = totalTrials > 0 ? (totalCorrect / totalTrials) : 0;

  const getMasteryRank = (acc) => {
    if (acc >= 0.9) return { label: "Master", color: "#10B981", bg: "#ECFDF5" };
    if (acc >= 0.7) return { label: "Advanced", color: "#3B82F6", bg: "#EFF6FF" };
    if (acc >= 0.5) return { label: "Junior", color: "#F59E0B", bg: "#FFFBEB" };
    return { label: "Novice", color: "#EF4444", bg: "#FEF2F2" };
  };

  return (
    <div className="session-report-container">
      <div className="session-report-card">
        {/* Header */}
        <div className="report-header">
          <div className="report-titles">
            <h1>Session Analysis 📊</h1>
            <p>Clinical summary for {user?.full_name || "Guest"}</p>
          </div>
          <div className="overall-score-badge">
            <span className="score-value">{Math.round(overallAccuracy * 100)}%</span>
            <span className="score-label">Accuracy Score</span>
          </div>
        </div>

        {/* Clinical Insights Section */}
        <div className="report-body">
          <div className="radar-section">
            <h3>Domain Performance</h3>
            <div className="radar-chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#FF5A78"
                    fill="#FF5A78"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="metrics-section">
            <h3>Diagnostic Breakdown</h3>
            <div className="metrics-table-wrapper">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Result</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => {
                    const rank = getMasteryRank(res.accuracy || 0);
                    return (
                      <tr key={idx}>
                        <td>
                          <div className="game-name-cell">
                            <strong>{res.title || res.game_name || "Game"}</strong>
                            <span>{res.total_trials || 0} trials</span>
                          </div>
                        </td>
                        <td>{Math.round((res.accuracy || 0) * 100)}%</td>
                        <td>
                          <span className="rank-badge" style={{ backgroundColor: rank.bg, color: rank.color }}>
                            {rank.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="ai-insight-box-enhanced">
              <div className="insight-header">
                <span className="insight-emoji">🧠</span>
                <h4>Clinical Recommendation</h4>
              </div>
              <div className="insight-content">
                <p>
                  {overallAccuracy > 0.8 
                    ? `Brilliant progress! ${user?.full_name?.split(' ')[0]} demonstrated high focus and fast response times. We recommend introducing more complex pattern recognition in the next session.`
                    : `${user?.full_name?.split(' ')[0]} was engaged throughout. There was slight difficulty with the speed of matching tasks. Focus on slower-paced visual scanning next time.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="report-footer">
          <button className="finish-button" onClick={onFinish}>
            End Session & Save 🚀
          </button>
        </div>
      </div>

      <style>{`
        .session-report-container {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .session-report-card {
          background: white;
          width: 100%;
          max-width: 900px;
          border-radius: 40px;
          overflow: hidden;
          box-shadow: 0 50px 100px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        .report-header {
          background: linear-gradient(135deg, #FF5A78, #FF8C9E);
          padding: 40px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .report-titles h1 { margin: 0; font-size: 32px; font-weight: 900; }
        .report-titles p { margin: 5px 0 0; opacity: 0.9; font-weight: 600; }
        .overall-score-badge {
          background: white;
          color: #FF5A78;
          padding: 15px 25px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .score-value { font-size: 36px; font-weight: 900; }
        .score-label { font-size: 12px; font-weight: 800; text-transform: uppercase; }
        
        .report-body { padding: 40px; display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; overflow-y: auto; }
        .radar-section h3, .metrics-section h3 { margin: 0 0 20px; color: #1E293B; font-weight: 800; }
        
        .analysis-table { width: 100%; border-collapse: collapse; }
        .analysis-table th { text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #94A3B8; border-bottom: 2px solid #F1F5F9; }
        .analysis-table td { padding: 15px 12px; border-bottom: 1px solid #F1F5F9; font-weight: 600; }
        .game-name-cell strong { display: block; color: #1E293B; }
        .game-name-cell span { font-size: 11px; color: #94A3B8; }
        
        .rank-badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        
        .ai-insight-box-enhanced { margin-top: 30px; background: #FFF0F3; border-radius: 25px; padding: 25px; border: 2px solid #FFE4E8; }
        .insight-header { display: flex; alignItems: center; gap: 10px; margin-bottom: 10px; }
        .insight-header h4 { margin: 0; color: #FF5A78; font-weight: 800; }
        .insight-content p { margin: 0; color: #475569; line-height: 1.6; font-size: 15px; font-weight: 500; }
        
        .report-footer { padding: 20px 40px 40px; text-align: center; }
        .finish-button { 
          background: #1E293B; color: white; border: none; padding: 18px 40px; 
          border-radius: 25px; font-size: 20px; font-weight: 800; cursor: pointer; transition: 0.3s;
        }
        .finish-button:hover { transform: scale(1.05); background: #334155; }
      `}</style>
    </div>
  );
}
