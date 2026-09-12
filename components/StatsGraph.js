"use client";
import { useState, useEffect } from "react";

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "all", label: "All Time" },
];

export default function StatsGraph({ exerciseId, exerciseName }) {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [period, exerciseId]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stats/logs?exerciseId=${exerciseId}&period=${period}`);
      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  if (!data.length && !loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data available for {exerciseName} yet.</p>
        <p className="text-sm mt-2">Start logging to see your progress!</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxAmount = Math.max(...data.map((d) => d.totalAmount), 1);
  const chartHeight = 300;

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{exerciseName} Progress</h2>

      {/* Period Buttons */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              period === p.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Line Chart */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading chart...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <svg
            width="100%"
            height={chartHeight + 60}
            viewBox={`0 0 ${Math.max(600, data.length * 50)} ${chartHeight + 60}`}
            style={{ minHeight: "300px" }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((gridLine) => (
              <line
                key={`grid-${gridLine}`}
                x1="40"
                y1={40 + gridLine * chartHeight}
                x2={Math.max(600, data.length * 50) - 20}
                y2={40 + gridLine * chartHeight}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            ))}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((gridLine) => (
              <text
                key={`label-${gridLine}`}
                x="35"
                y={40 + gridLine * chartHeight + 5}
                fontSize="12"
                fill="#9ca3af"
                textAnchor="end"
              >
                {Math.round(gridLine * maxAmount)}
              </text>
            ))}

            {/* Line path */}
            {data.length > 0 && (
              <polyline
                points={data
                  .map((point, i) => {
                    const x = 40 + (i / (data.length - 1 || 1)) * (Math.max(600, data.length * 50) - 60);
                    const y = 40 + chartHeight - (point.totalAmount / maxAmount) * chartHeight;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            )}

            {/* Data points (circles) */}
            {data.map((point, i) => {
              const x = 40 + (i / (data.length - 1 || 1)) * (Math.max(600, data.length * 50) - 60);
              const y = 40 + chartHeight - (point.totalAmount / maxAmount) * chartHeight;
              return (
                <g key={`point-${i}`}>
                  <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                  <title>{`${point.date}: ${point.totalAmount}`}</title>
                </g>
              );
            })}

            {/* X-axis */}
            <line x1="40" y1={40 + chartHeight} x2={Math.max(600, data.length * 50) - 20} y2={40 + chartHeight} stroke="#000" strokeWidth="1" />

            {/* Y-axis */}
            <line x1="40" y1="20" x2="40" y2={40 + chartHeight} stroke="#000" strokeWidth="1" />

            {/* X-axis labels (sample) */}
            {data.length > 0 &&
              data
                .filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1)
                .map((point, i, arr) => {
                  const dataIndex = data.indexOf(point);
                  const x = 40 + (dataIndex / (data.length - 1 || 1)) * (Math.max(600, data.length * 50) - 60);
                  return (
                    <text
                      key={`x-label-${i}`}
                      x={x}
                      y={40 + chartHeight + 20}
                      fontSize="12"
                      fill="#9ca3af"
                      textAnchor="middle"
                    >
                      {formatDateLabel(point.date, period)}
                    </text>
                  );
                })}
          </svg>
        </div>
      )}

      {/* Stats Summary */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, d) => sum + d.totalAmount, 0)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Average per Log</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(data.reduce((sum, d) => sum + d.totalAmount, 0) / data.reduce((sum, d) => sum + d.logCount, 0))}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">Max</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.max(...data.map((d) => d.maxAmount))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateLabel(dateStr, period) {
  const date = new Date(dateStr);
  switch (period) {
    case "daily":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "weekly":
      return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    case "monthly":
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    case "yearly":
      return dateStr;
    case "all":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    default:
      return dateStr;
  }
}
