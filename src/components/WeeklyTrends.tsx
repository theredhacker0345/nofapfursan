"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface WeeklyTrendsProps {
  data: WeeklyNutritionData;
}

export interface WeeklyNutritionData {
  days: string[];
  calories: number[];
  protein: number[];
  carbs: number[];
  fat: number[];
  sodium: number[];
  potassium: number[];
  iron: number[];
  calcium: number[];
}

const WeeklyTrends: React.FC<WeeklyTrendsProps> = ({ data }) => {
  const [activeLines, setActiveLines] = useState<Set<string>>(new Set(['calories', 'protein', 'carbs', 'fat']));

  const chartData = useMemo(() => {
    return data.days.map((day, index) => ({
      day,
      calories: data.calories[index] || 0,
      protein: data.protein[index] || 0,
      carbs: data.carbs[index] || 0,
      fat: data.fat[index] || 0,
      sodium: data.sodium[index] || 0,
      potassium: data.potassium[index] || 0,
      iron: data.iron[index] || 0,
      calcium: data.calcium[index] || 0,
    }));
  }, [data]);

  const toggleLine = (line: string) => {
    const newActive = new Set(activeLines);
    if (newActive.has(line)) {
      newActive.delete(line);
    } else {
      newActive.add(line);
    }
    setActiveLines(newActive);
  };

  const getDailyInsight = (dayIndex: number) => {
    const day = data.days[dayIndex];
    const cal = data.calories[dayIndex] || 0;
    const protein = data.protein[dayIndex] || 0;
    const carbs = data.carbs[dayIndex] || 0;
    const fat = data.fat[dayIndex] || 0;

    const getInsight = () => {
      if (cal < 1500) return `Low calories on ${day} — consider adding nutrient-dense foods`;
      if (cal > 3000) return `High calories on ${day} — watch portions`;
      if (protein < 50) return `Low protein on ${day} — add lean meats or beans`;
      if (carbs < 100) return `Low carbs on ${day} — include whole grains`;
      if (fat < 30) return `Low fat on ${day} — add healthy fats like nuts`;
      return `Good nutrition balance on ${day}`;
    };

    return getInsight();
  };

  const getColor = (line: string) => {
    const colors: Record<string, string> = {
      calories: "#ef4444",
      protein: "#3b82f6",
      carbs: "#10b981",
      fat: "#f59e0b",
      sodium: "#8b5cf6",
      potassium: "#06b6d4",
      iron: "#84cc16",
      calcium: "#fbbf24",
    };
    return colors[line] || "#6b7280";
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color?: string; name?: string; value?: string | number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-surface p-3 shadow-lg">
          <p className="text-body font-medium text-ink mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-meta" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name?.includes('calories') ? ' kcal' : ' g'}
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-ink-muted">
              {getDailyInsight(data.days.findIndex(d => d === label))}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartMetrics = [
    { key: 'calories', name: 'Calories', unit: 'kcal' },
    { key: 'protein', name: 'Protein', unit: 'g' },
    { key: 'carbs', name: 'Carbs', unit: 'g' },
    { key: 'fat', name: 'Fat', unit: 'g' },
  ];

  const micronutrientMetrics = [
    { key: 'sodium', name: 'Sodium', unit: 'mg' },
    { key: 'potassium', name: 'Potassium', unit: 'mg' },
    { key: 'iron', name: 'Iron', unit: 'mg' },
    { key: 'calcium', name: 'Calcium', unit: 'mg' },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center">
        <h3 className="text-section font-semibold text-ink">7-Day Nutrition Trends</h3>
        <p className="text-body text-ink-muted">Track your nutrition patterns over time</p>
      </div>

      {/* Macros Chart */}
      <div className="surface-group p-6 rounded-lg">
        <h4 className="text-label uppercase text-ink-faint font-medium mb-4">Macronutrient Trends</h4>

        <div className="mb-4 flex flex-wrap gap-2">
          {chartMetrics.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => toggleLine(metric.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-label font-medium transition-all",
                activeLines.has(metric.key)
                  ? "text-bg shadow-md"
                  : "bg-surface-2 text-ink-muted hover:bg-surface-3",
              )}
              style={{ backgroundColor: activeLines.has(metric.key) ? getColor(metric.key) : undefined }}
            >
              {metric.name}
            </button>
          ))}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--ink-muted))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--ink-muted))" fontSize={12} orientation="left" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {chartMetrics.map((metric) => (
                activeLines.has(metric.key) && (
                  <Line
                    key={metric.key}
                    yAxisId="left"
                    type="monotone"
                    dataKey={metric.key}
                    stroke={getColor(metric.key)}
                    strokeWidth={2}
                    dot={{ fill: getColor(metric.key), strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Micronutrients Chart */}
      <div className="surface-group p-6 rounded-lg">
        <h4 className="text-label uppercase text-ink-faint font-medium mb-4">Micronutrient Trends</h4>

        <div className="mb-4 flex flex-wrap gap-2">
          {micronutrientMetrics.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => toggleLine(metric.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-label font-medium transition-all",
                activeLines.has(metric.key)
                  ? "text-bg shadow-md"
                  : "bg-surface-2 text-ink-muted hover:bg-surface-3",
              )}
              style={{ backgroundColor: activeLines.has(metric.key) ? getColor(metric.key) : undefined }}
            >
              {metric.name}
            </button>
          ))}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--ink-muted))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--ink-muted))" fontSize={12} orientation="left" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {micronutrientMetrics.map((metric) => (
                activeLines.has(metric.key) && (
                  <Line
                    key={metric.key}
                    yAxisId="left"
                    type="monotone"
                    dataKey={metric.key}
                    stroke={getColor(metric.key)}
                    strokeWidth={2}
                    dot={{ fill: getColor(metric.key), strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Summary */}
      {(() => {
        const avgCalories =
          chartData.length > 0
            ? Math.round(
                chartData.reduce((sum, day) => sum + day.calories, 0) /
                  chartData.length,
              )
            : 0;
        const bestDay =
          chartData.length > 0
            ? chartData.find(
                (day) =>
                  day.calories ===
                  Math.max(...chartData.map((d) => d.calories)),
              )?.day ?? "-"
            : "-";
        const lowestDay =
          chartData.length > 0
            ? chartData.find(
                (day) =>
                  day.calories ===
                  Math.min(...chartData.map((d) => d.calories)),
              )?.day ?? "-"
            : "-";

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              className="surface-group p-4 rounded-lg text-center"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-label uppercase text-ink-faint">Avg Calories</p>
              <p className="font-data text-display-lg font-semibold text-ink">
                {avgCalories}
              </p>
              <p className="text-meta text-ink-muted">per day</p>
            </motion.div>

            <motion.div
              className="surface-group p-4 rounded-lg text-center"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-label uppercase text-ink-faint">Best Day</p>
              <p className="font-data text-display-lg font-semibold text-ink">
                {bestDay}
              </p>
              <p className="text-meta text-ink-muted">most calories</p>
            </motion.div>

            <motion.div
              className="surface-group p-4 rounded-lg text-center"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-label uppercase text-ink-faint">Lowest Day</p>
              <p className="font-data text-display-lg font-semibold text-ink">
                {lowestDay}
              </p>
              <p className="text-meta text-ink-muted">least calories</p>
            </motion.div>
          </div>
        );
      })()}
    </motion.div>
  );
};

export default WeeklyTrends;
