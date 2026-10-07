// Recipe Builder and Meal Planner for Nutrition 100x Improvement
// Components for creating composite nutrition entries and weekly meal planning

import { useState, useMemo } from "react";
import { Clock, Egg, Wheat, Coffee, Apple } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodEntry {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  instructions: string[];
  ingredients: FoodEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

interface MealPlanSlot {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  recipe?: Recipe;
  customEntry?: FoodEntry;
}

interface RecipeDatabase {
  recipes: Recipe[];
  quickAddPresets: FoodEntry[];
}

// Built-in recipe database with common meals
export const RECIPE_DATABASE: Recipe[] = [
  {
    id: "protein-smoothie",
    name: "Protein Smoothie",
    description: "High-protein breakfast drink",
    servings: 2,
    prepTime: 5,
    cookTime: 0,
    difficulty: "easy",
    tags: ["protein", "quick", "breakfast"],
    instructions: [
      "Add liquid (water/milk) to blender",
      "Add protein powder",
      "Add fruit and spinach (optional)",
      "Blend until smooth",
      "Pour into glasses"
    ],
    ingredients: [
      { id: "protein-powder", name: "Whey protein", amount: 30, unit: "g", calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0 },
      { id: "banana", name: "Banana", amount: 1, unit: "medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 2.6 },
      { id: "milk", name: "Almond milk", amount: 250, unit: "ml", calories: 30, protein: 1, carbs: 1, fat: 2.5, fiber: 0 },
    ],
    totalCalories: 255,
    totalProtein: 26.3,
    totalCarbs: 31,
    totalFat: 3.9,
    totalFiber: 2.6,
  },
  {
    id: "egg-scramble-italian",
    name: "Italian Egg Scramble",
    description: "Classic Italian breakfast with herbs",
    servings: 4,
    prepTime: 10,
    cookTime: 5,
    difficulty: "medium",
    tags: ["protein", "italian", "breakfast"],
    instructions: [
      "Whisk eggs with salt and pepper",
      "Heat olive oil in skillet",
      "Add mushrooms and herbs",
      "Pour eggs and cook slowly",
      "Fold and serve"
    ],
    ingredients: [
      { id: "eggs", name: "Large eggs", amount: 12, unit: "pcs", calories: 858, protein: 54, carbs: 12, fat: 72, fiber: 0 },
      { id: "mushrooms", name: "Mushrooms", amount: 200, unit: "g", calories: 85, protein: 3.2, carbs: 5, fat: 0.3, fiber: 1.6 },
      { id: "herbs", name: "Fresh herbs", amount: 10, unit: "g", calories: 5, protein: 0.5, carbs: 1, fat: 0, fiber: 0.3 },
      { id: "olive-oil", name: "Olive oil", amount: 15, unit: "ml", calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
    ],
    totalCalories: 1092,
    totalProtein: 57.7,
    totalCarbs: 18,
    totalFat: 87.5,
    totalFiber: 2,
  },
  {
    id: "grilled-chicken-salad",
    name: "Grilled Chicken Salad",
    description: "Protein-rich salad with mixed vegetables",
    servings: 4,
    prepTime: 15,
    cookTime: 10,
    difficulty: "medium",
    tags: ["protein", "healthy", "lunch"],
    instructions: [
      "Season chicken with herbs and salt",
      "Grill chicken until cooked through",
      "Chop vegetables",
      "Mix all ingredients in a bowl",
      "Add olive oil dressing"
    ],
    ingredients: [
      { id: "chicken-breast", name: "Chicken breast", amount: 400, unit: "g", calories: 340, protein: 68, carbs: 0, fat: 6.4, fiber: 0 },
      { id: "lettuce", name: "Romaine lettuce", amount: 200, unit: "g", calories: 15, protein: 1.5, carbs: 3, fat: 0.2, fiber: 2.1 },
      { id: "tomatoes", name: "Tomatoes", amount: 150, unit: "g", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
      { id: "cucumber", name: "Cucumber", amount: 150, unit: "g", calories: 12, protein: 0.5, carbs: 2, fat: 0.1, fiber: 0.5 },
      { id: "olive-oil", name: "Olive oil", amount: 15, unit: "ml", calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
    ],
    totalCalories: 514,
    totalProtein: 70.4,
    totalCarbs: 8.9,
    totalFat: 78.5,
    totalFiber: 4,
  },
  {
    id: "protein-brown-rice",
    name: "Protein Brown Rice Bowl",
    description: "Complete meal with protein and complex carbs",
    servings: 2,
    prepTime: 15,
    cookTime: 20,
    difficulty: "easy",
    tags: ["protein", "grains", "dinner"],
    instructions: [
      "Cook brown rice",
      "Grill chicken breast",
      "Steam vegetables",
      "Mix all ingredients",
      "Add seasoning"
    ],
    ingredients: [
      { id: "brown-rice", name: "Brown rice", amount: 200, unit: "g", calories: 248, protein: 5.3, carbs: 50.4, fat: 3.5, fiber: 3.6 },
      { id: "chicken-breast", name: "Chicken breast", amount: 300, unit: "g", calories: 408, protein: 81, carbs: 0, fat: 12, fiber: 0 },
      { id: "broccoli", name: "Broccoli", amount: 150, unit: "g", calories: 55, protein: 2.8, carbs: 11, fat: 0.6, fiber: 5.1 },
      { id: "olive-oil", name: "Olive oil", amount: 10, unit: "ml", calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
    ],
    totalCalories: 830,
    totalProtein: 88.3,
    totalCarbs: 61.4,
    totalFat: 79,
    totalFiber: 8.7,
  },
  {
    id: "overnight-oats",
    name: "Overnight Oats",
    description: "No-cook breakfast with fruits and nuts",
    servings: 2,
    prepTime: 5,
    cookTime: 0,
    difficulty: "easy",
    tags: ["protein", "breakfast", "quick"],
    instructions: [
      "Mix oats with liquid",
      "Add protein powder and fruit",
      "Add nuts and seeds",
      "Refrigerate overnight",
      "Serve chilled"
    ],
    ingredients: [
      { id: "oats", name: "Rolled oats", amount: 100, unit: "g", calories: 371, protein: 16.9, carbs: 62.4, fat: 7.9, fiber: 10.6 },
      { id: "protein-powder", name: "Whey protein", amount: 30, unit: "g", calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0 },
      { id: "banana", name: "Banana", amount: 1, unit: "medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 2.6 },
      { id: "almonds", name: "Almonds", amount: 20, unit: "g", calories: 174, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
    ],
    totalCalories: 770,
    totalProtein: 48.2,
    totalCarbs: 98.4,
    totalFat: 23.4,
    totalFiber: 16.1,
  },
  {
    id: "tuna-salad-wrap",
    name: "Tuna Salad Wrap",
    description: "Protein-rich lunch wrap with vegetables",
    servings: 2,
    prepTime: 10,
    cookTime: 0,
    difficulty: "easy",
    tags: ["protein", "lunch", "quick"],
    instructions: [
      "Mix tuna with Greek yogurt",
      "Add celery and onion",
      "Season with mustard and salt",
      "Spread on whole wheat wrap",
      "Roll and cut"
    ],
    ingredients: [
      { id: "tuna", name: "Canned tuna", amount: 150, unit: "g", calories: 280, protein: 52, carbs: 0, fat: 6.6, fiber: 0 },
      { id: "greek-yogurt", name: "Greek yogurt", amount: 50, unit: "g", calories: 59, protein: 6.7, carbs: 3.7, fat: 0, fiber: 0 },
      { id: "celery", name: "Celery", amount: 100, unit: "g", calories: 16, protein: 0.6, carbs: 3, fat: 0.2, fiber: 2.1 },
      { id: "onion", name: "Onion", amount: 50, unit: "g", calories: 35, protein: 0.5, carbs: 7.4, fat: 0.1, fiber: 1.2 },
      { id: "whole-wheat-wrap", name: "Whole wheat wrap", amount: 70, unit: "g", calories: 68, protein: 2.8, carbs: 12.4, fat: 0.8, fiber: 1.4 },
    ],
    totalCalories: 448,
    totalProtein: 67.8,
    totalCarbs: 23,
    totalFat: 8.5,
    totalFiber: 6.3,
  },
];

// Quick-add presets for individual foods
export const QUICK_ADD_PRESETS = [
  { id: "protein-powder", name: "Whey protein", amount: 30, unit: "g", calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0 },
  { id: "whey-isolate", name: "Whey isolate", amount: 25, unit: "g", calories: 98, protein: 23, carbs: 0, fat: 0.5, fiber: 0 },
  { id: "casein", name: "Casein protein", amount: 30, unit: "g", calories: 120, protein: 23, carbs: 1, fat: 1, fiber: 0 },
  { id: "chicken-breast", name: "Chicken breast", amount: 150, unit: "g", calories: 248, protein: 46, carbs: 0, fat: 5, fiber: 0 },
  { id: "turkey-breast", name: "Turkey breast", amount: 150, unit: "g", calories: 210, protein: 45, carbs: 0, fat: 2, fiber: 0 },
  { id: "salmon", name: "Salmon fillet", amount: 150, unit: "g", calories: 354, protein: 63, carbs: 0, fat: 23, fiber: 0 },
  { id: "tuna", name: "Canned tuna", amount: 150, unit: "g", calories: 280, protein: 52, carbs: 0, fat: 6.6, fiber: 0 },
  { id: "eggs", name: "Large eggs", amount: 2, unit: "pcs", calories: 156, protein: 12.6, carbs: 1.2, fat: 10.9, fiber: 0 },
  { id: "greek-yogurt", name: "Greek yogurt", amount: 200, unit: "g", calories: 130, protein: 23, carbs: 7, fat: 0, fiber: 0 },
  { id: "oats", name: "Rolled oats", amount: 40, unit: "g", calories: 148, protein: 6.7, carbs: 27, fat: 3.3, fiber: 2.7 },
  { id: "brown-rice", name: "Brown rice", amount: 100, unit: "g", calories: 112, protein: 2.5, carbs: 22.6, fat: 1.9, fiber: 1.8 },
  { id: "banana", name: "Banana", amount: 1, unit: "medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 2.6 },
  { id: "apple", name: "Apple", amount: 1, unit: "medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
  { id: "almonds", name: "Almonds", amount: 28, unit: "g", calories: 174, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
  { id: "walnuts", name: "Walnuts", amount: 28, unit: "g", calories: 185, protein: 2.5, carbs: 3.9, fat: 17.4, fiber: 1.9 },
  { id: "olive-oil", name: "Olive oil", amount: 15, unit: "ml", calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
  { id: "butter", name: "Butter", amount: 15, unit: "g", calories: 102, protein: 0.1, carbs: 0.1, fat: 11.5, fiber: 0 },
];

export const MEAL_PLAN_TEMPLATES = {
  "standard": [
    { day: "Monday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Monday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Monday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Tuesday", meal: "breakfast", recipe: "overnight-oats" },
    { day: "Tuesday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Tuesday", meal: "dinner", recipe: "egg-scramble-italian" },
    { day: "Wednesday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Wednesday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Wednesday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Thursday", meal: "breakfast", recipe: "overnight-oats" },
    { day: "Thursday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Thursday", meal: "dinner", recipe: "egg-scramble-italian" },
    { day: "Friday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Friday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Friday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Saturday", meal: "breakfast", recipe: "overnight-oats" },
    { day: "Saturday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Saturday", meal: "dinner", recipe: "egg-scramble-italian" },
    { day: "Sunday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Sunday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Sunday", meal: "dinner", recipe: "protein-brown-rice" },
  ],
  "keto": [
    { day: "Monday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Monday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Monday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Tuesday", meal: "breakfast", recipe: "egg-scramble-italian" },
    { day: "Tuesday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Tuesday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Wednesday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Wednesday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Wednesday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Thursday", meal: "breakfast", recipe: "egg-scramble-italian" },
    { day: "Thursday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Thursday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Friday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Friday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Friday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Saturday", meal: "breakfast", recipe: "overnight-oats" },
    { day: "Saturday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Saturday", meal: "dinner", recipe: "egg-scramble-italian" },
    { day: "Sunday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Sunday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: " domingo", meal: "dinner", recipe: "protein-brown-rice" },
  ],
  "high-protein": [
    { day: "Monday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Monday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Monday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Tuesday", meal: "breakfast", recipe: "overnight-oats" },
    { day: "Tuesday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Tuesday", meal: "dinner", recipe: "egg-scramble-italian" },
    { day: "Wednesday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Wednesday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Wednesday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Thursday", meal: "breakfast", recipe: "overnight-oats" },
    { day: "Thursday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Thursday", meal: "dinner", recipe: "egg-scramble-italian" },
    { day: "Friday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Friday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Friday", meal: "dinner", recipe: "protein-brown-rice" },
    { day: "Saturday", meal: "breakfast", recipe: "overnight-oats" },
    { day: "Saturday", meal: "lunch", recipe: "tuna-salad-wrap" },
    { day: "Saturday", meal: "dinner", recipe: "egg-scramble-italian" },
    { day: "Sunday", meal: "breakfast", recipe: "protein-smoothie" },
    { day: "Sunday", meal: "lunch", recipe: "grilled-chicken-salad" },
    { day: "Sunday", meal: "dinner", recipe: "protein-brown-rice" },
  ],
};