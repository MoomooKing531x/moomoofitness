import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// GET /api/stats/logs?exerciseId=&period=daily|weekly|monthly|yearly|all
export async function GET(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("exerciseId");
  const period = searchParams.get("period") || "all"; // daily, weekly, monthly, yearly, all

  if (!exerciseId) {
    return Response.json({ error: "exerciseId required" }, { status: 400 });
  }

  // Fetch logs for the user and exercise
  const logs = await prisma.log.findMany({
    where: {
      userId,
      exerciseId,
    },
    select: {
      loggedAt: true,
      date: true,
      amount: true,
      reps: true,
      sets: true,
    },
    orderBy: { loggedAt: "asc" },
  });

  if (!logs.length) {
    return Response.json({ data: [] });
  }

  // Group logs by time period
  const grouped = groupByPeriod(logs, period);

  return Response.json({ data: grouped, period });
}

function groupByPeriod(logs, period) {
  const grouped = {};

  logs.forEach((log) => {
    const date = new Date(log.loggedAt);
    let key;

    switch (period) {
      case "daily":
        key = date.toISOString().split("T")[0]; // YYYY-MM-DD
        break;
      case "weekly":
        // ISO week number
        const weekStart = getWeekStart(date);
        key = weekStart.toISOString().split("T")[0];
        break;
      case "monthly":
        key = date.toISOString().slice(0, 7); // YYYY-MM
        break;
      case "yearly":
        key = date.getFullYear().toString();
        break;
      case "all":
      default:
        key = date.toISOString().split("T")[0];
        break;
    }

    if (!grouped[key]) {
      grouped[key] = { date: key, totalAmount: 0, maxAmount: 0, logCount: 0 };
    }
    grouped[key].totalAmount += log.amount;
    grouped[key].maxAmount = Math.max(grouped[key].maxAmount, log.amount);
    grouped[key].logCount += 1;
  });

  // Convert to array and sort by date
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}
