import { prisma } from "./db";

// Analyze user's performance for each exercise
async function getUserPerformance(userId) {
  const logs = await prisma.log.findMany({
    where: { userId },
    include: { exercise: true },
    orderBy: { loggedAt: 'desc' },
    take: 100, // Analyze last 100 logs
  });

  const performanceByExercise = {};
  
  logs.forEach(log => {
    const exerciseId = log.exerciseId;
    if (!performanceByExercise[exerciseId]) {
      performanceByExercise[exerciseId] = {
        exercise: log.exercise,
        totalAmount: 0,
        count: 0,
        recentAmounts: [],
      };
    }
    
    performanceByExercise[exerciseId].totalAmount += log.amount;
    performanceByExercise[exerciseId].count += 1;
    performanceByExercise[exerciseId].recentAmounts.push(log.amount);
    
    // Keep only last 10 recent amounts for average calculation
    if (performanceByExercise[exerciseId].recentAmounts.length > 10) {
      performanceByExercise[exerciseId].recentAmounts.shift();
    }
  });

  // Calculate averages and typical ranges
  Object.keys(performanceByExercise).forEach(exerciseId => {
    const perf = performanceByExercise[exerciseId];
    perf.averageAmount = perf.totalAmount / perf.count;
    perf.recentAverage = perf.recentAmounts.reduce((a, b) => a + b, 0) / perf.recentAmounts.length;
    perf.typicalAmount = Math.round(perf.recentAverage * 0.8); // 80% of recent average as "typical"
  });

  return performanceByExercise;
}

// Generate a smart daily challenge for a user
async function generateSmartChallenge(userId) {
  const performance = await getUserPerformance(userId);
  const exerciseIds = Object.keys(performance);
  
  // If no performance data, return easy default challenge
  if (exerciseIds.length === 0) {
    const easyExercises = await prisma.exercise.findMany({
      where: { isOfficial: true, isPublic: true },
      take: 5,
    });
    
    if (easyExercises.length === 0) return null;
    
    const randomExercise = easyExercises[Math.floor(Math.random() * easyExercises.length)];
    const targetAmount = randomExercise.unit === "seconds" 
      ? 15 + Math.floor(Math.random() * 16) // 15-30 seconds
      : 5 + Math.floor(Math.random() * 11); // 5-15 reps
    
    return {
      exercise: randomExercise,
      targetAmount,
      isNewUser: true,
      isTrySomethingNew: false,
    };
  }

  // Decide whether to do a "Try something new" challenge (20% chance)
  const trySomethingNew = Math.random() < 0.2;
  
  if (trySomethingNew) {
    // Pick an exercise the user rarely or never does
    const allExercises = await prisma.exercise.findMany({
      where: { isOfficial: true, isPublic: true },
    });
    
    const rarelyDoneExercises = allExercises.filter(ex => 
      !performance[ex.id] || performance[ex.id].count < 3
    );
    
    if (rarelyDoneExercises.length > 0) {
      const randomExercise = rarelyDoneExercises[Math.floor(Math.random() * rarelyDoneExercises.length)];
      const targetAmount = randomExercise.unit === "seconds"
        ? 10 + Math.floor(Math.random() * 21) // 10-30 seconds for new exercises
        : 3 + Math.floor(Math.random() * 8); // 3-10 reps for new exercises
      
      return {
        exercise: randomExercise,
        targetAmount,
        isNewUser: false,
        isTrySomethingNew: true,
      };
    }
  }

  // Otherwise, pick from user's regular exercises
  // Weight towards exercises they do more frequently
  const weightedExercises = exerciseIds.map(id => ({
    id,
    weight: performance[id].count,
  }));
  
  // Simple weighted random selection
  const totalWeight = weightedExercises.reduce((sum, ex) => sum + ex.weight, 0);
  let randomWeight = Math.random() * totalWeight;
  let selectedExerciseId = weightedExercises[0].id;
  
  for (const ex of weightedExercises) {
    randomWeight -= ex.weight;
    if (randomWeight <= 0) {
      selectedExerciseId = ex.id;
      break;
    }
  }
  
  const selectedPerf = performance[selectedExerciseId];
  const exercise = selectedPerf.exercise;
  
  // Generate target amount based on their typical performance
  // Add some variation: 70-130% of their typical amount
  const variation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
  const targetAmount = Math.max(1, Math.round(selectedPerf.typicalAmount * variation));
  
  return {
    exercise,
    targetAmount,
    isNewUser: false,
    isTrySomethingNew: false,
  };
}

export {
  getUserPerformance,
  generateSmartChallenge,
};

