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

  const size = 120;
  const calorieCircumference = 2 * Math.PI * 50;
  const proteinCircumference = 2 * Math.PI * 44;
  const carbsCircumference = 2 * Math.PI * 38;
  const fatCircumference = 2 * Math.PI * 32;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Calorie ring */}
      <div
        ref={calorieRingRef}
        className="relative w-24 h-24"
        style={{ width: 120, height: 120 }}
      >
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--border)"
            stroke-width={16}
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--ink)"
            stroke-width={16}
            strokeDasharray={calorieCircumference}
            strokeDashoffset={calorieCircumference * (1 - calorieProgress)}
            className="opacity-20"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--accent)"
            stroke-width={getStrokeWidth(calorieGoal)}
            strokeDasharray={calorieCircumference}
            strokeDashoffset={calorieCircumference * (1 - calorieProgress)}
          />
          <text
            x="60"
            y="65"
            textAnchor="middle"
            fontSize="18"
            fontWeight="600"
            fill="var(--ink)"
          >
            {calories}
          </text>
          <text
            x="60"
            y="85"
            textAnchor="middle"
            fontSize="10"
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
        style={{ width: 100, height: 100 }}
      >
        <svg width={100} height={100} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--border)"
            stroke-width={12}
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--ink-muted)"
            stroke-width={12}
            strokeDasharray={proteinCircumference}
            strokeDashoffset={proteinCircumference * (1 - proteinProgress)}
            className="opacity-20"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={getStrokeWidth(proteinGoal)}
            strokeDasharray={proteinCircumference}
            strokeDashoffset={proteinCircumference * (1 - proteinProgress)}
          />
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fontSize="14"
            fontWeight="500"
            fill="var(--ink)"
          >
            {protein}{" "}
            <tspan x="50" y="68" dy="1.2g">
              g
            </tspan>
          </text>
          <text
            x="50"
            y="78"
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-muted)"
          >
            of {proteinGoal}g
          </text>
        </svg>
      </div>

      {/* Carbs ring */}
      <div
        ref={carbsRingRef}
        className="relative w-16 h-16"
        style={{ width: 80, height: 80 }}
      >
        <svg width={80} height={80} viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="var(--border)"
            stroke-width={10}
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="var(--ink-muted)"
            stroke-width={10}
            strokeDasharray={carbsCircumference}
            strokeDashoffset={carbsCircumference * (1 - carbsProgress)}
            className="opacity-20"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={getStrokeWidth(carbsGoal)}
            strokeDasharray={carbsCircumference}
            strokeDashoffset={carbsCircumference * (1 - carbsProgress)}
          />
          <text
            x="40"
            y="48"
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="var(--ink)"
          >
            {carbs}
          </text>
          <text
            x="40"
            y="62"
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-muted)"
          >
            <tspan x="40" y="62" dy="1.2g">
              g
            </tspan>
          </text>
          <text
            x="40"
            y="74"
            textAnchor="middle"
            fontSize="8"
            fill="var(--ink-muted)"
          >
            of {carbsGoal}g
          </text>
        </svg>
      </div>

      {/* Fat ring */}
      <div
        ref={fatRingRef}
        className="relative w-12 h-12"
        style={{ width: 60, height: 60 }}
      >
        <svg width={60} height={60} viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            stroke="var(--border)"
            stroke-width={8}
          />
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            stroke="var(--ink-muted)"
            stroke-width={8}
            strokeDasharray={fatCircumference}
            strokeDashoffset={fatCircumference * (1 - fatProgress)}
            className="opacity-20"
          />
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={getStrokeWidth(fatGoal)}
            strokeDasharray={fatCircumference}
            strokeDashoffset={fatCircumference * (1 - fatProgress)}
          />
          <text
            x="30"
            y="36"
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill="var(--ink)"
          >
            {fat}
          </text>
          <text
            x="30"
            y="46"
            textAnchor="middle"
            fontSize="8"
            fill="var(--ink-muted)"
          >
            <tspan x="30" y="46" dy="1.2g">
              g
            </tspan>
          </text>
          <text
            x="30"
            y="56"
            textAnchor="middle"
            fontSize="7"
            fill="var(--ink-muted)"
          >
            of {fatGoal}g
          </text>
        </svg>
      </div>

      {/* Goal labels */}
      <div className="flex gap-2 text-[10] text-ink-muted">
        <span>Cal</span>
        <span>P</span>
        <span>C</span>
        <span>F</span>
      </div>
    </div>
  );
}