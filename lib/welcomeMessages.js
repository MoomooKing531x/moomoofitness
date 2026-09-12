const welcomeMessages = [
  "Ready to crush some workouts today?",
  "Time to level up your fitness game!",
  "Let's make today count!",
  "Your future self will thank you!",
  "Every rep brings you closer to your goals!",
  "Show today who's boss!",
  "Let's get those gains!",
  "No pain, no gains!",
  "You got this! Believe in yourself!",
  "Time to break some personal records!",
  "Make every workout matter!",
  "Your body is a temple, work on it!",
  "Sweat is just liquid determination!",
  "Stronger every day!",
  "Push yourself today!",
  "Be the best version of yourself!",
  "One workout closer to your dreams!",
  "You're stronger than your excuses!",
  "Transform today!",
  "Let's go, champion!",
];

export function getRandomWelcomeMessage() {
  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
}
