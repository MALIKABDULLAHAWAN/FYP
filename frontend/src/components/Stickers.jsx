// Cute SVG Stickers Component for Games
// Replaces emojis with colorful, professional stickers

export const AnimalStickers = {
  cat: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="55" r="35" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <polygon points="20,35 35,15 45,30" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <polygon points="80,35 65,15 55,30" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <circle cx="35" cy="50" r="5" fill="#333"/>
      <circle cx="65" cy="50" r="5" fill="#333"/>
      <ellipse cx="50" cy="58" rx="3" ry="2" fill="#FF69B4"/>
      <path d="M40,65 Q50,70 60,65" stroke="#333" strokeWidth="2" fill="none"/>
    </svg>
  ),
  dog: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="55" rx="40" ry="35" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <ellipse cx="25" cy="35" rx="12" ry="20" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <ellipse cx="75" cy="35" rx="12" ry="20" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <circle cx="35" cy="55" r="6" fill="#333"/>
      <circle cx="65" cy="55" r="6" fill="#333"/>
      <ellipse cx="50" cy="65" rx="8" ry="6" fill="#333"/>
      <path d="M45,75 Q50,80 55,75" stroke="#333" strokeWidth="2" fill="none"/>
    </svg>
  ),
  rabbit: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="70" rx="30" ry="25" fill="#FFF0F5" stroke="#FFB6C1" strokeWidth="3"/>
      <ellipse cx="35" cy="30" rx="8" ry="25" fill="#FFF0F5" stroke="#FFB6C1" strokeWidth="3"/>
      <ellipse cx="65" cy="30" rx="8" ry="25" fill="#FFF0F5" stroke="#FFB6C1" strokeWidth="3"/>
      <circle cx="40" cy="65" r="5" fill="#333"/>
      <circle cx="60" cy="65" r="5" fill="#333"/>
      <ellipse cx="50" cy="72" rx="4" ry="3" fill="#FFB6C1"/>
      <circle cx="50" cy="78" r="3" fill="#FF69B4"/>
    </svg>
  ),
  lion: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="55" r="30" fill="#FFD700" stroke="#FFA500" strokeWidth="3"/>
      {[...Array(12)].map((_, i) => (
        <polygon key={i}
          points={`${50 + 35 * Math.cos(i * Math.PI / 6)},${55 + 35 * Math.sin(i * Math.PI / 6)} ${50 + 45 * Math.cos((i + 0.3) * Math.PI / 6)},${55 + 45 * Math.sin((i + 0.3) * Math.PI / 6)} ${50 + 45 * Math.cos((i - 0.3) * Math.PI / 6)},${55 + 45 * Math.sin((i - 0.3) * Math.PI / 6)}`}
          fill="#FFA500" stroke="#FF8C00" strokeWidth="2"/>
      ))}
      <circle cx="40" cy="50" r="5" fill="#333"/>
      <circle cx="60" cy="50" r="5" fill="#333"/>
      <ellipse cx="50" cy="62" rx="10" ry="8" fill="#FFA500"/>
    </svg>
  ),
  bear: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="60" r="35" fill="#8B4513" stroke="#654321" strokeWidth="3"/>
      <circle cx="20" cy="35" r="15" fill="#8B4513" stroke="#654321" strokeWidth="3"/>
      <circle cx="80" cy="35" r="15" fill="#8B4513" stroke="#654321" strokeWidth="3"/>
      <circle cx="35" cy="55" r="6" fill="#333"/>
      <circle cx="65" cy="55" r="6" fill="#333"/>
      <ellipse cx="50" cy="65" rx="12" ry="8" fill="#D2691E"/>
      <ellipse cx="50" cy="75" rx="8" ry="5" fill="#333"/>
    </svg>
  ),
  frog: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="65" rx="35" ry="30" fill="#90EE90" stroke="#32CD32" strokeWidth="3"/>
      <circle cx="30" cy="35" r="18" fill="#90EE90" stroke="#32CD32" strokeWidth="3"/>
      <circle cx="70" cy="35" r="18" fill="#90EE90" stroke="#32CD32" strokeWidth="3"/>
      <circle cx="30" cy="35" r="10" fill="#FFF"/>
      <circle cx="70" cy="35" r="10" fill="#FFF"/>
      <circle cx="30" cy="35" r="5" fill="#333"/>
      <circle cx="70" cy="35" r="5" fill="#333"/>
      <ellipse cx="50" cy="70" rx="15" ry="10" fill="#98FB98"/>
    </svg>
  ),
  bird: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="55" rx="30" ry="25" fill="#87CEEB" stroke="#4682B4" strokeWidth="3"/>
      <circle cx="65" cy="45" r="8" fill="#FFF"/>
      <circle cx="67" cy="45" r="4" fill="#333"/>
      <polygon points="80,50 95,45 80,55" fill="#FFA500"/>
      <path d="M20,55 Q10,45 20,35" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
      <path d="M80,55 Q90,65 80,75" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
    </svg>
  ),
  fish: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="45" cy="50" rx="35" ry="25" fill="#FF6347" stroke="#DC143C" strokeWidth="3"/>
      <polygon points="80,50 95,35 95,65" fill="#FF6347" stroke="#DC143C" strokeWidth="3"/>
      <circle cx="30" cy="45" r="6" fill="#FFF"/>
      <circle cx="30" cy="45" r="3" fill="#333"/>
      <path d="M25,60 Q35,65 45,60" stroke="#DC143C" strokeWidth="2" fill="none"/>
    </svg>
  ),
  // NEW: Additional animals for Animal Sounds game
  cow: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="60" rx="35" ry="30" fill="#F5F5F5" stroke="#333" strokeWidth="3"/>
      <circle cx="25" cy="35" r="15" fill="#F5F5F5" stroke="#333" strokeWidth="3"/>
      <circle cx="75" cy="35" r="15" fill="#F5F5F5" stroke="#333" strokeWidth="3"/>
      <ellipse cx="35" cy="55" rx="6" ry="8" fill="#333"/>
      <ellipse cx="65" cy="55" rx="6" ry="8" fill="#333"/>
      <ellipse cx="50" cy="45" rx="4" ry="3" fill="#FF69B4"/>
      <ellipse cx="50" cy="75" rx="8" ry="5" fill="#FF69B4"/>
      <circle cx="25" cy="32" r="4" fill="#333"/>
      <circle cx="75" cy="32" r="4" fill="#333"/>
    </svg>
  ),
  pig: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="60" rx="32" ry="28" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <circle cx="20" cy="40" r="12" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <circle cx="80" cy="40" r="12" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <ellipse cx="42" cy="58" rx="6" ry="8" fill="#FF1493"/>
      <ellipse cx="58" cy="58" rx="6" ry="8" fill="#FF1493"/>
      <circle cx="42" cy="55" r="2" fill="#333"/>
      <circle cx="58" cy="55" r="2" fill="#333"/>
      <circle cx="35" cy="50" r="4" fill="#333"/>
      <circle cx="65" cy="50" r="4" fill="#333"/>
      <path d="M48,70 Q50,72 52,70" stroke="#333" strokeWidth="2" fill="none"/>
    </svg>
  ),
  duck: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="65" rx="30" ry="25" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <circle cx="75" cy="50" r="20" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <polygon points="90,50 100,45 100,55" fill="#FFA500"/>
      <circle cx="80" cy="45" r="4" fill="#333"/>
      <path d="M45,85 Q50,90 55,85" stroke="#FFA500" strokeWidth="2" fill="none"/>
    </svg>
  ),
  sheep: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="55" r="30" fill="#FFF" stroke="#DDD" strokeWidth="3"/>
      <circle cx="35" cy="40" r="15" fill="#FFF" stroke="#DDD" strokeWidth="2"/>
      <circle cx="65" cy="40" r="15" fill="#FFF" stroke="#DDD" strokeWidth="2"/>
      <circle cx="40" cy="60" r="15" fill="#FFF" stroke="#DDD" strokeWidth="2"/>
      <circle cx="60" cy="60" r="15" fill="#FFF" stroke="#DDD" strokeWidth="2"/>
      <ellipse cx="50" cy="30" rx="12" ry="15" fill="#333"/>
      <circle cx="45" cy="28" r="3" fill="#FFF"/>
      <circle cx="55" cy="28" r="3" fill="#FFF"/>
    </svg>
  ),
  horse: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="55" rx="35" ry="30" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <ellipse cx="75" cy="35" rx="18" ry="22" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <circle cx="80" cy="30" r="4" fill="#333"/>
      <ellipse cx="88" cy="42" rx="8" ry="4" fill="#333"/>
      <path d="M40,25 L40,10" stroke="#8B4513" strokeWidth="4" strokeLinecap="round"/>
      <path d="M60,25 L60,10" stroke="#8B4513" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="50" cy="45" rx="5" ry="4" fill="#333"/>
    </svg>
  ),
  chicken: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="60" rx="30" ry="28" fill="#FFF" stroke="#FFA500" strokeWidth="3"/>
      <circle cx="75" cy="45" r="15" fill="#FFF" stroke="#FFA500" strokeWidth="3"/>
      <polygon points="88,45 95,42 95,48" fill="#FFA500"/>
      <ellipse cx="50" cy="25" rx="8" ry="12" fill="#FF0000"/>
      <circle cx="78" cy="42" r="3" fill="#333"/>
      <path d="M40,85 L35,95" stroke="#FFA500" strokeWidth="3" strokeLinecap="round"/>
      <path d="M60,85 L65,95" stroke="#FFA500" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  monkey: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="55" r="30" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <ellipse cx="30" cy="35" rx="12" ry="15" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <ellipse cx="70" cy="35" rx="12" ry="15" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
      <ellipse cx="50" cy="50" rx="20" ry="18" fill="#F4C2A1"/>
      <circle cx="42" cy="48" r="4" fill="#333"/>
      <circle cx="58" cy="48" r="4" fill="#333"/>
      <ellipse cx="50" cy="60" rx="6" ry="4" fill="#333"/>
      <path d="M45,70 Q50,75 55,70" stroke="#333" strokeWidth="2" fill="none"/>
    </svg>
  ),
  elephant: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="45" cy="55" rx="35" ry="30" fill="#9B59B6" stroke="#8E44AD" strokeWidth="3"/>
      <ellipse cx="80" cy="50" rx="15" ry="12" fill="#9B59B6" stroke="#8E44AD" strokeWidth="3"/>
      <ellipse cx="85" cy="65" rx="8" ry="20" fill="#9B59B6" stroke="#8E44AD" strokeWidth="3"/>
      <circle cx="40" cy="48" r="4" fill="#333"/>
      <circle cx="60" cy="48" r="4" fill="#333"/>
      <ellipse cx="30" cy="35" rx="20" ry="15" fill="#9B59B6" stroke="#8E44AD" strokeWidth="3"/>
      <path d="M20,35 L15,25" stroke="#9B59B6" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  ),
  snake: (
    <svg viewBox="0 0 100 100" className="sticker">
      <path d="M20,70 Q30,50 50,60 Q70,70 80,50" stroke="#27AE60" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <circle cx="80" cy="50" r="8" fill="#27AE60"/>
      <circle cx="82" cy="47" r="2" fill="#333"/>
      <circle cx="88" cy="47" r="2" fill="#333"/>
      <path d="M85,52 Q90,55 85,58" stroke="#333" strokeWidth="1" fill="none"/>
    </svg>
  ),
  bee: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="55" rx="25" ry="20" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <line x1="35" y1="50" x2="65" y2="50" stroke="#333" strokeWidth="3"/>
      <line x1="35" y1="58" x2="65" y2="58" stroke="#333" strokeWidth="3"/>
      <line x1="35" y1="66" x2="65" y2="66" stroke="#333" strokeWidth="3"/>
      <circle cx="65" cy="45" r="8" fill="#FFF" stroke="#DDD" strokeWidth="2"/>
      <circle cx="35" cy="35" r="15" fill="#E8F4FD" stroke="#87CEEB" strokeWidth="2" opacity="0.6"/>
      <circle cx="65" cy="35" r="15" fill="#E8F4FD" stroke="#87CEEB" strokeWidth="2" opacity="0.6"/>
      <circle cx="70" cy="42" r="3" fill="#333"/>
    </svg>
  )
};

