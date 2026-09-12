// SVG icons for each workout exercise
export const WorkoutIcons = {
  // Upper Body
  "push-ups": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="15" r="8" fill="currentColor" />
      <line x1="50" y1="23" x2="50" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="30" x2="30" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="30" x2="70" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="50" x2="30" y2="85" stroke="currentColor" strokeWidth="2" />
      <line x1="70" y1="50" x2="70" y2="85" stroke="currentColor" strokeWidth="2" />
      <line x1="20" y1="85" x2="80" y2="85" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "pull-ups": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="20" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="3" />
      <line x1="30" y1="15" x2="30" y2="30" stroke="currentColor" strokeWidth="2" />
      <line x1="70" y1="15" x2="70" y2="30" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="20" r="6" fill="currentColor" />
      <line x1="50" y1="26" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="35" x2="35" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="35" x2="65" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="35" y1="50" x2="35" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="50" x2="65" y2="80" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "dips": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="30" y1="20" x2="30" y2="70" stroke="currentColor" strokeWidth="3" />
      <line x1="70" y1="20" x2="70" y2="70" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="20" r="6" fill="currentColor" />
      <line x1="50" y1="26" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="40" x2="30" y2="60" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="40" x2="70" y2="60" stroke="currentColor" strokeWidth="2" />
      <path d="M 30 70 Q 30 80 50 85 Q 70 80 70 70" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),

  "chin-ups": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="20" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="3" />
      <line x1="35" y1="15" x2="35" y2="28" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="15" x2="65" y2="28" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="22" r="5" fill="currentColor" />
      <line x1="50" y1="27" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="38" x2="35" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="38" x2="65" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="35" y1="55" x2="35" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="55" x2="65" y2="80" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "muscle-ups": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="20" y1="10" x2="80" y2="10" stroke="currentColor" strokeWidth="3" />
      <line x1="30" y1="10" x2="30" y2="25" stroke="currentColor" strokeWidth="2" />
      <line x1="70" y1="10" x2="70" y2="25" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="18" r="6" fill="currentColor" />
      <path d="M 50 24 Q 35 35 35 50 Q 35 60 50 70 Q 65 60 65 50 Q 65 35 50 24" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="35" y1="70" x2="35" y2="85" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="70" x2="65" y2="85" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "handstand push-ups": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="15" r="7" fill="currentColor" />
      <line x1="50" y1="22" x2="50" y2="40" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="35" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="65" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="35" y1="45" x2="25" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="45" x2="75" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="20" y1="85" x2="80" y2="85" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  // Lower Body
  "squats": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="15" r="7" fill="currentColor" />
      <line x1="50" y1="22" x2="50" y2="38" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="35" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="65" y2="45" stroke="currentColor" strokeWidth="2" />
      <path d="M 35 45 L 30 75 L 35 80" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M 65 45 L 70 75 L 65 80" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="25" y1="80" x2="75" y2="80" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "jump squats": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="12" r="6" fill="currentColor" />
      <line x1="50" y1="18" x2="50" y2="32" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="24" x2="32" y2="42" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="24" x2="68" y2="42" stroke="currentColor" strokeWidth="2" />
      <path d="M 32 42 L 28 70 L 32 75" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M 68 42 L 72 70 L 68 75" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="20" y1="75" x2="80" y2="75" stroke="currentColor" strokeWidth="2" />
      <polyline points="50,5 55,10 45,10" fill="currentColor" />
    </svg>
  ),

  "pistol squats": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="15" r="6" fill="currentColor" />
      <line x1="50" y1="21" x2="50" y2="38" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="60" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="35" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="45" x2="65" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="35" y1="55" x2="30" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="25" y1="80" x2="70" y2="80" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  // Core & Isometric
  "sit-ups": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="20" y1="80" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="60" r="6" fill="currentColor" />
      <line x1="40" y1="66" x2="40" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="40" y1="72" x2="30" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="40" y1="72" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="30" x2="60" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="35" x2="70" y2="35" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="25" r="5" fill="currentColor" />
    </svg>
  ),

  "hanging leg raises": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="20" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="3" />
      <line x1="35" y1="15" x2="35" y2="30" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="15" x2="65" y2="30" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="23" r="5" fill="currentColor" />
      <line x1="50" y1="28" x2="50" y2="55" stroke="currentColor" strokeWidth="2" />
      <path d="M 50 55 L 40 75 L 60 75" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),

  "toes-to-bar": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="20" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="3" />
      <line x1="30" y1="15" x2="30" y2="35" stroke="currentColor" strokeWidth="2" />
      <line x1="70" y1="15" x2="70" y2="35" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="25" r="5" fill="currentColor" />
      <line x1="50" y1="30" x2="50" y2="60" stroke="currentColor" strokeWidth="2" />
      <path d="M 50 60 L 40 75 L 60 75" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M 40 75 L 38 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3" />
    </svg>
  ),

  "plank": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="20" r="6" fill="currentColor" />
      <line x1="50" y1="26" x2="50" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="32" x2="30" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="32" x2="70" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="55" x2="25" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="70" y1="55" x2="75" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="20" y1="80" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "dead hang": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="20" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="3" />
      <line x1="35" y1="15" x2="35" y2="28" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="15" x2="65" y2="28" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="20" r="5" fill="currentColor" />
      <line x1="50" y1="25" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="35" y1="28" x2="35" y2="75" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="28" x2="65" y2="75" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "wall sit": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="80" y1="20" x2="80" y2="85" stroke="currentColor" strokeWidth="3" />
      <circle cx="65" cy="25" r="6" fill="currentColor" />
      <line x1="65" y1="31" x2="65" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="40" x2="80" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="40" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="80" y1="55" x2="80" y2="85" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="50" x2="50" y2="85" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "hollow body hold": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="20" r="6" fill="currentColor" />
      <path d="M 50 26 Q 40 40 40 60 Q 40 75 50 80 Q 60 75 60 60 Q 60 40 50 26" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="40" y1="50" x2="30" y2="55" stroke="currentColor" strokeWidth="1.5" />
      <line x1="60" y1="50" x2="70" y2="55" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),

  "handstand hold": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="15" r="6" fill="currentColor" />
      <line x1="50" y1="21" x2="50" y2="40" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="35" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="28" x2="65" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="35" y1="45" x2="25" y2="75" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="45" x2="75" y2="75" stroke="currentColor" strokeWidth="2" />
      <line x1="20" y1="80" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="28" r="8" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2" />
    </svg>
  ),

  "l-sit": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <line x1="30" y1="20" x2="30" y2="75" stroke="currentColor" strokeWidth="3" />
      <line x1="70" y1="20" x2="70" y2="75" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="15" r="5" fill="currentColor" />
      <line x1="50" y1="20" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
      <path d="M 50 50 L 40 65 L 60 65" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="30" y1="75" x2="70" y2="75" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),

  "running": (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="60" cy="15" r="6" fill="currentColor" />
      <line x1="60" y1="21" x2="60" y2="40" stroke="currentColor" strokeWidth="2" />
      <path d="M 60 30 L 75 35" stroke="currentColor" strokeWidth="2" />
      <path d="M 60 30 L 45 40" stroke="currentColor" strokeWidth="2" />
      <path d="M 75 35 L 80 80" stroke="currentColor" strokeWidth="2" />
      <path d="M 45 40 L 35 75" stroke="currentColor" strokeWidth="2" />
      <polyline points="35,75 30,85 45,85" stroke="currentColor" strokeWidth="2" fill="none" />
      <polyline points="80,80 85,85 70,85" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
};

export function getWorkoutIcon(exerciseName) {
  const normalized = exerciseName.toLowerCase();
  return WorkoutIcons[normalized] || null;
}
