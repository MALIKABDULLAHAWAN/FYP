// Therapist Console SVG Stickers
// Replaces emojis with colorful, professional stickers

export const TherapistStickers = {
  // Header & Navigation
  therapist: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <circle cx="50" cy="40" r="25" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <circle cx="40" cy="35" r="4" fill="#333"/>
      <circle cx="60" cy="35" r="4" fill="#333"/>
      <path d="M45,48 Q50,52 55,48" stroke="#333" strokeWidth="2" fill="none"/>
      <path d="M50,65 L50,85" stroke="#FF69B4" strokeWidth="3"/>
      <path d="M30,75 Q50,85 70,75" stroke="#4ECDC4" strokeWidth="3" fill="none"/>
      <rect x="25" y="70" width="50" height="25" rx="8" fill="#4ECDC4" opacity="0.3"/>
    </svg>
  ),
  
  child: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <circle cx="50" cy="40" r="22" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <circle cx="42" cy="36" r="3" fill="#333"/>
      <circle cx="58" cy="36" r="3" fill="#333"/>
      <path d="M45,45 Q50,48 55,45" stroke="#333" strokeWidth="2" fill="none"/>
      <path d="M35,25 Q30,15 35,10" stroke="#8B4513" strokeWidth="3" fill="none"/>
      <ellipse cx="38" cy="12" rx="8" ry="5" fill="#FF69B4"/>
      <path d="M65,25 Q70,15 65,10" stroke="#8B4513" strokeWidth="3" fill="none"/>
      <ellipse cx="62" cy="12" rx="8" ry="5" fill="#FF69B4"/>
      <circle cx="50" cy="65" r="20" fill="#87CEEB" stroke="#4682B4" strokeWidth="3"/>
    </svg>
  ),
  
  add: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <circle cx="50" cy="50" r="40" fill="#84FAB0" stroke="#4ADE80" strokeWidth="3"/>
      <line x1="50" y1="25" x2="50" y2="75" stroke="white" strokeWidth="8" strokeLinecap="round"/>
      <line x1="25" y1="50" x2="75" y2="50" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  
  close: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <circle cx="50" cy="50" r="40" fill="#FF6B6B" stroke="#EF4444" strokeWidth="3"/>
      <line x1="30" y1="30" x2="70" y2="70" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      <line x1="70" y1="30" x2="30" y2="70" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  ),
  
  // Stats
  children: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <circle cx="30" cy="35" r="15" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2"/>
      <circle cx="70" cy="35" r="15" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
      <circle cx="50" cy="70" r="20" fill="#FFD93D" stroke="#FFA500" strokeWidth="2"/>
      <circle cx="25" cy="32" r="2" fill="#333"/>
      <circle cx="35" cy="32" r="2" fill="#333"/>
      <circle cx="65" cy="32" r="2" fill="#333"/>
      <circle cx="75" cy="32" r="2" fill="#333"/>
      <circle cx="45" cy="67" r="2" fill="#333"/>
      <circle cx="55" cy="67" r="2" fill="#333"/>
    </svg>
  ),
  
  sessions: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <rect x="15" y="25" width="70" height="50" rx="8" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <rect x="25" y="15" width="50" height="20" rx="5" fill="#FF9A9E" stroke="#FECFEF" strokeWidth="2"/>
      <circle cx="35" cy="55" r="6" fill="#84FAB0"/>
      <circle cx="50" cy="55" r="6" fill="#8FD3F4"/>
      <circle cx="65" cy="55" r="6" fill="#FF9A9E"/>
      <line x1="25" y1="70" x2="75" y2="70" stroke="#FFA500" strokeWidth="2"/>
    </svg>
  ),
  
  completed: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <circle cx="50" cy="50" r="40" fill="#84FAB0" stroke="#4ADE80" strokeWidth="3"/>
      <path d="M30,50 L45,65 L70,35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  
  accuracy: (
    <svg viewBox="0 0 100 100" className="therapist-sticker">
      <circle cx="50" cy="50" r="40" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <circle cx="50" cy="50" r="25" fill="none" stroke="#FF9A9E" strokeWidth="4"/>
      <line x1="50" y1="50" x2="50" y2="30" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      <line x1="50" y1="50" x2="65" y2="60" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="50" r="5" fill="#333"/>
    </svg>
  ),
  
  // Tabs
  overview: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-small">
      <rect x="10" y="15" width="80" height="70" rx="8" fill="#FF9A9E" stroke="#FECFEF" strokeWidth="2"/>
      <rect x="20" y="25" width="25" height="20" rx="4" fill="#84FAB0"/>
      <rect x="55" y="25" width="25" height="20" rx="4" fill="#8FD3F4"/>
      <rect x="20" y="55" width="60" height="20" rx="4" fill="#FFD93D"/>
    </svg>
  ),
  
  games: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-small">
      <rect x="20" y="30" width="60" height="40" rx="6" fill="#4ECDC4" stroke="#44A08D" strokeWidth="2"/>
      <circle cx="35" cy="50" r="6" fill="#FF6B6B"/>
      <circle cx="65" cy="50" r="6" fill="#FFD93D"/>
      <rect x="45" y="45" width="10" height="10" rx="2" fill="#FFF"/>
      <line x1="50" y1="20" x2="50" y2="30" stroke="#8B4513" strokeWidth="3"/>
      <ellipse cx="50" cy="18" rx="8" ry="5" fill="#32CD32"/>
    </svg>
  ),
  
  calendar: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-small">
      <rect x="15" y="25" width="70" height="60" rx="8" fill="#FFD93D" stroke="#FFA500" strokeWidth="2"/>
      <line x1="15" y1="40" x2="85" y2="40" stroke="#FFA500" strokeWidth="2"/>
      <rect x="25" y="15" width="10" height="15" rx="3" fill="#FF9A9E"/>
      <rect x="65" y="15" width="10" height="15" rx="3" fill="#FF9A9E"/>
      <circle cx="35" cy="60" r="5" fill="#84FAB0"/>
      <circle cx="50" cy="60" r="5" fill="#8FD3F4"/>
      <circle cx="65" cy="60" r="5" fill="#FF9A9E"/>
    </svg>
  ),
  
  analytics: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-small">
      <rect x="10" y="10" width="80" height="80" rx="8" fill="#8FD3F4" stroke="#4ECDC4" strokeWidth="2"/>
      <line x1="20" y1="70" x2="40" y2="50" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      <line x1="40" y1="50" x2="60" y2="60" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="80" y2="30" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="40" cy="50" r="4" fill="#FF6B6B"/>
      <circle cx="60" cy="60" r="4" fill="#FFD93D"/>
      <circle cx="80" cy="30" r="4" fill="#84FAB0"/>
    </svg>
  ),
  
  // Gender icons
  male: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-badge">
      <circle cx="50" cy="50" r="35" fill="#87CEEB" stroke="#4682B4" strokeWidth="3"/>
      <circle cx="40" cy="45" r="4" fill="#333"/>
      <circle cx="60" cy="45" r="4" fill="#333"/>
      <path d="M45,58 Q50,62 55,58" stroke="#333" strokeWidth="2" fill="none"/>
    </svg>
  ),
  
  female: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-badge">
      <circle cx="50" cy="50" r="35" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <circle cx="40" cy="45" r="4" fill="#333"/>
      <circle cx="60" cy="45" r="4" fill="#333"/>
      <path d="M45,58 Q50,62 55,58" stroke="#333" strokeWidth="2" fill="none"/>
    </svg>
  ),
  
  // Actions
  play: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-action">
      <circle cx="50" cy="50" r="40" fill="#84FAB0" stroke="#4ADE80" strokeWidth="3"/>
      <polygon points="40,30 40,70 75,50" fill="white"/>
    </svg>
  ),
  
  edit: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-action">
      <rect x="10" y="60" width="80" height="30" rx="5" fill="#FFD93D" stroke="#FFA500" strokeWidth="2"/>
      <path d="M25,55 L70,10 L85,25 L40,70 Z" fill="#8FD3F4" stroke="#4ECDC4" strokeWidth="2"/>
      <line x1="30" y1="50" x2="75" y2="5" stroke="#FFF" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  
  delete: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-action">
      <rect x="25" y="30" width="50" height="60" rx="5" fill="#FF6B6B" stroke="#EF4444" strokeWidth="2"/>
      <line x1="35" y1="45" x2="35" y2="75" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <line x1="50" y1="45" x2="50" y2="75" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <line x1="65" y1="45" x2="65" y2="75" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <line x1="20" y1="30" x2="80" y2="30" stroke="#8B4513" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  ),
  
  warning: (
    <svg viewBox="0 0 100 100" className="therapist-sticker-small">
      <polygon points="50,10 90,85 10,85" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <line x1="50" y1="35" x2="50" y2="60" stroke="#333" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="50" cy="72" r="5" fill="#333"/>
    </svg>
  )
};

export default TherapistStickers;