export const FruitStickers = {
  apple: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="55" r="35" fill="#FF6B6B" stroke="#DC143C" strokeWidth="3"/>
      <path d="M50,20 Q60,10 65,25" stroke="#228B22" strokeWidth="4" fill="none"/>
      <ellipse cx="70" cy="30" rx="15" ry="10" fill="#32CD32" stroke="#228B22" strokeWidth="2"/>
      <circle cx="40" cy="50" r="8" fill="#FFF" opacity="0.3"/>
    </svg>
  ),
  banana: (
    <svg viewBox="0 0 100 100" className="sticker">
      <path d="M20,80 Q50,20 80,50 Q60,70 20,80" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
      <ellipse cx="20" cy="80" rx="5" ry="8" fill="#8B4513"/>
      <path d="M25,75 Q35,40 70,55" stroke="#FFA500" strokeWidth="2" fill="none" opacity="0.5"/>
    </svg>
  ),
  orange: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="55" r="35" fill="#FFA500" stroke="#FF8C00" strokeWidth="3"/>
      <circle cx="50" cy="55" r="30" fill="none" stroke="#FF8C00" strokeWidth="1" strokeDasharray="5,5"/>
      <path d="M50,20 Q55,10 60,20" stroke="#228B22" strokeWidth="3" fill="none"/>
      <ellipse cx="65" cy="25" rx="8" ry="4" fill="#32CD32"/>
    </svg>
  ),
  strawberry: (
    <svg viewBox="0 0 100 100" className="sticker">
      <path d="M30,30 Q50,20 70,30 Q75,50 70,75 Q50,90 30,75 Q25,50 30,30" fill="#FF1493" stroke="#DC143C" strokeWidth="3"/>
      <path d="M30,30 Q40,15 50,30 Q60,15 70,30" fill="#228B22" stroke="#006400" strokeWidth="2"/>
      <circle cx="40" cy="50" r="2" fill="#FFD700"/>
      <circle cx="55" cy="60" r="2" fill="#FFD700"/>
      <circle cx="45" cy="70" r="2" fill="#FFD700"/>
    </svg>
  ),
  watermelon: (
    <svg viewBox="0 0 100 100" className="sticker">
      <path d="M15,50 Q50,90 85,50" fill="#FF6B6B" stroke="#228B22" strokeWidth="4"/>
      <path d="M15,50 Q50,80 85,50" fill="none" stroke="#FFF" strokeWidth="2"/>
      <circle cx="35" cy="60" r="3" fill="#333"/>
      <circle cx="50" cy="65" r="3" fill="#333"/>
      <circle cx="65" cy="60" r="3" fill="#333"/>
    </svg>
  ),
  grapes: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="75" r="12" fill="#9370DB" stroke="#8A2BE2" strokeWidth="2"/>
      <circle cx="35" cy="60" r="12" fill="#9370DB" stroke="#8A2BE2" strokeWidth="2"/>
      <circle cx="65" cy="60" r="12" fill="#9370DB" stroke="#8A2BE2" strokeWidth="2"/>
      <circle cx="50" cy="45" r="12" fill="#9370DB" stroke="#8A2BE2" strokeWidth="2"/>
      <circle cx="40" cy="30" r="10" fill="#9370DB" stroke="#8A2BE2" strokeWidth="2"/>
      <circle cx="60" cy="30" r="10" fill="#9370DB" stroke="#8A2BE2" strokeWidth="2"/>
      <path d="M50,20 Q55,10 60,15" stroke="#228B22" strokeWidth="3" fill="none"/>
    </svg>
  ),
  cherry: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="35" cy="65" r="18" fill="#DC143C" stroke="#8B0000" strokeWidth="3"/>
      <circle cx="65" cy="65" r="18" fill="#DC143C" stroke="#8B0000" strokeWidth="3"/>
      <path d="M35,47 Q35,25 50,15" stroke="#228B22" strokeWidth="3" fill="none"/>
      <path d="M65,47 Q65,25 50,15" stroke="#228B22" strokeWidth="3" fill="none"/>
      <ellipse cx="50" cy="15" rx="8" ry="4" fill="#32CD32"/>
      <circle cx="30" cy="60" r="5" fill="#FFF" opacity="0.3"/>
      <circle cx="60" cy="60" r="5" fill="#FFF" opacity="0.3"/>
    </svg>
  ),
  peach: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="55" rx="30" ry="35" fill="#FFDAB9" stroke="#FFA07A" strokeWidth="3"/>
      <path d="M50,20 Q55,10 60,20" stroke="#8B4513" strokeWidth="3" fill="none"/>
      <ellipse cx="65" cy="25" rx="6" ry="4" fill="#228B22"/>
      <path d="M35,45 Q40,40 45,45" stroke="#FFA07A" strokeWidth="2" fill="none"/>
      <path d="M55,45 Q60,40 65,45" stroke="#FFA07A" strokeWidth="2" fill="none"/>
    </svg>
  )
};

