function startOfUTCDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a, b) {
  const ms = startOfUTCDay(b) - startOfUTCDay(a);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Returns the start-of-day cutoff for a given leaderboard window, or null for all-time.
function windowStart(window) {
  const now = new Date();
  const today = startOfUTCDay(now);

  switch (window) {
    case "today":
      return today;
    case "weekly": {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - 6); // trailing 7 days, inclusive of today
      return d;
    }
    case "monthly":
      return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    case "yearly":
      return new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    case "alltime":
    default:
      return null;
  }
}

export { startOfUTCDay, daysBetween, windowStart };

