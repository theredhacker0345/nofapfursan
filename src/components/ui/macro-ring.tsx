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
  return goal > 1000 ? 8 : goal > 500 ? 6 : 4;
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
    const calculateRingSize = (ref: React.RefObject<HTMLDivElement>) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const diameter = Math.min(rect.width, rect.height, 180);
        ref.current.style.width = `${diameter}px`;
        ref.current.style.height = `${diameter}px`;
      }
    };

    if (calorieRingRef.current) calculateRingSize(calorieRingRef);
    if (proteinRingRef.current) calculateRingSize(proteinRingRef);
    if (carbsRingRef.current) calculateRingSize(carbsRingRef);
    if (fatRingRef.current) calculateRingSize(fatRingRef);
  }, []);

  const calorieProgress = getProgress(calories, calorieGoal);
  const proteinProgress = getProgress(protein, proteinGoal);
  const carbsProgress = getProgress(carbs, carbsGoal);
  const fatProgress = getProgress(fat, fatGoal);

  const ringDiameter = 180;
  const innerRadius = ringDiameter / 2 - 2;
  const outerRadius = ringDiameter / 2 + 2;
  const calorieCircumference = 2 * Math.PI * innerRadius;
  const proteinCircumference = 2 * Math.PI * (innerRadius - 6);
  const carbsCircumference = 2 * Math.PI * (innerRadius - 12);
  const fatCircumference = 2 * Math.PI * (innerRadius - 18);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Section header */}
      <div className="text-center mb-4">
        <p className="text-uppercase text-[10] text-ink-muted tracking-wider">
          Macronutrients
        </p>
        <p className="text-2xl font-semibold text-ink mt-1">
          {calories}{" "}
          <tspan dy="1.2"> kcal</tspan>
        </p>
      </div>

      {/* Rings container - responsive row that wraps */}
      <div className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-10">
        {/* Calorie ring */}
        <div
          ref={calorieRingRef}
          className="relative flex flex-col items-center text-center"
        >
          <svg
            width={ringDiameter}
            height={ringDiameter}
            viewBox="0 0 {ringDiameter} {ringDiameter}"
            className="relative"
          >
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(calorieGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--ink)"
              stroke-width={getStrokeWidth(calorieGoal)}
              strokeDasharray={calorieCircumference}
              strokeDashoffset={calorieCircumference * (1 - calorieProgress)}
              className="opacity-30"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--accent)"
              stroke-width={getStrokeWidth(calorieGoal)}
              strokeDasharray={calorieCircumference}
              strokeDashoffset={calorieCircumference * (1 - calorieProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius - 12}
              textAnchor="middle"
              fontSize="28"
              fontWeight="700"
              fill="var(--ink)"
            >
              {calories}
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 20}
              textAnchor="middle"
              fontSize="14"
              fill="var(--ink-muted)"
            >
              kcal
            </text>
          </svg>
          <p className="text-[12] text-ink-muted mt-1">
            of {calorieGoal} kcal
          </p>
        </div>

        {/* Protein ring */}
        <div
          ref={proteinRingRef}
          className="relative flex flex-col items-center text-center"
        >
          <svg
            width={ringDiameter}
            height={ringDiameter}
            viewBox="0 0 {ringDiameter} {ringDiameter}"
            className="relative"
          >
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(proteinGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--ink-muted)"
              stroke-width={getStrokeWidth(proteinGoal)}
              strokeDasharray={proteinCircumference}
              strokeDashoffset={proteinCircumference * (1 - proteinProgress)}
              className="opacity-30"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="hsl(var(--accent))"
              stroke-width={getStrokeWidth(proteinGoal)}
              strokeDasharray={proteinCircumference}
              strokeDashoffset={proteinCircumference * (1 - proteinProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius - 12}
              textAnchor="middle"
              fontSize="24"
              fontWeight="600"
              fill="var(--ink)"
            >
              {protein}{" "}
              <tspan x={innerRadius} dy="1.2">
                g
              </tspan>
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 24}
              textAnchor="middle"
              fontSize="12"
              fill="var(--ink-muted)"
            >
              of {proteinGoal}g
            </text>
          </svg>
          <p className="text-[12] text-ink-muted mt-1">
            of {proteinGoal}g
          </p>
        </div>

        {/* Carbs ring */}
        <div
          ref={carbsRingRef}
          className="relative flex flex-col items-center text-center"
        >
          <svg
            width={ringDiameter}
            height={ringDiameter}
            viewBox="0 0 {ringDiameter} {ringDiameter}"
            className="relative"
          >
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(carbsGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--ink-muted)"
              stroke-width={getStrokeWidth(carbsGoal)}
              strokeDasharray={carbsCircumference}
              strokeDashoffset={carbsCircumference * (1 - carbsProgress)}
              className="opacity-30"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="hsl(var(--accent))"
              stroke-width={getStrokeWidth(carbsGoal)}
              strokeDasharray={carbsCircumference}
              strokeDashoffset={carbsCircumference * (1 - carbsProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius - 12}
              textAnchor="middle"
              fontSize="22"
              fontWeight="500"
              fill="var(--ink)"
            >
              {carbs}
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 24}
              textAnchor="middle"
              fontSize="11"
              fill="var(--ink-muted)"
            >
              <tspan dy="1.2">g</tspan>
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 38}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-muted)"
            >
              of {carbsGoal}g
            </text>
          </svg>
          <p className="text-[12] text-ink-muted mt-1">
            of {carbsGoal}g
          </p>
        </div>

        {/* Fat ring */}
        <div
          ref={fatRingRef}
          className="relative flex flex-col items-center text-center"
        >
          <svg
            width={ringDiameter}
            height={ringDiameter}
            viewBox="0 0 {ringDiameter} {ringDiameter}"
            className="relative"
          >
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--border)"
              stroke-width={getStrokeWidth(fatGoal)}
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="var(--ink-muted)"
              stroke-width={getStrokeWidth(fatGoal)}
              strokeDasharray={fatCircumference}
              strokeDashoffset={fatCircumference * (1 - fatProgress)}
              className="opacity-30"
            />
            <circle
              cx={innerRadius}
              cy={innerRadius}
              r={innerRadius}
              fill="none"
              stroke="hsl(var(--accent))"
              stroke-width={getStrokeWidth(fatGoal)}
              strokeDasharray={fatCircumference}
              strokeDashoffset={fatCircumference * (1 - fatProgress)}
            />
            <text
              x={innerRadius}
              y={innerRadius - 12}
              textAnchor="middle"
              fontSize="20"
              fontWeight="500"
              fill="var(--ink)"
            >
              {fat}
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 24}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-muted)"
            >
              <tspan dy="1.2">g</tspan>
            </text>
            <text
              x={innerRadius}
              y={innerRadius + 38}
              textAnchor="middle"
              fontSize="9"
              fill="var(--ink-muted)"
            >
              of {fatGoal}g
            </text>
          </svg>
          <p className="text-[12] text-ink-muted mt-1">
            of {fatGoal}g
          </p>
        </div>
      </div>

      {/* Goal legend - horizontal scrollable on mobile, horizontal on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-[10] font-medium text-ink">Cal</span>
        <span className="text-[10] text-ink-muted mx-2">P</span>
        <span className="text-[10] font-medium text-ink">C</span>
        <span className="text-[10] text-ink-muted mx-2">F</span>
      </div>
    </div>
  );
}