"""
ADVANCED ANALYTICS SERVICE
Comprehensive progress tracking and insights for therapists/parents
"""

import json
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Optional
from django.db.models import Avg, Count, Max, Min, Sum
from ..models import Child, TherapySession, GameSession, Trial, Observation


class AnalyticsService:
    """
    Generates comprehensive analytics reports for child progress
    """
    
    def __init__(self, child_id: int):
        self.child_id = child_id
        self.child = None
        self.sessions = None
        self._load_data()
    
    def _load_data(self):
        """Load child data and sessions"""
        try:
            self.child = Child.objects.get(id=self.child_id)
            self.sessions = TherapySession.objects.filter(
                child=self.child
            ).order_by('start_time')
        except Child.DoesNotExist:
            pass
    
    def generate_full_report(self) -> Dict:
        """Generate comprehensive analytics report"""
        if not self.child:
            return {'error': 'Child not found'}
        
        return {
            'summary': self.get_summary_stats(),
            'progress_over_time': self.get_progress_trends(),
            'skill_breakdown': self.get_skill_breakdown(),
            'engagement_metrics': self.get_engagement_metrics(),
            'learning_patterns': self.get_learning_patterns(),
            'recommendations': self.generate_recommendations(),
            'comparison': self.get_peer_comparison(),
            'predictions': self.get_future_predictions(),
            'milestones': self.get_milestones(),
            'generated_at': datetime.now().isoformat()
        }
    
    def get_summary_stats(self) -> Dict:
        """Get summary statistics"""
        total_sessions = self.sessions.count()
        completed_sessions = self.sessions.filter(status='completed').count()
        
        total_time = sum(
            s.duration_minutes or 0 
            for s in self.sessions.filter(status='completed')
        )
        
        # Calculate overall accuracy
        trials = Trial.objects.filter(session__child=self.child)
        correct_trials = trials.filter(success=True).count()
        total_trials = trials.count()
        accuracy = (correct_trials / total_trials * 100) if total_trials > 0 else 0
        
        # Recent activity
        last_30_days = self.sessions.filter(
            start_time__gte=datetime.now() - timedelta(days=30)
        ).count()
        
        return {
            'child_name': f"{self.child.first_name} {self.child.last_name}",
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'completion_rate': round(completed_sessions / total_sessions * 100, 1) if total_sessions > 0 else 0,
            'total_learning_time': total_time,
            'average_session_length': round(total_time / completed_sessions, 1) if completed_sessions > 0 else 0,
            'overall_accuracy': round(accuracy, 1),
            'total_trials': total_trials,
            'sessions_last_30_days': last_30_days,
            'account_created': self.child.date_of_birth.isoformat() if self.child.date_of_birth else None
        }
    
    def get_progress_trends(self) -> Dict:
        """Analyze progress trends over time"""
        # Monthly aggregation
        monthly_data = defaultdict(lambda: {'sessions': 0, 'accuracy': [], 'time': 0})
        
        for session in self.sessions.filter(status='completed'):
            month_key = session.start_time.strftime('%Y-%m')
            monthly_data[month_key]['sessions'] += 1
            monthly_data[month_key]['time'] += session.duration_minutes or 0
            
            # Calculate accuracy for this session
            trials = Trial.objects.filter(session=session)
            if trials.count() > 0:
                acc = trials.filter(success=True).count() / trials.count() * 100
                monthly_data[month_key]['accuracy'].append(acc)
        
        # Format for charting
        trend_data = []
        for month, data in sorted(monthly_data.items()):
            avg_accuracy = sum(data['accuracy']) / len(data['accuracy']) if data['accuracy'] else 0
            trend_data.append({
                'month': month,
                'sessions': data['sessions'],
                'accuracy': round(avg_accuracy, 1),
                'learning_time': data['time']
            })
        
        return {
            'monthly_trends': trend_data,
            'trend_direction': self._calculate_trend_direction(trend_data),
            'improvement_rate': self._calculate_improvement_rate(trend_data)
        }
    
    def get_skill_breakdown(self) -> Dict:
        """Analyze performance by skill area"""
        # Get all trials with game types
        trials = Trial.objects.filter(
            session__child=self.child
        ).select_related('session')
        
        skills = defaultdict(lambda: {'correct': 0, 'total': 0, 'times': []})
        
        for trial in trials:
            game_type = trial.session.game_type or 'general'
            skills[game_type]['total'] += 1
            if trial.success:
                skills[game_type]['correct'] += 1
            if trial.response_time_ms:
                skills[game_type]['times'].append(trial.response_time_ms)
        
        skill_data = []
        for skill, data in skills.items():
            accuracy = data['correct'] / data['total'] * 100 if data['total'] > 0 else 0
            avg_time = sum(data['times']) / len(data['times']) if data['times'] else 0
            
            skill_data.append({
                'skill': skill,
                'accuracy': round(accuracy, 1),
                'total_attempts': data['total'],
                'average_response_time_ms': round(avg_time, 0),
                'proficiency_level': self._get_proficiency_level(accuracy)
            })
        
        return {
            'skills': sorted(skill_data, key=lambda x: x['accuracy'], reverse=True),
            'strongest_skill': skill_data[0] if skill_data else None,
            'needs_improvement': [s for s in skill_data if s['accuracy'] < 60]
        }
    
    def get_engagement_metrics(self) -> Dict:
        """Analyze engagement patterns"""
        sessions = self.sessions.filter(status='completed')
        
        if not sessions:
            return {'error': 'No completed sessions'}
        
        # Session frequency
        session_dates = [s.start_time.date() for s in sessions]
        unique_days = len(set(session_dates))
        
        # Streak analysis
        streaks = self._calculate_streaks(session_dates)
        
        # Time of day patterns
        hour_distribution = defaultdict(int)
        for s in sessions:
            hour_distribution[s.start_time.hour] += 1
        
        best_hours = sorted(hour_distribution.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Day of week patterns
        dow_distribution = defaultdict(int)
        for s in sessions:
            dow_distribution[s.start_time.strftime('%A')] += 1
        
        return {
            'total_active_days': unique_days,
            'average_sessions_per_day': round(sessions.count() / max(unique_days, 1), 2),
            'longest_streak': max(streaks) if streaks else 0,
            'current_streak': streaks[-1] if streaks else 0,
            'preferred_hours': [{'hour': h, 'sessions': c} for h, c in best_hours],
            'day_of_week_distribution': dict(dow_distribution),
            'engagement_score': self._calculate_engagement_score(sessions.count(), unique_days, streaks)
        }
    
    def get_learning_patterns(self) -> Dict:
        """Identify learning patterns and behaviors"""
        trials = Trial.objects.filter(session__child=self.child)
        
        # Response time trends
        response_times = [t.response_time_ms for t in trials if t.response_time_ms]
        
        # Error patterns
        error_trials = trials.filter(success=False)
        error_types = defaultdict(int)
        
        for trial in error_trials:
            # Categorize errors based on game type and response
            error_category = self._categorize_error(trial)
            error_types[error_category] += 1
        
        # Learning curve
        learning_curve = self._calculate_learning_curve()
        
        return {
            'average_response_time_ms': sum(response_times) / len(response_times) if response_times else 0,
            'response_time_trend': 'improving' if self._is_response_time_improving() else 'stable',
            'common_error_types': dict(error_types.most_common(5)) if hasattr(error_types, 'most_common') else dict(error_types),
            'learning_curve': learning_curve,
            'attention_span_minutes': self._estimate_attention_span(),
            'preferred_difficulty': self._get_preferred_difficulty()
        }
    
    def generate_recommendations(self) -> List[Dict]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Analyze data for recommendations
        stats = self.get_summary_stats()
        skills = self.get_skill_breakdown()
        engagement = self.get_engagement_metrics()
        
        # Skill-based recommendations
        if skills.get('needs_improvement'):
            for skill in skills['needs_improvement'][:2]:
                recommendations.append({
                    'type': 'skill_practice',
                    'priority': 'high',
                    'message': f"Practice more {skill['skill']} games to improve accuracy",
                    'action': f"Schedule daily {skill['skill']} practice sessions",
                    'expected_improvement': '15-20% accuracy increase'
                })
        
        # Engagement recommendations
        if engagement.get('engagement_score', 0) < 50:
            recommendations.append({
                'type': 'engagement',
                'priority': 'medium',
                'message': 'Increase session frequency for better retention',
                'action': 'Aim for 3-4 short sessions per week',
                'expected_improvement': 'Better skill retention'
            })
        
        if engagement.get('current_streak', 0) < 3:
            recommendations.append({
                'type': 'consistency',
                'priority': 'medium',
                'message': 'Build a learning streak for better progress',
                'action': 'Try to practice every day, even for just 5 minutes',
                'expected_improvement': 'Improved long-term retention'
            })
        
        # Difficulty recommendations
        patterns = self.get_learning_patterns()
        if patterns.get('preferred_difficulty') == 'too_easy':
            recommendations.append({
                'type': 'challenge',
                'priority': 'low',
                'message': 'Increase difficulty to maintain engagement',
                'action': 'Try medium or hard difficulty levels',
                'expected_improvement': 'Better engagement and growth'
            })
        
        # Time-based recommendations
        if engagement.get('preferred_hours'):
            best_hour = engagement['preferred_hours'][0]['hour']
            recommendations.append({
                'type': 'timing',
                'priority': 'low',
                'message': f"Optimal learning time appears to be around {best_hour}:00",
                'action': f"Schedule sessions around {best_hour}:00 for best results",
                'expected_improvement': 'Better focus and performance'
            })
        
        return recommendations
    
    def get_peer_comparison(self) -> Dict:
        """Compare progress with anonymized peers"""
        # Get average stats for same age group
        age = self._calculate_age()
        
        if age:
            age_group = (age // 2) * 2  # Group by 2-year ranges
            
            peers = Child.objects.filter(
                date_of_birth__isnull=False
            ).exclude(id=self.child_id)
            
            # Calculate peer averages
            peer_stats = []
            for peer in peers:
                peer_age = self._calculate_age_for_child(peer)
                if peer_age and abs(peer_age - age) <= 1:
                    peer_service = AnalyticsService(peer.id)
                    peer_summary = peer_service.get_summary_stats()
                    if 'error' not in peer_summary:
                        peer_stats.append(peer_summary)
            
            if peer_stats:
                avg_accuracy = sum(p['overall_accuracy'] for p in peer_stats) / len(peer_stats)
                avg_sessions = sum(p['total_sessions'] for p in peer_stats) / len(peer_stats)
                my_stats = self.get_summary_stats()
                
                return {
                    'age_group': f"{age_group}-{age_group + 2}",
                    'peer_count': len(peer_stats),
                    'my_accuracy': my_stats['overall_accuracy'],
                    'peer_average_accuracy': round(avg_accuracy, 1),
                    'accuracy_percentile': self._calculate_percentile(
                        my_stats['overall_accuracy'],
                        [p['overall_accuracy'] for p in peer_stats]
                    ),
                    'my_sessions': my_stats['total_sessions'],
                    'peer_average_sessions': round(avg_sessions, 1),
                    'comparison_note': 'Above average' if my_stats['overall_accuracy'] > avg_accuracy else 'Below average'
                }
        
        return {'error': 'Insufficient peer data for comparison'}
    
    def get_future_predictions(self) -> Dict:
        """Predict future progress based on current trends"""
        trends = self.get_progress_trends()
        
        if 'monthly_trends' not in trends or len(trends['monthly_trends']) < 2:
            return {'error': 'Insufficient data for predictions'}
        
        # Simple linear projection
        recent_months = trends['monthly_trends'][-3:]
        avg_improvement = trends.get('improvement_rate', 0)
        
        # Predict next 3 months
        predictions = []
        current_accuracy = recent_months[-1]['accuracy']
        
        for i in range(1, 4):
            predicted_accuracy = min(100, current_accuracy + (avg_improvement * i))
            predictions.append({
                'month_offset': i,
                'predicted_accuracy': round(predicted_accuracy, 1),
                'confidence': max(0, 100 - i * 20)  # Decreasing confidence
            })
        
        return {
            'predictions': predictions,
            'projected_mastery_months': self._estimate_mastery_time(current_accuracy, avg_improvement),
            'trend_strength': 'strong' if avg_improvement > 5 else 'moderate' if avg_improvement > 2 else 'weak'
        }
    
    def get_milestones(self) -> List[Dict]:
        """Get achieved and upcoming milestones"""
        stats = self.get_summary_stats()
        milestones = []
        
        # Achieved milestones
        if stats['completed_sessions'] >= 1:
            milestones.append({'name': 'First Session', 'achieved': True, 'date': None, 'icon': '🎯'})
        
        if stats['completed_sessions'] >= 10:
            milestones.append({'name': '10 Sessions', 'achieved': True, 'date': None, 'icon': '🌟'})
        
        if stats['completed_sessions'] >= 50:
            milestones.append({'name': '50 Sessions', 'achieved': True, 'date': None, 'icon': '🏆'})
        
        if stats['overall_accuracy'] >= 80:
            milestones.append({'name': '80% Accuracy', 'achieved': True, 'date': None, 'icon': '💯'})
        
        engagement = self.get_engagement_metrics()
        if engagement.get('longest_streak', 0) >= 7:
            milestones.append({'name': '7-Day Streak', 'achieved': True, 'date': None, 'icon': '🔥'})
        
        # Upcoming milestones
        upcoming = []
        if stats['completed_sessions'] < 10:
            upcoming.append({'name': '10 Sessions', 'progress': stats['completed_sessions'] / 10 * 100, 'icon': '🌟'})
        
        if stats['overall_accuracy'] < 80:
            upcoming.append({'name': '80% Accuracy', 'progress': stats['overall_accuracy'] / 80 * 100, 'icon': '💯'})
        
        return {'achieved': milestones, 'upcoming': upcoming}
    
    def export_report_pdf(self) -> bytes:
        """Generate PDF report (placeholder for actual implementation)"""
        # This would use a PDF generation library
        pass
    
    # Helper methods
    def _calculate_age(self) -> Optional[int]:
        if self.child and self.child.date_of_birth:
            today = datetime.now().date()
            return today.year - self.child.date_of_birth.year
        return None
    
    def _calculate_age_for_child(self, child) -> Optional[int]:
        if child.date_of_birth:
            today = datetime.now().date()
            return today.year - child.date_of_birth.year
        return None
    
    def _calculate_streaks(self, dates: List) -> List[int]:
        if not dates:
            return []
        
        sorted_dates = sorted(set(dates))
        streaks = []
        current_streak = 1
        
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                current_streak += 1
            else:
                streaks.append(current_streak)
                current_streak = 1
        
        streaks.append(current_streak)
        return streaks
    
    def _calculate_trend_direction(self, data: List[Dict]) -> str:
        if len(data) < 2:
            return 'insufficient_data'
        
        first_acc = data[0]['accuracy']
        last_acc = data[-1]['accuracy']
        
        if last_acc > first_acc + 10:
            return 'improving'
        elif last_acc < first_acc - 10:
            return 'declining'
        return 'stable'
    
    def _calculate_improvement_rate(self, data: List[Dict]) -> float:
        if len(data) < 2:
            return 0
        
        total_change = data[-1]['accuracy'] - data[0]['accuracy']
        months = len(data)
        
        return round(total_change / months, 2)
    
    def _get_proficiency_level(self, accuracy: float) -> str:
        if accuracy >= 90:
            return 'master'
        elif accuracy >= 80:
            return 'advanced'
        elif accuracy >= 70:
            return 'intermediate'
        elif accuracy >= 60:
            return 'developing'
        return 'beginner'
    
    def _categorize_error(self, trial) -> str:
        # Simplified error categorization
        if trial.response_time_ms and trial.response_time_ms < 2000:
            return 'rushed'
        elif trial.response_time_ms and trial.response_time_ms > 10000:
            return 'slow_confused'
        return 'wrong_answer'
    
    def _calculate_learning_curve(self) -> Dict:
        # Calculate sessions to reach proficiency
        sessions = list(self.sessions.filter(status='completed'))
        
        if len(sessions) < 5:
            return {'stage': 'early', 'sessions_to_proficiency': 'unknown'}
        
        # Check if accuracy is improving
        recent_accuracy = []
        for session in sessions[-5:]:
            trials = Trial.objects.filter(session=session)
            if trials.count() > 0:
                acc = trials.filter(success=True).count() / trials.count() * 100
                recent_accuracy.append(acc)
        
        if len(recent_accuracy) >= 3:
            if recent_accuracy[-1] > recent_accuracy[0]:
                return {'stage': 'rapid_improvement', 'sessions_to_proficiency': '8-12'}
        
        return {'stage': 'steady', 'sessions_to_proficiency': '15-20'}
    
    def _estimate_attention_span(self) -> int:
        sessions = self.sessions.filter(status='completed')
        if not sessions:
            return 10
        
        avg_duration = sum(s.duration_minutes or 0 for s in sessions) / sessions.count()
        return min(45, max(5, int(avg_duration)))
    
    def _get_preferred_difficulty(self) -> str:
        # Analyze if current difficulty is appropriate
        stats = self.get_summary_stats()
        accuracy = stats['overall_accuracy']
        
        if accuracy > 90:
            return 'too_easy'
        elif accuracy < 50:
            return 'too_hard'
        return 'appropriate'
    
    def _calculate_engagement_score(self, sessions: int, days: int, streaks: List[int]) -> int:
        if sessions == 0:
            return 0
        
        score = min(100, sessions * 2)  # Base score from sessions
        score += min(20, len(streaks) * 5)  # Bonus for consistency
        score += min(30, max(streaks) if streaks else 0)  # Bonus for longest streak
        
        return min(100, score)
    
    def _calculate_percentile(self, value: float, all_values: List[float]) -> int:
        if not all_values:
            return 50
        
        below = sum(1 for v in all_values if v < value)
        return int((below / len(all_values)) * 100)
    
    def _estimate_mastery_time(self, current_accuracy: float, improvement_rate: float) -> str:
        if improvement_rate <= 0:
            return 'unable_to_predict'
        
        months_to_90 = (90 - current_accuracy) / improvement_rate
        
        if months_to_90 <= 1:
            return '1_month'
        elif months_to_90 <= 3:
            return '3_months'
        elif months_to_90 <= 6:
            return '6_months'
        return '6+_months'
    
    def _is_response_time_improving(self) -> bool:
        # Check if recent response times are faster
        recent_trials = Trial.objects.filter(
            session__child=self.child
        ).order_by('-id')[:50]
        
        if recent_trials.count() < 20:
            return False
        
        times = [t.response_time_ms for t in recent_trials if t.response_time_ms]
        if len(times) < 20:
            return False
        
        first_half = sum(times[:len(times)//2]) / (len(times)//2)
        second_half = sum(times[len(times)//2:]) / (len(times)//2)
        
        return second_half < first_half


def generate_analytics_report(child_id: int) -> Dict:
    """Convenience function to generate report"""
    service = AnalyticsService(child_id)
    return service.generate_full_report()
