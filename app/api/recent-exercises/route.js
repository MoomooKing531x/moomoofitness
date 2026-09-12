import { prisma } from "../../../lib/db.js";
import { getUserIdFromCookies } from "../../../lib/auth.js";

export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });

  // Get logs from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await prisma.log.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    include: {
      exercise: true,
    },
    orderBy: { date: "desc" },
  });

  // Analyze patterns: group by exercise and amount
  const patterns = new Map();

  logs.forEach((log) => {
    const exerciseId = log.exerciseId || `custom-${log.customName}`;
    const exerciseName = log.exercise?.name || log.customName;
    const amount = log.amount;
    const unit = log.exercise?.unit || "reps";

    const key = `${exerciseId}-${amount}-${unit}`;

    if (!patterns.has(key)) {
      patterns.set(key, {
        exerciseId,
        exerciseName,
        amount,
        unit,
        count: 0,
        dates: [],
      });
    }

    const pattern = patterns.get(key);
    pattern.count++;
    pattern.dates.push(log.date);
  });

  // Filter patterns that appear at least 3 times in the last 30 days
  // This ensures consistency (not just one random log)
  const consistentPatterns = Array.from(patterns.values())
    .filter((p) => p.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return Response.json({ patterns: consistentPatterns });
}
