import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type MacroRingProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
};

const getProgress = (current: number, goal: number): number => {
  if (goal <= 0) return 0;
  const p = current / goal;
  return Math.min(Math.max(p, 0), 1);
};

const getStrokeWidth = (goal: number): number => {
  return goal > 1000 ? 20 : goal > 500 ? 16 : 12;
};

export function MacroRing({
  calories,
  protein,
  carbs,
  fat,
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatGoal,
}: MacroRingProps) {
  const calorieRingRef = useRef<HTMLDivElement>(null);
  const proteinRingRef = useRef<HTMLDivElement>(null);
  const carbsRingRef = useRef<HTMLDivElement>(null);
  const fatRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateCircleSize = (ref: React.RefObject<HTMLDivElement>) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const diameter = Math.min(rect.width, rect.height);
        const radius = diameter / 2;
        const circumference = 2 * Math.PI * radius;
        ref.current.style.transition = "stroke-dashoffset 0.3s ease";
        // $FlowFixMe - template literal produces string
        ref.current.style.strokeDasharray = `${circumference} ${circumference}`;
        // Use setAttribute to avoid TypeScript strict typing on strokeDashoffset
        ref.current.setAttribute("stroke-dashoffset", circumference.toString());
        // Store values for later use via data attributes
        ref.current.dataset.circumference = circumference.toString();
        ref.current.dataset.radius = radius.toString();
      }
    };

    if (calorieRingRef.current) calculateCircleSize(calorieRingRef);
    if (proteinRingRef.current) calculateCircleSize(proteinRingRef);
    if (carbsRingRef.current) calculateCircleSize(carbsRingRef);
    if (fatRingRef.current) calculateCircleSize(fatRingRef);
  }, []);

  const calorieProgress = getProgress(calories, calorieGoal);
  const proteinProgress = getProgress(protein, proteinGoal);
  const carbsProgress = getProgress(carbs, carbsGoal);
  const fatProgress = getProgress(fat, fatGoal);

  const ringSize = 80;
  const innerRadius = ringSize / 2 - 4;
  const outerRadius = ringSize / 2 - 2;
  const calorieCircumference = 2 * Math.PI * innerRadius;
  const proteinCircumference = 2 * Math.PI * (innerRadius - 8);
  const carbsCircumference = 2 * Math.PI * (innerRadius - 14);
  const fatCircumference = 2 * Math.PI * (innerRadius - 20);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Rings row - compact layout */}
      <div className="flex gap-2">
        {/* Calorie ring */}
        <div
          ref={calorieRingRef}
          className="relative w-20 h-20"
          style={{ width: ringSize, height: ringSize }}
        >
          <svg width={ringSize} height={ringSize} viewBox="0 0 {ringSize} {ringSize}">
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(calorieGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--ink)"
              stroke-width={getStrokeWidth(calorieGoal)}
              strokeDasharray={calorieCircumference}
              strokeDashoffset={calorieCircumference * (1 - calorieProgress)}
              className="opacity-20"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--accent)"
              stroke-width={getStrokeWidth(calorieGoal)}
              strokeDasharray={calorieCircumference}
              strokeDashoffset={calorieCircumference * (1 - calorieProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius + 12}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="var(--ink)"
            >
              {calories}
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 28}
              textAnchor="middle"
              fontSize="9"
              fill="var(--ink-muted)"
            >
              kcal
            </text>
          </svg>
        </div>

        {/* Protein ring */}
        <div
          ref={proteinRingRef}
          className="relative w-20 h-20"
          style={{ width: ringSize, height: ringSize }}
        >
          <svg width={ringSize} height={ringSize} viewBox="0 0 {ringSize} {ringSize}">
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(proteinGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--ink-muted)"
              stroke-width={getStrokeWidth(proteinGoal)}
              strokeDasharray={proteinCircumference}
              strokeDashoffset={proteinCircumference * (1 - proteinProgress)}
              className="opacity-20"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="hsl(var(--accent))"
              stroke-width={getStrokeWidth(proteinGoal)}
              strokeDasharray={proteinCircumference}
              strokeDashoffset={proteinCircumference * (1 - proteinProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius + 12}
              textAnchor="middle"
              fontSize="12"
              fontWeight="500"
              fill="var(--ink)"
            >
              {protein}{" "}
              <tspan x={innerRadius} y={innerRadius + 24} dy="1.2">
                g
              </tspan>
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 36}
              textAnchor="middle"
              fontSize="8"
              fill="var(--ink-muted)"
            >
              of {proteinGoal}g
            </text>
          </svg>
        </div>

        {/* Carbs ring */}
        <div
          ref={carbsRingRef}
          className="relative w-20 h-20"
          style={{ width: ringSize, height: ringSize }}
        >
          <svg width={ringSize} height={ringSize} viewBox="0 0 {ringSize} {ringSize}">
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(carbsGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--ink-muted)"
              stroke-width={getStrokeWidth(carbsGoal)}
              strokeDasharray={carbsCircumference}
              strokeDashoffset={carbsCircumference * (1 - carbsProgress)}
              className="opacity-20"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="hsl(var(--accent))"
              stroke-width={getStrokeWidth(carbsGoal)}
              strokeDasharray={carbsCircumference}
              strokeDashoffset={carbsCircumference * (1 - carbsProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius + 12}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="var(--ink)"
            >
              {carbs}
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 24}
              textAnchor="middle"
              fontSize="8"
              fill="var(--ink-muted)"
            >
              <tspan x={innerRadius} y={innerRadius + 30} dy="1.2">
                g
              </tspan>
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 38}
              textAnchor="middle"
              fontSize="7"
              fill="var(--ink-muted)"
            >
              of {carbsGoal}g
            </text>
          </svg>
        </div>

        {/* Fat ring */}
        <div
          ref={fatRingRef}
          className="relative w-20 h-20"
          style={{ width: ringSize, height: ringSize }}
        >
          <svg width={ringSize} height={ringSize} viewBox="0 0 {ringSize} {ringSize}">
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(fatGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="var(--ink-muted)"
              stroke-width={getStrokeWidth(fatGoal)}
              strokeDasharray={fatCircumference}
              strokeDashoffset={fatCircumference * (1 - fatProgress)}
              className="opacity-20"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius - 4}
              fill="none"
              stroke="hsl(var(--accent))"
              stroke-width={getStrokeWidth(fatGoal)}
              strokeDasharray={fatCircumference}
              strokeDashoffset={fatCircumference * (1 - fatProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius + 12}
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="var(--ink)"
            >
              {fat}
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 24}
              textAnchor="middle"
              fontSize="7"
              fill="var(--ink-muted)"
            >
              <tspan x={innerRadius} y={innerRadius + 30} dy="1.2">
                g
              </tspan>
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 38}
              textAnchor="middle"
              fontSize="7"
              fill="var(--ink-muted)"
            >
              of {fatGoal}g
            </text>
          </svg>
        </div>
      </div>

      {/* Goal legend */}
      <div className="flex gap-1.5 text-[7] text-ink-muted mt-1">
        <span>Cal</span>
        <span>P</span>
        <span>C</span>
        <span>F</span>
      </div>
    </div>
  );
}