export const ShapeStickers = {
  circle: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <circle cx="50" cy="50" r="40" fill="#FF6B6B" stroke="#FF8E53" strokeWidth="4"/>
      <circle cx="35" cy="40" r="10" fill="#FFF" opacity="0.4"/>
    </svg>
  ),
  square: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <rect x="15" y="15" width="70" height="70" rx="8" fill="#4ECDC4" stroke="#44A08D" strokeWidth="4"/>
      <rect x="25" y="25" width="20" height="20" rx="4" fill="#FFF" opacity="0.4"/>
    </svg>
  ),
  triangle: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <polygon points="50,15 85,80 15,80" fill="#FFD93D" stroke="#FFA500" strokeWidth="4"/>
      <polygon points="35,50 45,65 25,65" fill="#FFF" opacity="0.4"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" 
        fill="#FFD700" stroke="#FFA500" strokeWidth="4"/>
      <circle cx="45" cy="40" r="6" fill="#FFF" opacity="0.5"/>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <path d="M50,85 C50,85 15,60 15,40 C15,20 30,10 50,25 C70,10 85,20 85,40 C85,60 50,85 50,85" 
        fill="#FF69B4" stroke="#FF1493" strokeWidth="4"/>
      <ellipse cx="30" cy="35" rx="6" ry="8" fill="#FFF" opacity="0.4"/>
    </svg>
  ),
  diamond: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <polygon points="50,10 90,50 50,90 10,50" fill="#C7CEEA" stroke="#A18CD1" strokeWidth="4"/>
      <polygon points="50,25 65,50 50,75 35,50" fill="#FFF" opacity="0.4"/>
    </svg>
  ),
  oval: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <ellipse cx="50" cy="50" rx="30" ry="45" fill="#95E1D3" stroke="#84CEB8" strokeWidth="4"/>
      <ellipse cx="40" cy="35" rx="8" ry="12" fill="#FFF" opacity="0.4"/>
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <rect x="10" y="25" width="80" height="50" rx="8" fill="#FFA07A" stroke="#FF8B6B" strokeWidth="4"/>
      <rect x="20" y="35" width="25" height="15" rx="4" fill="#FFF" opacity="0.4"/>
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <path d="M60,15 Q30,50 60,85 Q50,50 60,15" fill="#F4F4F4" stroke="#C0C0C0" strokeWidth="4"/>
      <circle cx="55" cy="35" r="5" fill="#E0E0E0"/>
      <circle cx="50" cy="55" r="4" fill="#E0E0E0"/>
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 100 100" className="sticker shape-sticker">
      <ellipse cx="35" cy="60" rx="20" ry="15" fill="#FFF" stroke="#E0E0E0" strokeWidth="3"/>
      <ellipse cx="55" cy="50" rx="25" ry="20" fill="#FFF" stroke="#E0E0E0" strokeWidth="3"/>
      <ellipse cx="75" cy="60" rx="18" ry="15" fill="#FFF" stroke="#E0E0E0" strokeWidth="3"/>
      <circle cx="45" cy="50" r="8" fill="#E8F4FD" opacity="0.5"/>
    </svg>
  )
};

