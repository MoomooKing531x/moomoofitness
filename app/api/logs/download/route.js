import { getUserIdFromCookies } from "../../../../lib/auth.js";
import { prisma } from "../../../../lib/db.js";

export async function GET() {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Not logged in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true },
    });

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const logs = await prisma.log.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { loggedAt: "desc" },
    });

    // Format logs as clean text
    let content = `Exercise Log Export\n`;
    content += `===================\n`;
    content += `User: ${user.username}${user.displayName ? ` (${user.displayName})` : ""}\n`;
    content += `Total Exercises: ${logs.length}\n`;
    content += `Export Date: ${new Date().toLocaleString()}\n\n`;
    content += `${"=".repeat(50)}\n\n`;

    if (logs.length === 0) {
      content += `No exercises logged yet.\n`;
    } else {
      // Group by date
      const logsByDate = {};
      logs.forEach((log) => {
        const dateKey = new Date(log.loggedAt).toLocaleDateString();
        if (!logsByDate[dateKey]) {
          logsByDate[dateKey] = [];
        }
        logsByDate[dateKey].push(log);
      });

      // Sort dates in descending order
      const sortedDates = Object.keys(logsByDate).sort((a, b) => 
        new Date(b) - new Date(a)
      );

      sortedDates.forEach((date) => {
        content += `${date}\n`;
        content += `${"-".repeat(date.length)}\n\n`;

        logsByDate[date].forEach((log) => {
          const time = new Date(log.loggedAt).toLocaleTimeString();
          const exerciseName = log.exercise.name;
          const amount = log.amount;
          const reps = log.reps ? `${log.reps} reps` : "";
          const sets = log.sets ? `${log.sets} sets` : "";
          const details = [reps, sets].filter(Boolean).join(", ");
          
          content += `  [${time}] ${exerciseName}`;
          if (amount) {
            content += ` - ${amount}`;
          }
          if (details) {
            content += ` (${details})`;
          }
          content += `\n`;
        });

        content += `\n`;
      });
    }

    content += `${"=".repeat(50)}\n`;
    content += `End of export\n`;

    // Return as downloadable text file
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="exercise-logs-${user.username}-${new Date().toISOString().split('T')[0]}.txt"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/logs/download:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
