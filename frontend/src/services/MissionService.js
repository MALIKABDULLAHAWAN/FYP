/**
 * MissionService
 * 
 * Manages daily randomized goals for the child:
 * - Generates new missions each day
 * - Tracks progress towards missions
 * - Notifies when missions are completed
 */

class MissionService {
  constructor() {
    this.missions = [];
    this.loadMissions();
  }

  // Potential mission templates
  templates = [
    { id: 'play_games', text: 'Play {target} different games', target: 3, type: 'count', metric: 'gamesPlayed' },
    { id: 'earn_stars', text: 'Catch {target} gold stars!', target: 10, type: 'count', metric: 'starsEarned' },
    { id: 'correct_answers', text: 'Get {target} correct answers', target: 20, type: 'count', metric: 'correctTotal' },
    { id: 'streak_days', text: 'Keep your {target} day streak!', target: 2, type: 'count', metric: 'streak' },
    { id: 'explore_new', text: 'Try a new activity today', target: 1, type: 'boolean', metric: 'newActivity' }
  ];

  loadMissions() {
    try {
      const saved = localStorage.getItem('dhyan_missions');
      const today = new Date().toDateString();
      const lastUpdate = localStorage.getItem('dhyan_missions_date');

      if (saved && lastUpdate === today) {
        this.missions = JSON.parse(saved);
      } else {
        this.generateDailyMissions();
      }
    } catch (e) {
      this.generateDailyMissions();
    }
  }

  generateDailyMissions() {
    const today = new Date().toDateString();
    // Select 3 random templates
    const shuffled = [...this.templates].sort(() => 0.5 - Math.random());
    this.missions = shuffled.slice(0, 3).map(m => ({
      ...m,
      current: 0,
      completed: false,
      date: today
    }));
    this.saveMissions();
    localStorage.setItem('dhyan_missions_date', today);
  }

  saveMissions() {
    localStorage.setItem('dhyan_missions', JSON.stringify(this.missions));
  }

  getMissions() {
    return this.missions;
  }

  // Update progress for a specific metric
  updateProgress(metric, value = 1) {
    let changed = false;
    this.missions = this.missions.map(m => {
      if (m.metric === metric && !m.completed) {
        const newTotal = m.current + value;
        const isCompleted = newTotal >= m.target;
        changed = true;
        return { ...m, current: Math.min(newTotal, m.target), completed: isCompleted };
      }
      return m;
    });

    if (changed) {
      this.saveMissions();
    }
    return this.missions;
  }

  getMissionSummary() {
    const completedCount = this.missions.filter(m => m.completed).length;
    return {
      missions: this.missions,
      completedCount,
      totalCount: this.missions.length,
      allDone: completedCount === this.missions.length
    };
  }
}

const missionService = new MissionService();
export default missionService;
