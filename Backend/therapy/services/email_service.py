"""
EMAIL NOTIFICATION SERVICE
Sends automated reports and alerts
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings


class EmailService:
    """Handles email notifications for therapy progress"""
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@dhyan.com')
        self.enabled = getattr(settings, 'EMAIL_ENABLED', True)
    
    def send_weekly_report(self, child_name: str, recipient_email: str, stats: Dict) -> bool:
        """Send weekly progress report"""
        if not self.enabled:
            return False
        
        try:
            subject = f"📊 {child_name}'s Weekly Progress Report"
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Weekly Progress Report</h2>
                <p>Hello! Here's how <strong>{child_name}</strong> did this week:</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>📈 This Week's Stats</h3>
                    <ul>
                        <li>Sessions completed: {stats.get('sessions', 0)}</li>
                        <li>Learning time: {stats.get('minutes', 0)} minutes</li>
                        <li>Accuracy: {stats.get('accuracy', 0)}%</li>
                    </ul>
                </div>
                
                <p>Keep up the great work! 🌟</p>
            </body>
            </html>
            """
            
            msg = EmailMultiAlternatives(
                subject,
                "Weekly progress report attached",
                self.from_email,
                [recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            return True
        except Exception as e:
            print(f"Email error: {e}")
            return False
    
    def send_milestone_alert(self, child_name: str, milestone: str, recipient_email: str) -> bool:
        """Send milestone achievement email"""
        if not self.enabled:
            return False
        
        try:
            subject = f"🎉 {child_name} achieved a milestone!"
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center;">
                <h1 style="color: #667eea;">🎉 Milestone Achieved!</h1>
                <p style="font-size: 18px;">
                    <strong>{child_name}</strong> just achieved:<br>
                    <span style="color: #f59e0b; font-size: 24px;">{milestone}</span>
                </p>
                <p>Congratulations! 🌟</p>
            </body>
            </html>
            """
            
            msg = EmailMultiAlternatives(
                subject,
                f"{child_name} achieved: {milestone}",
                self.from_email,
                [recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            return True
        except Exception as e:
            print(f"Email error: {e}")
            return False


# Singleton instance
email_service = EmailService()
