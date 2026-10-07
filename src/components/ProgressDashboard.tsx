"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MacroRing from "./MacroRing";
import MicroHeatmap, { WeeklyMicroNutrientData } from "./MicroHeatmap";
import WeeklyTrends, { WeeklyNutritionData } from "./WeeklyTrends";

interface ProgressDashboardProps {
  nutritionData: DailyNutritionData;
  weeklyData: WeeklyNutritionData;
  microData: WeeklyMicroNutrientData;
  streak: number;
}

export interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium: number;
  iron: number;
  calcium: number;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  nutritionData,
  weeklyData,
  microData,
  streak,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  const macros = useMemo(
    () => [
      {
        label: "Calories",
        current: nutritionData.calories,
        goal: 2200,
        unit: "kcal",
        color:
          nutritionData.calories < 1800
            ? "red"
            : nutritionData.calories < 2000
              ? "yellow"
              : "green",
      },
      {
        label: "Protein",
        current: nutritionData.protein,
        goal: 160,
        unit: "g",
        color:
          nutritionData.protein < 100
            ? "red"
            : nutritionData.protein < 130
              ? "yellow"
              : "green",
      },
      {
        label: "Carbs",
        current: nutritionData.carbs,
        goal: 250,
        unit: "g",
        color:
          nutritionData.carbs < 150
            ? "red"
            : nutritionData.carbs < 200
              ? "yellow"
              : "green",
      },
      {
        label: "Fat",
        current: nutritionData.fat,
        goal: 70,
        unit: "g",
        color:
          nutritionData.fat < 40
            ? "red"
            : nutritionData.fat < 55
              ? "yellow"
              : "green",
      },
    ],
    [nutritionData],
  );

  const getStreakInfo = () => {
    if (streak === 0)
      return { label: "Start your streak", color: "text-ink-muted" };
    if (streak < 7)
      return {
        label: `${streak} days — Building consistency`,
        color: "text-warning",
      };
    if (streak < 30)
      return {
        label: `${streak} days — Great momentum`,
        color: "text-success",
      };
    if (streak < 90)
      return {
        label: `${streak} days — Excellent streak`,
        color: "text-accent",
      };
    return {
      label: `${streak} days — Legendary!`,
      color: "text-success",
    };
  };

  const getQuickInsights = () => {
    const insights: string[] = [];

    if (nutritionData.calories < 1500)
      insights.push("Low calories — consider adding more food");
    if (nutritionData.protein < 80)
      insights.push("Low protein — add lean meats or beans");
    if (nutritionData.potassium < 2000)
      insights.push("Low potassium — add bananas, potatoes, spinach");
    if (nutritionData.iron < 8)
      insights.push("Low iron — include red meat, beans, leafy greens");
    if (nutritionData.calcium < 800)
      insights.push("Low calcium — dairy, leafy greens, fortified foods");

    if (insights.length === 0) {
      insights.push("Great job! You're meeting most nutritional goals");
      if (streak >= 7)
        insights.push("Excellent consistency — keep the streak going!");
    }

    return insights.slice(0, 3);
  };

  const getNutritionGrade = () => {
    const score = macros.reduce((sum, macro) => {
      const ratio = macro.current / macro.goal;
      return (
        sum +
        (ratio >= 0.9 ? 10 : ratio >= 0.7 ? 7.5 : ratio >= 0.5 ? 5 : 2.5)
      );
    }, 0);

    if (score >= 85)
      return {
        grade: "A",
        color: "text-success",
        bg: "bg-surface-2",
        border: "border-success",
      };
    if (score >= 70)
      return {
        grade: "B",
        color: "text-success",
        bg: "bg-surface-2",
        border: "border-success",
      };
    if (score >= 55)
      return {
        grade: "C",
        color: "text-warning",
        bg: "bg-surface-2",
        border: "border-warning",
      };
    return {
      grade: "D",
      color: "text-danger",
      bg: "bg-surface-2",
      border: "border-danger",
    };
  };

  const nutritionGrade = getNutritionGrade();
  const streakInfo = getStreakInfo();
  const quickInsights = getQuickInsights();

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with streak and grade */}
      <div className="surface-group p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-display font-semibold text-ink">
              Nutrition Dashboard
            </h2>
            <p className="text-body text-ink-muted mt-1">
              {new Date(nutritionData.date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Streak Indicator */}
            <motion.div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                "border border-border bg-surface-2",
              )}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-2xl" aria-hidden="true">
                🔥
              </span>
              <div>
                <p className="text-label uppercase text-ink-faint">Streak</p>
                <p className={cn("font-semibold", streakInfo.color)}>
                  {streakInfo.label}
                </p>
              </div>
            </motion.div>

            {/* Nutrition Grade */}
            <motion.div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border-2",
                nutritionGrade.bg,
                nutritionGrade.border,
              )}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-2xl" aria-hidden="true">
                {nutritionGrade.grade}
              </span>
              <div>
                <p className="text-label uppercase text-ink-faint">
                  Nutrition Grade
                </p>
                <p className={cn("font-semibold", nutritionGrade.color)}>
                  Grade {nutritionGrade.grade}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      {quickInsights.length > 0 && (
        <div className="surface-group p-5 rounded-lg">
          <h3 className="text-label uppercase text-ink-faint font-medium mb-4">
            Quick Insights & Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickInsights.map((insight, index) => (
              <motion.div
                key={index}
                className={cn(
                  "p-4 rounded-lg border bg-surface-2",
                  "transition-colors",
                )}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <p className="text-body text-ink">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="surface-group p-1.5 rounded-lg inline-flex gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-5 py-2.5 rounded-md text-label uppercase font-medium transition-all",
            activeTab === "overview"
              ? "bg-ink text-bg shadow-sm"
              : "text-ink-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={cn(
            "px-5 py-2.5 rounded-md text-label uppercase font-medium transition-all",
            activeTab === "details"
              ? "bg-ink text-bg shadow-sm"
              : "text-ink-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          Detailed Analysis
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Macro Rings */}
            <div className="surface-group p-6 rounded-lg">
              <h3 className="text-label uppercase text-ink-faint font-medium mb-6">
                Macronutrient Progress
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {macros.map((macro) => (
                  <MacroRing
                    key={macro.label}
                    value={macro.current}
                    goal={macro.goal}
                    label={macro.label}
                    unit={macro.unit}
                    color={macro.color as "green" | "yellow" | "red"}
                    size={100}
                  />
                ))}
              </div>
            </div>

            {/* Micro Heatmap - preview */}
            <div className="surface-group p-6 rounded-lg">
              <h3 className="text-label uppercase text-ink-faint font-medium mb-4">
                Micronutrient Overview
              </h3>
              <div className="h-64">
                <MicroHeatmap data={microData} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Weekly Trends */}
            <WeeklyTrends data={weeklyData} />

            {/* Micro Heatmap Full */}
            <MicroHeatmap data={microData} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProgressDashboard;
