// pages/metrics.tsx
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { FaClock, FaFire } from "react-icons/fa";
import { AiOutlineBarChart } from "react-icons/ai";

export default function MetricsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/openai/metrics")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 animate-pulse">
        Loading metrics...
      </div>
    );

  // Format the dates for better readability in the chart
  const chartData = data.promptsPerDay.map((entry) => ({
    ...entry,
    date: new Date(entry.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }), // e.g., "Apr 18"
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 my-auto">
      <h1 className="text-3xl font-bold text-gray-800">📊 AI Usage Metrics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-100 to-white p-5 rounded-2xl shadow">
          <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
            <AiOutlineBarChart />
            Total Prompts
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {data.totalPrompts}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-white p-5 rounded-2xl shadow">
          <div className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
            <FaClock />
            Avg. Latency
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(data.avgLatency)} ms
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-100 to-white p-5 rounded-2xl shadow">
          <div className="flex items-center gap-2 text-orange-700 font-semibold mb-2">
            <FaFire />
            Most Popular Prompt
          </div>
          <p className="text-md font-medium truncate text-gray-800">
            {data.topPrompts[0]?.prompt || "N/A"}
          </p>
        </div>
      </div>

      {/* Chart: Prompts Per Day */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Prompts Per Day (Last 7 Days)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value) => [`${value} prompts`, "Count"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Prompts */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">
          Top 5 Prompt Texts
        </h2>
        <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
          {data.topPrompts.map((item, idx) => (
            <li key={idx} className="truncate">
              <span className="font-medium">{item.prompt}</span>{" "}
              <span className="text-gray-500">({item.count})</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Slowest Latency Prompts */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">
          Top 5 Slowest Prompts (Latency)
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {data.slowestPrompts.map((item, idx) => (
            <li key={idx} className="flex justify-between items-center gap-4">
              <span className="truncate max-w-md">{item.prompt}</span>
              <span className="text-gray-600">{item.latencyMs} ms</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
