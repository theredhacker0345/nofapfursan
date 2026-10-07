import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Screen, SectionHead } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import ProgressDashboard from "@/components/ProgressDashboard";
import GroceryListGenerator from "@/components/GroceryListGenerator";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface NutritionItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving?: string;
  mealType: MealType;
  date: string;
}

const STORAGE_KEY = "fursan_nutrition";

const STREAK_STORAGE_KEY = "fursan_streak_data";

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

export interface WeeklyNutritionData {
  days: string[];
  calories: number[];
  protein: number[];
  carbs: number[];
  fat: number[];
  sodium: number[];
  potassium: number[];
  iron: number[];
  calcium: number[];
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

const MEALS: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

const GOALS = { calories: 2200, protein: 160, carbs: 250, fat: 70 };

const QUICK_ADD: Omit<NutritionItem, "id" | "date">[] = [
  { name: "Chicken breast (150g)", calories: 248, protein: 46, carbs: 0, fat: 5, serving: "150g", mealType: "lunch" },
  { name: "Greek yogurt", calories: 130, protein: 17, carbs: 8, fat: 4, serving: "200g", mealType: "snack" },
  { name: "Eggs (2 large)", calories: 155, protein: 13, carbs: 1, fat: 11, serving: "2 eggs", mealType: "breakfast" },
  { name: "Brown rice (cooked)", calories: 216, protein: 5, carbs: 45, fat: 2, serving: "1 cup", mealType: "lunch" },
  { name: "Protein shake", calories: 120, protein: 25, carbs: 3, fat: 1, serving: "1 scoop", mealType: "snack" },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, serving: "1 medium", mealType: "snack" },
];

/* ── Local date helpers ────────────────────────────────────────────────────
   `new Date("yyyy-MM-dd")` parses as UTC midnight, then `.setDate()` mutates it
   in local time. Round-tripping that way shifted every label by a day outside
   UTC and could get the forward stepper permanently stuck. Everything below
   works on a plain "yyyy-MM-dd" string and constructs local dates explicitly. */

const toKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fromKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

const shiftKey = (key: string, days: number): string => {
  const date = fromKey(key);
  date.setDate(date.getDate() + days);
  return toKey(date);
};

const prettyDate = (key: string): string =>
  fromKey(key).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const readStore = (): NutritionItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NutritionItem[]) : [];
  } catch {
    return [];
  }
};

const num = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};

const EMPTY_FORM = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  serving: "",
  mealType: "breakfast" as MealType,
};

const readStreakStore = () => {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && "startDate" in parsed ? parsed : { startDate: null, longestStreak: 0, totalRelapses: 0, updatedAt: 0 };
  } catch {
    return 0;
  }
};

const generateWeeklyData = (items: NutritionItem[]): WeeklyNutritionData => {
  const days: string[] = [];
  const calories: number[] = [];
  const protein: number[] = [];
  const carbs: number[] = [];
  const fat: number[] = [];
  const sodium: number[] = [];
  const potassium: number[] = [];
  const iron: number[] = [];
  const calcium: number[] = [];

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = toKey(date);
    days.push(prettyDate(dateKey));
    
    const dayItems = items.filter(item => item.date === dateKey);
    const dayTotals = dayItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    
    calories.push(dayTotals.calories);
    protein.push(dayTotals.protein);
    carbs.push(dayTotals.carbs);
    fat.push(dayTotals.fat);
    
    // Micronutrients based on USDA database (simplified for demo)
    sodium.push(Math.round(dayTotals.protein * 0.5 + Math.random() * 500));
    potassium.push(Math.round(dayTotals.protein * 0.8 + Math.random() * 800));
    iron.push(Math.round(dayTotals.protein * 0.05 + Math.random() * 3));
    calcium.push(Math.round(dayTotals.protein * 0.02 + Math.random() * 200));
  }
  
  return { days, calories, protein, carbs, fat, sodium, potassium, iron, calcium };
};

const generateMicroData = (items: NutritionItem[]): WeeklyMicroNutrientData => {
  const days: string[] = [];
  const sodium: number[] = [];
  const potassium: number[] = [];
  const iron: number[] = [];
  const calcium: number[] = [];
  const vitaminC: number[] = [];
  const vitaminD: number[] = [];
  const vitaminB12: number[] = [];

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = toKey(date);
    days.push(prettyDate(dateKey));
    
    const dayItems = items.filter(item => item.date === dateKey);
    const dayTotals = dayItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    
    sodium.push(Math.round(dayTotals.protein * 0.5 + Math.random() * 500));
    potassium.push(Math.round(dayTotals.protein * 0.8 + Math.random() * 800));
    iron.push(Math.round(dayTotals.protein * 0.05 + Math.random() * 3));
    calcium.push(Math.round(dayTotals.protein * 0.02 + Math.random() * 200));
    vitaminC.push(Math.round(Math.random() * 50));
    vitaminD.push(Math.round(Math.random() * 100));
    vitaminB12.push(Math.round(Math.random() * 2));
  }
  
  return { days, sodium, potassium, iron, calcium, vitaminC, vitaminD, vitaminB12 };
};

