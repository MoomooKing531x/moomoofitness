"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const WINDOWS = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "alltime", label: "All-Time" },
];

export default function LeaderboardBoard({ exerciseId, currentUsername }) {
  const [windowKey, setWindowKey] = useState("alltime");
  const [scope, setScope] = useState("everyone");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let first = true;
    const params = new URLSearchParams({ window: windowKey, scope, search });

    function load() {
      if (first) setLoading(true);
      fetch(`/api/leaderboard/${exerciseId}?${params.toString()}`)
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) {
            setData(json);
            setLoading(false);
            first = false;
          }
        });
    }

    load();
    const interval = setInterval(load, 8000); // near-real-time refresh
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [exerciseId, windowKey, scope, search]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {["everyone", "friends"].map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-3 py-1.5 rounded-md border text-sm capitalize ${
              scope === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => setWindowKey(w.key)}
            className={`px-3 py-1.5 rounded-md border text-sm ${
              windowKey === w.key ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <input
        className="border border-gray-300 rounded-md px-3 py-2 w-full mb-4 text-sm"
        placeholder="Search a username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && data && !data.error && (
        <div className="border border-gray-200 rounded-md divide-y">
          {data.top10.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No one has logged this yet. Be the first!</p>
          )}
          {data.top10.map((row) => (
            <Row key={row.userId} row={row} isYou={row.username === currentUsername} unit={data.exercise.unit} />
          ))}

          {data.you && data.you.rank > 10 && (
            <Row row={{ ...data.you, prefix: "YOU " }} isYou unit={data.exercise.unit} highlight />
          )}

          {search &&
            data.searched &&
            data.searched.rank > 10 &&
            (!data.you || data.you.userId !== data.searched.userId) && (
              <Row row={data.searched} unit={data.exercise.unit} highlight />
            )}

          {search && !data.searched && (
            <p className="p-3 text-xs text-gray-400">
              No result for "{search}" in this view.
            </p>
          )}
        </div>
      )}

      {!loading && data && data.error && (
        <p className="text-sm text-red-600 mt-2">{data.error}</p>
      )}
    </div>
  );
}

function Row({ row, isYou, unit, highlight, }) {
  return (
    <div className={`flex justify-between px-4 py-3 text-sm ${isYou || highlight ? "bg-gray-50 font-medium" : ""}`}>
      <span>
        {row.prefix || ""}#{row.rank}{" "}
        <Link href={`/profile/${row.username}`} className="hover:underline">
          {row.username}
        </Link>
      </span>
      <span>
        {row.total || row.totalCoins} {unit}
      </span>
    </div>
  );
}