export const PatternStickers = {
  circleRed: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <circle cx="30" cy="30" r="25" fill="#FF6B6B" stroke="#FF8E53" strokeWidth="3"/>
    </svg>
  ),
  circleBlue: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <circle cx="30" cy="30" r="25" fill="#4ECDC4" stroke="#44A08D" strokeWidth="3"/>
    </svg>
  ),
  circleGreen: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <circle cx="30" cy="30" r="25" fill="#95E1D3" stroke="#84CEB8" strokeWidth="3"/>
    </svg>
  ),
  starYellow: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <polygon points="30,5 36,20 52,20 40,30 45,45 30,35 15,45 20,30 8,20 24,20" 
        fill="#FFD93D" stroke="#FFA500" strokeWidth="2"/>
    </svg>
  ),
  heartPink: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <path d="M30,50 C30,50 10,35 10,25 C10,15 20,10 30,18 C40,10 50,15 50,25 C50,35 30,50 30,50" 
        fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2"/>
    </svg>
  ),
  squarePurple: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <rect x="10" y="10" width="40" height="40" rx="5" fill="#C7CEEA" stroke="#A18CD1" strokeWidth="3"/>
    </svg>
  )
};

export const VehicleStickers = {
  car: (
    <svg viewBox="0 0 100 100" className="sticker">
      <rect x="15" y="45" width="70" height="30" rx="5" fill="#FF6B6B" stroke="#DC143C" strokeWidth="3"/>
      <rect x="25" y="30" width="40" height="20" rx="5" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
      <circle cx="25" cy="75" r="10" fill="#333"/>
      <circle cx="75" cy="75" r="10" fill="#333"/>
      <circle cx="25" cy="75" r="5" fill="#999"/>
      <circle cx="75" cy="75" r="5" fill="#999"/>
    </svg>
  ),
  bike: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="25" cy="70" r="18" fill="none" stroke="#333" strokeWidth="4"/>
      <circle cx="75" cy="70" r="18" fill="none" stroke="#333" strokeWidth="4"/>
      <line x1="25" y1="70" x2="50" y2="40" stroke="#FF6B6B" strokeWidth="4"/>
      <line x1="75" y1="70" x2="50" y2="40" stroke="#FF6B6B" strokeWidth="4"/>
      <line x1="50" y1="40" x2="55" y2="25" stroke="#FF6B6B" strokeWidth="4"/>
      <line x1="45" y1="35" x2="60" y2="35" stroke="#FF6B6B" strokeWidth="3"/>
      <ellipse cx="55" cy="22" rx="8" ry="5" fill="#FFA500"/>
    </svg>
  ),
  airplane: (
    <svg viewBox="0 0 100 100" className="sticker">
      <ellipse cx="50" cy="50" rx="40" ry="12" fill="#87CEEB" stroke="#4682B4" strokeWidth="3"/>
      <polygon points="50,20 55,45 45,45" fill="#4682B4"/>
      <polygon points="50,80 45,55 55,55" fill="#4682B4"/>
      <rect x="30" y="45" width="40" height="10" fill="#B0E0E6"/>
      <line x1="20" y1="50" x2="10" y2="45" stroke="#666" strokeWidth="2"/>
      <line x1="80" y1="50" x2="90" y2="45" stroke="#666" strokeWidth="2"/>
    </svg>
  ),
  boat: (
    <svg viewBox="0 0 100 100" className="sticker">
      <path d="M15,60 Q50,85 85,60 L75,45 L25,45 Z" fill="#FFF" stroke="#4682B4" strokeWidth="3"/>
      <rect x="45" y="20" width="5" height="30" fill="#8B4513"/>
      <polygon points="50,20 70,35 50,35" fill="#FF6B6B" stroke="#DC143C" strokeWidth="2"/>
      <path d="M15,60 Q50,70 85,60" fill="none" stroke="#87CEEB" strokeWidth="3" strokeDasharray="5,5"/>
    </svg>
  )
};