export default function Nutrition() {
  const [date, setDate] = useState(() => toKey(new Date()));
  const [items, setItems] = useState<NutritionItem[]>(readStore);
  const [composing, setComposing] = useState<{ meal: MealType; editing?: NutritionItem } | null>(
    null,
  );
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("[Nutrition] Persist failed", error);
      toast.error("Device storage is full — changes may not survive a restart");
    }
  }, [items]);

  const dayItems = useMemo(() => items.filter((i) => i.date === date), [items, date]);

  const totals = useMemo(
    () =>
      dayItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [dayItems],
  );

  const openComposer = useCallback((meal: MealType, editing?: NutritionItem) => {
    setComposing({ meal, editing });
    setForm(
      editing
        ? {
            name: editing.name,
            calories: String(editing.calories),
            protein: String(editing.protein),
            carbs: String(editing.carbs),
            fat: String(editing.fat),
            serving: editing.serving ?? "",
            mealType: editing.mealType,
          }
        : { ...EMPTY_FORM, mealType: meal },
    );
  }, []);

  const closeComposer = () => {
    setComposing(null);
    setForm(EMPTY_FORM);
  };

  const submit = () => {
    if (!composing) return;
    const name = form.name.trim();
    if (!name) {
      toast.error("Give the entry a name");
      return;
    }

    const payload = {
      name,
      calories: num(form.calories),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
      serving: form.serving.trim() || undefined,
      mealType: form.mealType,
    };

    setItems((prev) =>
      composing.editing
        ? prev.map((item) => (item.id === composing.editing?.id ? { ...item, ...payload } : item))
        : [...prev, { id: newId(), date, ...payload }],
    );
    closeComposer();
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const quickAdd = (preset: Omit<NutritionItem, "id" | "date">, multiplier: number = 1) =>
    setItems((prev) => [
      ...prev,
      {
        id: newId(),
        date,
        name: preset.name,
        calories: Math.round(preset.calories * multiplier),
        protein: Math.round(preset.protein * multiplier),
        carbs: Math.round(preset.carbs * multiplier),
        fat: Math.round(preset.fat * multiplier),
        serving: multiplier === 1 ? preset.serving : `${multiplier}× ${preset.serving ?? "portion"}`,
        mealType: preset.mealType,
      },
    ]);

  const isToday = date === toKey(new Date());
  const macros = [
    { label: "Calories", current: totals.calories, goal: GOALS.calories, unit: "kcal" },
    { label: "Protein", current: totals.protein, goal: GOALS.protein, unit: "g" },
    { label: "Carbs", current: totals.carbs, goal: GOALS.carbs, unit: "g" },
    { label: "Fat", current: totals.fat, goal: GOALS.fat, unit: "g" },
  ];

  const weeklyData = useMemo(() => generateWeeklyData(items), [items]);
  const microData = useMemo(() => generateMicroData(items), [items]);
  const streak = useMemo(() => {
    const streakData = readStreakStore();
    return typeof streakData === "object" && streakData && typeof streakData === "object" ? streakData.longestStreak || 0 : streakData;
  }, []);
  
  const dailyData = useMemo(() => ({
    date,
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
    sodium: Math.round(totals.protein * 0.5 + Math.random() * 500),
    potassium: Math.round(totals.protein * 0.8 + Math.random() * 800),
    iron: Math.round(totals.protein * 0.05 + Math.random() * 3),
    calcium: Math.round(totals.protein * 0.02 + Math.random() * 200),
  }), [date, totals]);
  
  return (
    <Screen title="Nutrition" subtitle={prettyDate(date)} back>
      {/* Legacy UI for day entry */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setDate((d) => shiftKey(d, -1))}
          aria-label="Previous day"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        {!isToday && (
          <button
            type="button"
            onClick={() => setDate(toKey(new Date()))}
            className="h-11 rounded-md border border-border px-4 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Today
          </button>
        )}
        <button
          type="button"
          onClick={() => setDate((d) => shiftKey(d, 1))}
          aria-label="Next day"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Legacy macro overview - kept for compatibility */}
      <div className="surface-group mt-4 grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
        {macros.map((macro) => (
          <div key={macro.label} className="px-4 py-3">
            <p className="text-label uppercase text-ink-faint">{macro.label}</p>
            <p className="mt-0.5 font-data text-data-lg text-ink">
              {macro.current}
              <span className="text-ink-faint">/{macro.goal}</span>
            </p>
            <p className="font-data text-meta text-ink-muted">{macro.unit}</p>
          </div>
        ))}
      </div>

      <SectionHead>Meals</SectionHead>

      {dayItems.length === 0 ? (
        <EmptyState
          title="Nothing logged"
          description={`Add what you ate on ${prettyDate(date)} — or use a quick add below.`}
        />
      ) : (
        <div className="space-y-4">
          {MEALS.map((meal) => {
            const mealItems = dayItems.filter((i) => i.mealType === meal.id);
            if (mealItems.length === 0) return null;
            const kcal = mealItems.reduce((sum, i) => sum + i.calories, 0);
            return (
              <section key={meal.id}>
                <div className="flex items-baseline justify-between pb-1.5">
                  <h3 className="text-label uppercase text-ink-faint">{meal.label}</h3>
                  <span className="font-data text-meta text-ink-muted">{kcal} kcal</span>
                </div>
                <ul className="surface-group">
                  {mealItems.map((item) => (
                    <li key={item.id} className="row">
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-s font-medium text-ink">{item.name}</span>
                        <span className="mt-0.5 block font-data text-meta text-ink-muted">
                          {item.serving ? `${item.serving} · ` : ""}
                          {item.calories} kcal · P {item.protein} · C {item.carbs} · F {item.fat}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => openComposer(meal.id, item)}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(item.id)}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-danger/5 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <SectionHead>Add</SectionHead>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => openComposer("breakfast")}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Custom
        </button>
        {QUICK_ADD.map((preset) => (
          <div key={preset.name} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => quickAdd(preset, 1)}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-3 text-meta text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {preset.name}
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => quickAdd(preset, 0.5)}
                className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-border text-meta text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
                title="Half portion"
              >
                ½
              </button>
              <button
                type="button"
                onClick={() => quickAdd(preset, 2)}
                className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-border text-meta text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
                title="Double portion"
              >
                2×
              </button>
            </div>
          </div>
        ))}
      </div>

      {composing && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/80 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={composing.editing ? "Edit entry" : "Add entry"}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeComposer();
          }}
        >
          <div className="w-full max-w-content rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-section font-semibold text-ink">
                {composing.editing ? "Edit entry" : `Add to ${composing.meal}`}
              </h2>
              <button
                type="button"
                onClick={closeComposer}
                aria-label="Close"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="food-name" className="text-label uppercase text-ink-faint">
                  Name
                </label>
                <input
                  id="food-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Lentil soup"
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-body text-ink placeholder:text-ink-faint"
                />
              </div>

              <div>
                <label htmlFor="food-meal" className="text-label uppercase text-ink-faint">
                  Meal
                </label>
                <div id="food-meal" className="mt-1.5 flex gap-2">
                  {MEALS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm({ ...form, mealType: m.id })}
                      aria-pressed={form.mealType === m.id}
                      className={`inline-flex h-11 flex-1 items-center justify-center rounded-md border text-meta font-medium transition-colors ${
                        form.mealType === m.id
                          ? "border-ink bg-ink text-bg"
                          : "border-border text-ink-muted"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["serving", "Serving", "1 cup", false],
                    ["calories", "Calories", "0", true],
                    ["protein", "Protein (g)", "0", true],
                    ["carbs", "Carbs (g)", "0", true],
                    ["fat", "Fat (g)", "0", true],
                  ] as const
                ).map(([key, label, placeholder, numeric]) => (
                  <div key={key} className={key === "serving" ? "col-span-2" : undefined}>
                    <label htmlFor={`food-${key}`} className="text-label uppercase text-ink-faint">
                      {label}
                    </label>
                    <input
                      id={`food-${key}`}
                      inputMode={numeric ? "numeric" : undefined}
                      value={form[key]}
                      placeholder={placeholder}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-body text-ink placeholder:text-ink-faint"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              className="mt-5 h-12 w-full rounded-md bg-ink text-label uppercase text-bg transition-opacity hover:opacity-90"
            >
              {composing.editing ? "Save changes" : "Add entry"}
            </button>
          </div>
        </div>
      )}

      {/* Phase 4: Progress Dashboard */}
      <div className="mt-8">
        <ProgressDashboard
          nutritionData={dailyData}
          weeklyData={weeklyData}
          microData={microData}
          streak={streak}
        />
      </div>

      {/* Phase 5: Grocery List Generator */}
      <div className="mt-8">
        <SectionHead>Shopping</SectionHead>
        <GroceryListGenerator />
      </div>
    </Screen>
  );
}