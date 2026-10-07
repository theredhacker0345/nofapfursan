"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MicroHeatmapProps {
  data: WeeklyMicroNutrientData;
}

export interface WeeklyMicroNutrientData {
  days: string[];
  sodium: number[];
  potassium: number[];
  iron: number[];
  calcium: number[];
  vitaminC: number[];
  vitaminD: number[];
  vitaminB12: number[];
}

const MICRONUTRIENT_CONFIG = {
  sodium: { color: "var(--accent)", name: "Sodium", unit: "mg", max: 2300 },
  potassium: { color: "var(--success)", name: "Potassium", unit: "mg", max: 4700 },
  iron: { color: "var(--warning)", name: "Iron", unit: "mg", max: 18 },
  calcium: { color: "var(--danger)", name: "Calcium", unit: "mg", max: 1300 },
  vitaminC: { color: "var(--accent)", name: "Vitamin C", unit: "mg", max: 90 },
  vitaminD: { color: "var(--warning)", name: "Vitamin D", unit: "μg", max: 600 },
  vitaminB12: { color: "var(--success)", name: "Vitamin B12", unit: "μg", max: 2.4 },
} as const;

type MicroKey = keyof typeof MICRONUTRIENT_CONFIG;

const MicroHeatmap: React.FC<MicroHeatmapProps> = ({ data }) => {
  const getDayLabel = (dayIndex: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayIndex] || data.days[dayIndex];
  };

  const getColorIntensity = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.8) return 0.7;
    if (ratio >= 0.5) return 0.4;
    if (ratio >= 0.2) return 0.15;
    return 0.05;
  };

  const getInsight = (key: string, value: number, index: number) => {
    const config = MICRONUTRIENT_CONFIG[key as MicroKey];
    const day = data.days[index];

    if (value < 50) return `Very low ${key} — add variety of foods`;
    if (value < 100) return `${key} low on ${day}`;
    if (value > config.max * 1.5) return `High ${key} on ${day} — monitor intake`;
    if (value > config.max * 0.8) return `Good ${key} on ${day}`;
    return `Adequate ${key} on ${day}`;
  };

  const getFoodRecommendation = (nutrient: string) => {
    const recommendations: Record<string, string> = {
      sodium: "bananas, potatoes, spinach",
      potassium: "bananas, oranges, avocados",
      iron: "red meat, beans, leafy greens",
      calcium: "dairy, leafy greens, fortified foods",
      vitaminC: "citrus fruits, berries, bell peppers",
      vitaminD: "fatty fish, fortified milk, sunlight",
      vitaminB12: "meat, fish, dairy, fortified cereals",
    };
    return recommendations[nutrient] || "variety of foods";
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center">
        <h3 className="text-section font-semibold text-ink">Weekly Micronutrient Intake</h3>
        <p className="text-body text-ink-muted">7-day color-coded visualization</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="text-label uppercase text-ink-faint font-medium">Day</div>
            {(Object.keys(MICRONUTRIENT_CONFIG) as MicroKey[]).map((nutrient) => {
              const config = MICRONUTRIENT_CONFIG[nutrient];
              return (
                <div key={nutrient} className="text-center">
                  <div className="text-label uppercase text-ink-muted font-medium">
                    {config.name}
                  </div>
                  <div className="text-meta text-ink-faint">{config.unit}</div>
                </div>
              );
            })}
          </div>

          {/* Data rows */}
          <div className="space-y-1">
            {data.days.map((_, dayIndex) => (
              <motion.div
                key={dayIndex}
                className="grid grid-cols-8 gap-2 items-center py-2 border-b border-border hover:bg-surface-2 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dayIndex * 0.05 }}
              >
                <div className="text-label font-medium text-ink">
                  {getDayLabel(dayIndex)}
                </div>

                {(Object.keys(MICRONUTRIENT_CONFIG) as MicroKey[]).map((key) => {
                  const config = MICRONUTRIENT_CONFIG[key];
                  const micronutrientKey = key as keyof typeof data;
                  const rawValue = data[micronutrientKey];
                  const value = Array.isArray(rawValue)
                    ? Number(rawValue[dayIndex]) || 0
                    : 0;
                  const intensity = getColorIntensity(value, config.max);

                  return (
                    <motion.div
                      key={key}
                      className={cn(
                        "h-12 rounded-lg border flex items-center justify-center",
                        "text-meta font-medium cursor-help transition-all",
                      )}
                      style={{
                        backgroundColor: `color-mix(in srgb, ${config.color} ${intensity * 100}%, transparent)`,
                        borderColor: config.color,
                      }}
                      title={getInsight(key, value, dayIndex)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {value > 0 ? value.toFixed(1) : "—"}
                    </motion.div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend and insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="surface-group p-4 rounded-lg">
          <h4 className="text-label uppercase text-ink-faint font-medium mb-3">Color Scale</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-meta">
              <div className="h-4 w-4 rounded bg-accent/50" />
              <span>High intake (&gt;80% goal)</span>
            </div>
            <div className="flex items-center gap-2 text-meta">
              <div className="h-4 w-4 rounded bg-accent/25" />
              <span>Moderate intake (50-80%)</span>
            </div>
            <div className="flex items-center gap-2 text-meta">
              <div className="h-4 w-4 rounded bg-accent/10" />
              <span>Low intake (20-50%)</span>
            </div>
            <div className="flex items-center gap-2 text-meta">
              <div className="h-4 w-4 rounded bg-accent/5" />
              <span>Very low intake (&lt;20%)</span>
            </div>
          </div>
        </div>

        <div className="surface-group p-4 rounded-lg">
          <h4 className="text-label uppercase text-ink-faint font-medium mb-3">Daily Tips</h4>
          <div className="space-y-2 text-meta text-ink-muted">
            <div>🥦 Potassium: Add bananas, spinach, avocados</div>
            <div>🥩 Iron: Include red meat, beans, leafy greens</div>
            <div>🧀 Calcium: Dairy, leafy greens, fortified foods</div>
            <div>🍊 Vitamin C: Citrus, berries, bell peppers</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MicroHeatmap;
