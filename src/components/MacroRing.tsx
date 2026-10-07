"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MacroRingProps {
  value: number;
  goal: number;
  label: string;
  unit: string;
  color: "green" | "yellow" | "red";
  size?: number;
  animated?: boolean;
}

const MacroRing: React.FC<MacroRingProps> = ({
  value,
  goal,
  label,
  unit,
  color,
  size = 120,
  animated = true,
}) => {
  const percentage = Math.min((value / goal) * 100, 100);
  const radius = (size - 8) / 2;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const getColor = () => {
    switch (color) {
      case "green":
        return "stroke-green-500";
      case "yellow":
        return "stroke-yellow-500";
      case "red":
        return "stroke-red-500";
      default:
        return "stroke-gray-500";
    }
  };
  
  const getProgressColor = () => {
    switch (color) {
      case "green":
        return "text-green-600";
      case "yellow":
        return "text-yellow-600";
      case "red":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getInsight = () => {
    const deficit = goal - value;
    const ratio = value / goal;
    
    if (ratio < 0.5) return `Low ${label.toLowerCase()} — add more ${label.toLowerCase()}`;
    if (ratio < 0.8) return `Moderate ${label.toLowerCase()} — consider increasing`;
    if (ratio > 1.5) return `High ${label.toLowerCase()} — watch portions`;
    return `Good ${label.toLowerCase()} intake`;
  };
  
  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="text-gray-200"
        />
        
        {/* Progress ring */}
        <motion.circle
          stroke={color === "green" ? "rgb(34, 197, 94)" : color === "yellow" ? "rgb(234, 179, 8)" : "rgb(239, 68, 68)"}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          className={cn("font-data text-2xl font-bold", getProgressColor())}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.p>
        <p className="font-data text-sm text-gray-500">/{goal} {unit}</p>
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-label uppercase text-gray-700">{label}</p>
        <p className="text-caption mt-1 text-gray-600">{Math.round(percentage)}%</p>
      </div>
      
      <div className="mt-2 max-w-[200px] text-center">
        <p className="text-caption text-gray-700">{getInsight()}</p>
      </div>
    </motion.div>
  );
};

export default MacroRing;