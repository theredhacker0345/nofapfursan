import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Utensils, Flame, WheatOff, Droplets, Activity, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface NutritionItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  date: string;
}

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", color: "bg-warning/10 text-warning border-warning/30" },
  { id: "lunch", label: "Lunch", color: "bg-accent/10 text-accent border-accent/30" },
  { id: "dinner", label: "Dinner", color: "bg-danger/10 text-danger border-danger/30" },
  { id: "snack", label: "Snack", color: "bg-success/10 text-success border-success/30" },
];

const SAMPLE_FOODS = [
  { name: "Oatmeal with berries", calories: 350, protein: 12, carbs: 58, fat: 7, serving: "1 bowl" },
  { name: "Greek yogurt with honey", calories: 180, protein: 20, carbs: 15, fat: 3, serving: "1 cup" },
  { name: "Scrambled eggs (2) + toast", calories: 320, protein: 18, carbs: 25, fat: 18, serving: "2 eggs + 1 slice" },
  { name: "Chicken breast (150g)", calories: 240, protein: 46, carbs: 0, fat: 5, serving: "150g" },
  { name: "Brown rice (1 cup cooked)", calories: 215, protein: 5, carbs: 45, fat: 2, serving: "1 cup" },
  { name: "Broccoli (1 cup)", calories: 55, protein: 4, carbs: 11, fat: 1, serving: "1 cup" },
  { name: "Salmon (150g)", calories: 280, protein: 39, carbs: 0, fat: 14, serving: "150g" },
  { name: "Sweet potato (medium)", calories: 112, protein: 2, carbs: 26, fat: 0, serving: "1 medium" },
  { name: "Apple with peanut butter", calories: 200, protein: 4, carbs: 25, fat: 10, serving: "1 apple + 1 tbsp" },
  { name: "Almonds (28g)", calories: 165, protein: 6, carbs: 6, fat: 14, serving: "28g" },
  { name: "Protein shake", calories: 120, protein: 25, carbs: 3, fat: 1, serving: "1 scoop" },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, serving: "1 medium" },
];

const NUTRITION_GOALS = {
  calories: 2200,
  protein: 160,
  carbs: 250,
  fat: 70,
};

