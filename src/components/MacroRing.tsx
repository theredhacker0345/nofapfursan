"use client";

import React from "react";
import { motion } from "framer-motion";
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

  const strokeColor = {
    green: "hsl(var(--success))",
    yellow: "hsl(var(--warning))",
    red: "hsl(var(--danger))",
  }[color];

  const textColor = {
    green: "text-success",
    yellow: "text-warning",
    red: "text-danger",
  }[color];

  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getInsight = () => {
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
        <circle
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="text-surface-3"
        />

        <motion.circle
          stroke={strokeColor}
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
          className={cn("font-data text-2xl font-bold", textColor)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.p>
        <p className="font-data text-sm text-ink-muted">/{goal} {unit}</p>
      </div>

      <div className="mt-3 text-center">
        <p className="text-label uppercase text-ink-muted">{label}</p>
        <p className="font-data text-sm text-ink-faint">{Math.round(percentage)}%</p>
      </div>

      <div className="mt-2 max-w-[200px] text-center">
        <p className="text-meta text-ink-muted">{getInsight()}</p>
      </div>
    </motion.div>
  );
};

export default MacroRing;