export const ObjectStickers = {
  book: (
    <svg viewBox="0 0 100 100" className="sticker">
      <rect x="20" y="15" width="60" height="70" rx="3" fill="#8B4513" stroke="#654321" strokeWidth="3"/>
      <rect x="25" y="20" width="50" height="60" rx="2" fill="#FFF"/>
      <line x1="30" y1="30" x2="70" y2="30" stroke="#333" strokeWidth="2"/>
      <line x1="30" y1="40" x2="70" y2="40" stroke="#333" strokeWidth="2"/>
      <line x1="30" y1="50" x2="70" y2="50" stroke="#333" strokeWidth="2"/>
      <line x1="30" y1="60" x2="70" y2="60" stroke="#333" strokeWidth="2"/>
    </svg>
  ),
  ball: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="50" r="40" fill="#FF6B6B" stroke="#DC143C" strokeWidth="3"/>
      <path d="M15,50 Q50,20 85,50" fill="none" stroke="#FFF" strokeWidth="3"/>
      <path d="M15,50 Q50,80 85,50" fill="none" stroke="#FFF" strokeWidth="3"/>
      <circle cx="50" cy="25" r="6" fill="#FFF" opacity="0.5"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 100 100" className="sticker">
      <polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" 
        fill="#FFD700" stroke="#FFA500" strokeWidth="4"/>
      <circle cx="40" cy="35" r="5" fill="#FFF" opacity="0.5"/>
    </svg>
  ),
  flower: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="50" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="3"/>
      <ellipse cx="50" cy="25" rx="10" ry="15" fill="#FF69B4" stroke="#FF1493" strokeWidth="2"/>
      <ellipse cx="50" cy="75" rx="10" ry="15" fill="#FF69B4" stroke="#FF1493" strokeWidth="2"/>
      <ellipse cx="25" cy="50" rx="15" ry="10" fill="#FF69B4" stroke="#FF1493" strokeWidth="2"/>
      <ellipse cx="75" cy="50" rx="15" ry="10" fill="#FF69B4" stroke="#FF1493" strokeWidth="2"/>
      <path d="M50,65 L50,90" stroke="#228B22" strokeWidth="4"/>
    </svg>
  ),
  house: (
    <svg viewBox="0 0 100 100" className="sticker">
      <polygon points="50,10 90,45 85,45 85,90 15,90 15,45 10,45" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="3"/>
      <rect x="35" y="60" width="30" height="30" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
      <circle cx="55" cy="75" r="3" fill="#FFD700"/>
      <rect x="60" y="30" width="15" height="15" fill="#87CEEB" stroke="#4682B4" strokeWidth="2"/>
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 100 100" className="sticker">
      <circle cx="50" cy="50" r="25" fill="#FFD700" stroke="#FFA500" strokeWidth="4"/>
      {[...Array(8)].map((_, i) => (
        <line key={i}
          x1={50 + 30 * Math.cos(i * Math.PI / 4)}
          y1={50 + 30 * Math.sin(i * Math.PI / 4)}
          x2={50 + 45 * Math.cos(i * Math.PI / 4)}
          y2={50 + 45 * Math.sin(i * Math.PI / 4)}
          stroke="#FFA500" strokeWidth="5" strokeLinecap="round"/>
      ))}
      <circle cx="42" cy="45" r="5" fill="#FFF" opacity="0.6"/>
    </svg>
  )
};