const Nutrition = () => {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<NutritionItem[]>(() => {
    const stored = localStorage.getItem("fursan_nutrition");
    if (stored) {
      try { return JSON.parse(stored); } catch { return []; }
    }
    return [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NutritionItem | null>(null);
  const [newFood, setNewFood] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    serving: "",
    mealType: "breakfast" as NutritionItem["mealType"],
  });

  useEffect(() => {
    localStorage.setItem("fursan_nutrition", JSON.stringify(items));
  }, [items]);

  const getTodaysItems = () => items.filter(item => item.date === selectedDate);

  const getTodaysTotals = () => {
    const todaysItems = getTodaysItems();
    return todaysItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getMealItems = (mealType: string) =>
    getTodaysItems().filter(item => item.mealType === mealType);

  const addFood = () => {
    if (!newFood.name || newFood.calories <= 0) return;
    const newItem: NutritionItem = {
      id: crypto.randomUUID(),
      ...newFood,
      date: selectedDate,
    };
    setItems(prev => [...prev, newItem]);
    resetForm();
  };

  const updateFood = () => {
    if (!editingItem) return;
    setItems(prev =>
      prev.map(item => (item.id === editingItem.id ? { ...editingItem, ...newFood } : item))
    );
    resetForm();
  };

  const deleteFood = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const editFood = (item: NutritionItem) => {
    setEditingItem(item);
    setNewFood({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      serving: item.serving,
      mealType: item.mealType,
    });
    setShowAddModal(true);
  };

  const openAddModal = (mealType: string = "breakfast") => {
    setNewFood({
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      serving: "",
      mealType: mealType as NutritionItem["mealType"],
    });
    setEditingItem(null);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setNewFood({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, serving: "", mealType: "breakfast" });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(format(newDate, "yyyy-MM-dd"));
  };

  const totals = getTodaysTotals();
  const macros = [
    { label: "Calories", current: totals.calories, goal: NUTRITION_GOALS.calories, unit: "kcal" },
    { label: "Protein", current: totals.protein, goal: NUTRITION_GOALS.protein, unit: "g" },
    { label: "Carbs", current: totals.carbs, goal: NUTRITION_GOALS.carbs, unit: "g" },
    { label: "Fat", current: totals.fat, goal: NUTRITION_GOALS.fat, unit: "g" },
  ];

  return (
    <div className="min-h-screen bg-bg pb-20">
      <Header syncState="synced" />
      <div className="mx-auto max-w-screen-sm px-4 pt-2">

        {/* Date picker */}
        <header className="flex items-center justify-between py-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(-1)}
            className="text-ink"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ink-muted" />
            <span className="text-sm font-semibold text-ink">
              {format(new Date(selectedDate), "EEE, MMM d")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(1)}
            className="text-ink"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </header>

        {/* Macro Summary */}
        <section className="mb-6 animate-fade-in">
          <div className="grid grid-cols-4 gap-2">
            {macros.map((macro) => {
              const percentage = Math.min((macro.current / macro.goal) * 100, 100);
              return (
                <div key={macro.label} className="card p-3 text-center">
                  <div className="relative w-14 h-14 mx-auto mb-2">
                    <svg width="56" height="56" className="transform -rotate-90 absolute top-0 left-0">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                      <circle
                        cx="28" cy="28" r="22"
                        fill="none"
                        stroke="hsl(var(--accent))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(percentage / 100) * 138.23} 138.23`}
                        style={{ strokeDashoffset: 138.23 }}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs font-bold text-ink tabular">{macro.current}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    {macro.label}
                  </p>
                  <p className="text-[9px] text-ink-faint">
                    {macro.current}/{macro.goal}
                    {macro.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Add */}
        <section className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-semibold text-ink mb-3">Quick Add</h3>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {SAMPLE_FOODS.map((food) => (
              <button
                key={food.name}
                onClick={() => {
                  setNewFood({
                    name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    serving: food.serving,
                    mealType: "lunch",
                  });
                  setShowAddModal(true);
                }}
                className="card p-3 text-left hover:border-accent/50 transition-colors"
              >
                <p className="text-sm font-medium text-ink truncate">{food.name}</p>
                <p className="text-[11px] text-ink-muted">
                  {food.calories} kcal • P{food.protein}g C{food.carbs}g F{food.fat}g
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Meals */}
        <section className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {MEAL_TYPES.map((meal) => {
            const mealItems = getMealItems(meal.id);
            const mealCalories = mealItems.reduce((sum, item) => sum + item.calories, 0);

            return (
              <div key={meal.id} className="card">
                <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${meal.color}`}>
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{meal.label}</p>
                      <p className="text-[11px] text-ink-muted">
                        {mealItems.length} item{mealItems.length !== 1 ? "s" : ""} • {mealCalories} kcal
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openAddModal(meal.id)}
                    className="text-ink-muted hover:text-accent"
                    aria-label={`Add to ${meal.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {mealItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-ink-muted">
                    <p className="text-sm">No items yet. Tap + to add.</p>
                  </div>
                ) : (
                  <div className="px-4 pb-4 space-y-2">
                    {mealItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-2 hover:bg-surface transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                          <p className="text-[11px] text-ink-muted">
                            {item.serving} • {item.calories} kcal • P{item.protein}g C{item.carbs}g F{item.fat}g
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editFood(item)}
                            className="text-ink-muted hover:text-accent h-8 w-8"
                            aria-label="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFood(item.id)}
                            className="text-ink-muted hover:text-danger h-8 w-8"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Add/Edit Food Modal */}
        {showAddModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={resetForm}
          >
            <div
              className="w-full sm:max-w-md bg-surface border-t sm:border border-border sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-center text-ink mb-1">
                {editingItem ? "Edit Food" : "Add Food"}
              </h2>
              <p className="text-center text-sm text-ink-muted mb-4">Track your nutrition</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink">Food Name</label>
                  <Input
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    placeholder="e.g., Chicken breast"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-ink">Calories (kcal)</label>
                    <Input
                      type="number"
                      min="0"
                      value={newFood.calories}
                      onChange={(e) => setNewFood({ ...newFood, calories: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink">Protein (g)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newFood.protein}
                      onChange={(e) => setNewFood({ ...newFood, protein: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink">Carbs (g)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newFood.carbs}
                      onChange={(e) => setNewFood({ ...newFood, carbs: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink">Fat (g)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newFood.fat}
                      onChange={(e) => setNewFood({ ...newFood, fat: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink">Serving Size</label>
                  <Input
                    value={newFood.serving}
                    onChange={(e) => setNewFood({ ...newFood, serving: e.target.value })}
                    placeholder="e.g., 100g, 1 cup"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink">Meal</label>
                  <div className="flex gap-2 mt-2">
                    {MEAL_TYPES.map((meal) => (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => setNewFood({ ...newFood, mealType: meal.id as NutritionItem["mealType"] })}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                          newFood.mealType === meal.id
                            ? "bg-ink text-bg"
                            : "bg-surface-2 text-ink-muted hover:bg-surface-2"
                        )}
                      >
                        {meal.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-full"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 rounded-full"
                  onClick={editingItem ? updateFood : addFood}
                  disabled={!newFood.name || newFood.calories <= 0}
                >
                  {editingItem ? "Save" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Nutrition;
