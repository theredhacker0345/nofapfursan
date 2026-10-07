"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const MicroHeatmap: React.FC<MicroHeatmapProps> = ({ data }) => {
  const micronutrientColors = {
    sodium: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", min: 0, max: 2300, good: ">1000", caution: "<500", low: "<200" },
    potassium: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", min: 0, max: 4700, good: ">3000", caution: "<1000", low: "<300" },
    iron: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", min: 0, max: 18, good: ">10", caution: "<5", low: "<2" },
    calcium: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", min: 0, max: 1300, good: ">1000", caution: "<700", low: "<300" },
    vitaminC: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", min: 0, max: 90, good: ">60", caution: "<30", low: "<15" },
    vitaminD: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", min: 0, max: 600, good: ">400", caution: "<200", low: "<100" },
    vitaminB12: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-800", min: 0, max: 2.4, good: ">2", caution: "<0.5", low: "<0.1" },
  };
  
  const getDayLabel = (dayIndex: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayIndex] || data.days[dayIndex];
  };
  
  const getMicronutrientData = () => {
    return Object.entries(micronutrientColors).map(([key, config]) => ({
      key,
      ...config,
      values: data[key as keyof typeof data] as number[],
    }));
  };
  
  const getColorIntensity = (value: number, config: typeof micronutrientColors.sodium) => {
    const ratio = value / config.max;
    
    if (ratio >= 0.8) return config.bg.replace("50", "600");
    if (ratio >= 0.5) return config.bg.replace("50", "300");
    if (ratio >= 0.2) return config.bg.replace("50", "100");
    return config.bg;
  };
  
  const getTextColor = (value: number, config: typeof micronutrientColors.sodium) => {
    const ratio = value / config.max;
    
    if (ratio >= 0.8) return config.text.replace(/600$/, "900");
    if (ratio >= 0.5) return config.text;
    return config.text.replace("800", "700");
  };
  
  const getInsight = (key: string, value: number, index: number) => {
    const config = micronutrientColors[key as keyof typeof micronutrientColors];
    const day = data.days[index];
    
    if (value < 50) return `Very low ${key} — add ${getFoodRecommendation(key)}`;
    if (value < 100) return `${key} low on ${day}`;
    if (value > config.max * 1.5) return `High ${key} on ${day} — monitor intake`;
    if (value > config.max * 0.8) return `Good ${key} on ${day}`;
    return `Adequate ${key} on ${day}`;
  };
  
  const getFoodRecommendation = (nutrient: string) => {
    const recommendations = {
      sodium: "bananas, potatoes, spinach",
      potassium: "bananas, oranges, avocados",
      iron: "red meat, beans, leafy greens",
      calcium: "dairy, leafy greens, fortified foods",
      vitaminC: "citrus fruits, berries, bell peppers",
      vitaminD: "fatty fish, fortified milk, sunlight",
      vitaminB12: "meat, fish, dairy, fortified cereals",
    };
    return recommendations[nutrient as keyof typeof recommendations] || "variety of foods";
  };
  
  const microData = getMicronutrientData();
  
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center">
        <h3 className="text-section font-semibold text-gray-900">Weekly Micronutrient Intake</h3>
        <p className="text-body text-gray-600">7-day color-coded visualization</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="text-label uppercase text-gray-500 font-medium">Day</div>
            {Object.keys(micronutrientColors).map((nutrient) => (
              <div key={nutrient} className="text-center">
                <div className="text-label uppercase text-gray-700 font-medium">{nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}</div>
                <div className="text-caption text-gray-500">mg/μg</div>
              </div>
            ))}
          </div>
          
          {/* Data rows */}
          <div className="space-y-2">
            {data.days.map((_, dayIndex) => (
              <motion.div
                key={dayIndex}
                className="grid grid-cols-8 gap-2 items-center py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dayIndex * 0.05 }}
              >
                <div className="text-label text-gray-900 font-medium">
                  {getDayLabel(dayIndex)}
                </div>
                
                {Object.entries(micronutrientColors).map(([key, config]) => {
                  const value = data[key as keyof typeof data][dayIndex] || 0;
                  const intensityColor = getColorIntensity(value, config);
                  const textColor = getTextColor(value, config);
                  const insight = getInsight(key, value, dayIndex);
                  
                  return (
                    <motion.div
                      key={key}
                      className={cn(
                        "h-12 rounded-lg border flex items-center justify-center text-caption font-medium transition-all hover:scale-105 cursor-help",
                        intensityColor,
                        config.border
                      )}
                      title={insight}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {value > 0 ? value.toFixed(1) : "-"}
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
          <h4 className="text-label uppercase text-gray-700 font-medium mb-3">Color Scale</h4>
          <div className="space-y-2 text-caption">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded" /> <span>High intake (&gt;80% goal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded" /> <span>Moderate intake (50-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded" /> <span>Low intake (20-50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 rounded" /> <span>Very low intake (&lt;20%)</span>
            </div>
          </div>
        </div>
        
        <div className="surface-group p-4 rounded-lg">
          <h4 className="text-label uppercase text-gray-700 font-medium mb-3">Daily Tips</h4>
          <div className="space-y-2 text-caption">
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