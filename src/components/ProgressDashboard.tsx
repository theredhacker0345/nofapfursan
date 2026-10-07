"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  
  const macros = useMemo(() => [
    { label: "Calories", current: nutritionData.calories, goal: 2200, unit: "kcal", color: nutritionData.calories < 1800 ? "red" : nutritionData.calories < 2000 ? "yellow" : "green" },
    { label: "Protein", current: nutritionData.protein, goal: 160, unit: "g", color: nutritionData.protein < 100 ? "red" : nutritionData.protein < 130 ? "yellow" : "green" },
    { label: "Carbs", current: nutritionData.carbs, goal: 250, unit: "g", color: nutritionData.carbs < 150 ? "red" : nutritionData.carbs < 200 ? "yellow" : "green" },
    { label: "Fat", current: nutritionData.fat, goal: 70, unit: "g", color: nutritionData.fat < 40 ? "red" : nutritionData.fat < 55 ? "yellow" : "green" },
  ], [nutritionData]);
  
  const getStreakInfo = () => {
    if (streak === 0) return { label: "Start your streak", color: "text-gray-600" };
    if (streak < 7) return { label: `${streak} days - Building consistency`, color: "text-orange-600" };
    if (streak < 30) return { label: `${streak} days - Great momentum`, color: "text-green-600" };
    if (streak < 90) return { label: `${streak} days - Excellent streak`, color: "text-blue-600" };
    return { label: `${streak} days - Legendary!`, color: "text-purple-600" };
  };
  
  const getQuickInsights = () => {
    const insights = [];
    
    if (nutritionData.calories < 1500) insights.push("Low calories — consider adding more food");
    if (nutritionData.protein < 80) insights.push("Low protein — add lean meats or beans");
    if (nutritionData.potassium < 2000) insights.push("Low potassium — add bananas, potatoes, spinach");
    if (nutritionData.iron < 8) insights.push("Low iron — include red meat, beans, leafy greens");
    if (nutritionData.calcium < 800) insights.push("Low calcium — dairy, leafy greens, fortified foods");
    
    if (insights.length === 0) {
      insights.push("Great job! You're meeting most nutritional goals");
      if (streak >= 7) insights.push("Excellent consistency - keep the streak going!");
    }
    
    return insights.slice(0, 3);
  };
  
  const getNutritionGrade = () => {
    const score = macros.reduce((sum, macro) => {
      const ratio = macro.current / macro.goal;
      return sum + (ratio >= 0.9 ? 10 : ratio >= 0.7 ? 7.5 : ratio >= 0.5 ? 5 : 2.5);
    }, 0);
    
    if (score >= 85) return { grade: "A", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
    if (score >= 70) return { grade: "B", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
    if (score >= 55) return { grade: "C", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" };
    return { grade: "D", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  };
  
  const nutritionGrade = getNutritionGrade();
  const streakInfo = getStreakInfo();
  const quickInsights = getQuickInsights();
  
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with streak and grade */}
      <div className="surface-group p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-display font-semibold text-gray-900">Nutrition Dashboard</h2>
            <p className="text-body text-gray-600 mt-1">
              {new Date(nutritionData.date).toLocaleDateString(undefined, { 
                weekday: "long", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Streak Indicator */}
            <motion.div
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl">🔥</div>
              <div>
                <p className="text-label uppercase text-orange-800">Streak</p>
                <p className={cn("font-semibold", streakInfo.color)}>{streakInfo.label}</p>
              </div>
            </motion.div>
            
            {/* Nutrition Grade */}
            <motion.div
              className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border-2", nutritionGrade.bg, nutritionGrade.border)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl">{nutritionGrade.grade}</div>
              <div>
                <p className="text-label uppercase text-gray-800">Nutrition Grade</p>
                <p className={cn("font-semibold", nutritionGrade.color)}>Grade {nutritionGrade.grade}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Quick Insights */}
      <div className="surface-group p-6 rounded-lg">
        <h3 className="text-label uppercase text-gray-700 font-medium mb-4">Quick Insights & Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickInsights.map((insight, index) => (
            <motion.div
              key={index}
              className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-body text-blue-900">{insight}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="surface-group p-2 rounded-lg inline-flex">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-6 py-3 rounded-md text-label uppercase font-medium transition-all",
            activeTab === 'overview'
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={cn(
            "px-6 py-3 rounded-md text-label uppercase font-medium transition-all",
            activeTab === 'details'
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Detailed Analysis
        </button>
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
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
              <h3 className="text-label uppercase text-gray-700 font-medium mb-6">Macronutrient Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {macros.map((macro, index) => (
                  <MacroRing
                    key={macro.label}
                    value={macro.current}
                    goal={macro.goal}
                    label={macro.label}
                    unit={macro.unit}
                    color={macro.color as "green" | "yellow" | "red"}
                    size={100}
                    animated={true}
                  />
                ))}
              </div>
            </div>
            
            {/* Micro Heatmap - preview */}
            <div className="surface-group p-6 rounded-lg">
              <h3 className="text-label uppercase text-gray-700 font-medium mb-4">Micronutrient Overview</h3>
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