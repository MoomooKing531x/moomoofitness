import { prisma } from "../../../lib/db.js";
import { getUserIdFromCookies } from "../../../lib/auth.js";
import { startOfUTCDay } from "../../../lib/dates.js";
import { generateSmartChallenge } from "../../../lib/challengeGenerator.js";

// GET /api/challenge â€” today's personalized challenge, generating one if needed.
export async function GET() {
  const userId = getUserIdFromCookies();
  const today = startOfUTCDay(new Date());

  if (!userId) {
    return Response.json({ challenge: null });
  }

  let challenge = await prisma.dailyChallenge.findUnique({
    where: { 
      userId_date: {
        userId,
        date: today
      }
    },
    include: { exercise: true },
  });

  if (!challenge) {
    // Generate smart personalized challenge
    const challengeData = await generateSmartChallenge(userId);

    if (!challengeData) {
      return Response.json({ challenge: null });
    }

    challenge = await prisma.dailyChallenge.create({
      data: { 
        userId,
        date: today, 
        exerciseId: challengeData.exercise.id, 
        targetAmount: challengeData.targetAmount,
        isTrySomethingNew: challengeData.isTrySomethingNew || false,
      },
      include: { exercise: true },
    });
  }

  const completion = await prisma.challengeCompletion.findUnique({
    where: { userId_challengeId: { userId, challengeId: challenge.id } },
  });

  const completed = !!completion;
  const userDifficulty = completion?.difficulty || null;

  return Response.json({
    challenge: {
      id: challenge.id,
      exerciseName: challenge.exercise.name,
      exerciseId: challenge.exercise.id,
      unit: challenge.exercise.unit,
      targetAmount: challenge.targetAmount,
      isTrySomethingNew: challenge.isTrySomethingNew,
    },
    completed,
    userDifficulty,
  });
}

