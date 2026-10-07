import { useMemo, useState, useCallback, useEffect } from "react";
import { Sun, Wind, Cloud, Activity } from "lucide-react";

interface UserProfile {
  age: number;
  sex: "male" | "female";
  weight: number; // kg
  height: number; // cm
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
}

interface MacroGoals {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
}

interface StreakInfo {
  days: number;
  longestStreak: number;
  totalRelapses: number;
  isOnStreak: boolean;
}

const calculateBMR = (profile: UserProfile): number => {
  if (profile.sex === "male") {
    return 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    return 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }
};

const getActivityMultiplier = (level: UserProfile["activityLevel"]): number => {
  switch (level) {
    case "sedentary": return 1.2;
    case "light": return 1.375;
    case "moderate": return 1.55;
    case "active": return 1.725;
    case "veryActive": return 1.9;
    default: return 1.375;
  }
};

const calculateTDEE = (profile: UserProfile): number => {
  const bmr = calculateBMR(profile);
  const activityMultiplier = getActivityMultiplier(profile.activityLevel);
  return Math.round(bmr * activityMultiplier);
};

const getMacroDistribution = (
  calories: number,
  goalType: "balanced" | "highProtein" | "keto" | "zone" | "custom"
): { proteinRatio: number; carbsRatio: number; fatRatio: number } => {
  switch (goalType) {
    case "balanced":
      return { proteinRatio: 0.25, carbsRatio: 0.45, fatRatio: 0.30 };
    case "highProtein":
      return { proteinRatio: 0.35, carbsRatio: 0.35, fatRatio: 0.30 };
    case "keto":
      return { proteinRatio: 0.20, carbsRatio: 0.05, fatRatio: 0.75 };
    case "zone":
      return { proteinRatio: 0.27, carbsRatio: 0.41, fatRatio: 0.32 };
    case "custom":
      return { proteinRatio: 0.30, carbsRatio: 0.40, fatRatio: 0.30 };
    default:
      return { proteinRatio: 0.25, carbsRatio: 0.45, fatRatio: 0.30 };
  }
};

const calculateMacrosFromCalories = (
  calories: number,
  distribution: { proteinRatio: number; carbsRatio: number; fatRatio: number }
): MacroGoals => {
  const proteinCalories = Math.round(calories * distribution.proteinRatio);
  const carbsCalories = Math.round(calories * distribution.carbsRatio);
  const fatCalories = calories - proteinCalories - carbsCalories;

  return {
    calories,
    protein: Math.round(proteinCalories / 4), // 4 cal/g
    carbs: Math.round(carbsCalories / 4),     // 4 cal/g
    fat: Math.round(fatCalories / 9),         // 9 cal/g
    fiber: Math.round(calories / 1000),       // 1g fiber per 1000 cal (general guideline)
  };
};

const adjustGoalsForStreak = (
  goals: MacroGoals,
  streak: StreakInfo,
  profile: UserProfile
): MacroGoals => {
  // If user is on a streak, slightly increase calories for muscle maintenance
  if (streak.isOnStreak) {
    const adjustment = Math.min(streak.days * 0.05, 30); // 5% per day up to 30 extra cal
    const adjustedCalories = Math.round(goals.calories + adjustment);
    
    // For streaks > 30 days, increase protein to support muscle repair
    const proteinAdjustment = streak.days > 30 ? 5 : 0;
    
    return {
      ...goals,
      calories: adjustedCalories,
      protein: goals.protein + proteinAdjustment,
    };
  }

  // If user has recent relapses, support recovery with higher carbs
  if (streak.totalRelapses > 0 && streak.totalRelapses <= 3) {
    const carbAdjustment = Math.round(streak.totalRelapses * 10); // 10g carbs per relapse
    return {
      ...goals,
      carbs: goals.carbs + carbAdjustment,
    };
  }

  return goals;
};

export const useSmartGoals = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goalType, setGoalType] = useState<"balanced" | "highProtein" | "keto" | "zone" | "custom">("balanced");
  const [streak, setStreak] = useState<StreakInfo>({ days: 0, longestStreak: 0, totalRelapses: 0, isOnStreak: false });

  // Calculate current goals whenever inputs change
  const currentGoals = useMemo(() => {
    if (!profile) return null;

    const tdee = calculateTDEE(profile);
    const distribution = getMacroDistribution(tdee, goalType);
    const baseGoals = calculateMacrosFromCalories(tdee, distribution);
    return adjustGoalsForStreak(baseGoals, streak, profile);
  }, [profile, goalType, streak]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const updateStreak = useCallback((newStreak: Partial<StreakInfo>) => {
    setStreak(prev => ({ ...prev, ...newStreak, isOnStreak: newStreak.days > 0 }));
  }, []);

  return {
    profile,
    setProfile: updateProfile,
    goalType,
    setGoalType,
    streak,
    setStreak: updateStreak,
    currentGoals,
  };
};