export const NumberStickers = {
  1: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
        fill="#FF6B6B" fontSize="40" fontWeight="bold" fontFamily="Comic Sans MS">1</text>
    </svg>
  ),
  2: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
        fill="#4ECDC4" fontSize="40" fontWeight="bold" fontFamily="Comic Sans MS">2</text>
    </svg>
  ),
  3: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
        fill="#FFD93D" fontSize="40" fontWeight="bold" fontFamily="Comic Sans MS">3</text>
    </svg>
  ),
  A: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
        fill="#C7CEEA" fontSize="40" fontWeight="bold" fontFamily="Comic Sans MS">A</text>
    </svg>
  ),
  B: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
        fill="#FFB6C1" fontSize="40" fontWeight="bold" fontFamily="Comic Sans MS">B</text>
    </svg>
  ),
  C: (
    <svg viewBox="0 0 60 60" className="pattern-sticker">
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
        fill="#95E1D3" fontSize="40" fontWeight="bold" fontFamily="Comic Sans MS">C</text>
    </svg>
  )
};

// Default sticker for unknown items
export const DefaultSticker = (
  <svg viewBox="0 0 100 100" className="sticker">
    <circle cx="50" cy="50" r="40" fill="#FFD93D" stroke="#FFA500" strokeWidth="3"/>
    <circle cx="35" cy="40" r="5" fill="#333"/>
    <circle cx="65" cy="40" r="5" fill="#333"/>
    <path d="M35,60 Q50,70 65,60" stroke="#333" strokeWidth="3" fill="none"/>
  </svg>
);

// Helper function to get sticker by key
export const getSticker = (category, key) => {
  const categories = {
    animals: AnimalStickers,
    fruits: FruitStickers,
    shapes: ShapeStickers,
    vehicles: VehicleStickers,
    objects: ObjectStickers,
    numbers: NumberStickers,
    patterns: PatternStickers
  };
  
  const sticker = categories[category]?.[key];
  return sticker || DefaultSticker;
};

export default {
  AnimalStickers,
  FruitStickers,
  ShapeStickers,
  VehicleStickers,
  ObjectStickers,
  NumberStickers,
  PatternStickers,
  DefaultSticker,
  getSticker
};
