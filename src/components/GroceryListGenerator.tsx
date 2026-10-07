"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { RECIPE_DATABASE, MEAL_PLAN_TEMPLATES } from "@/lib/recipeDatabase";
import {
  generateGroceryListFromRecipes,
  createGroceryItem,
  togglePurchased,
  removeItem,
  clearPurchased,
  setAllPurchased,
  exportToText,
  exportToJSON,
  type GroceryItem,
  type GroceryList,
  CATEGORIES,
} from "@/lib/groceryList";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fursan_grocery_list";

export default function GroceryListGenerator() {
  const [list, setList] = useState<GroceryList | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("other");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "items" in parsed) {
          setList(parsed as GroceryList);
          setSelectedRecipes((parsed as GroceryList).selectedRecipes ?? []);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {
        toast.error("Could not save shopping list to localStorage");
      }
    }
  }, [list]);

  const handleSelectRecipe = (recipeId: string) => {
    setSelectedRecipes((prev) => {
      const updated = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      return updated;
    });
  };

  const handleGenerateList = () => {
    if (selectedRecipes.length === 0) {
      toast.error("Select at least one recipe");
      return;
    }
    const recipes = RECIPE_DATABASE.filter((r) => selectedRecipes.includes(r.id));
    const newList = generateGroceryListFromRecipes(recipes, selectedRecipes);
    setList(newList);
    setShowRecipeSelector(false);
    toast.success(`Generated list with ${newList.items.length} items`);
  };

  const handleToggleItem = (id: string) => {
    if (!list) return;
    setList({
      ...list,
      items: togglePurchased(list.items, id),
    });
  };

  const handleRemoveItem = (id: string) => {
    if (!list) return;
    setList({
      ...list,
      items: removeItem(list.items, id),
    });
  };

  const handleClearAll = () => {
    if (!list) return;
    setList({
      ...list,
      items: [],
    });
    toast.success("Cleared all items");
  };

  const handleExport = () => {
    if (!list) return;
    const text = exportToText(list);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported shopping list");
  };

  const handleExportJSON = () => {
    if (!list) return;
    const json = exportToJSON(list);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddCustom = () => {
    if (!newItemName.trim() || !list) return;
    const item = createGroceryItem({
      name: newItemName.trim(),
      category: newItemCategory,
      amount: undefined,
      unit: undefined,
      notes: undefined,
    });
    setList({
      ...list,
      items: [...list.items, item],
    });
    setNewItemName("");
    setNewItemCategory("other");
    setShowAddForm(false);
    toast.success("Added custom item");
  };

  const handleClearPurchased = () => {
    if (!list) return;
    setList({
      ...list,
      items: clearPurchased(list.items),
    });
    toast.success("Removed purchased items");
  };

  const groupedItems = useMemo(() => {
    if (!list) return [];
    const groups = new Map<string, GroceryItem[]>();
    for (const cat of CATEGORIES) {
      const catItems = list.items.filter((i) => (i.category ?? "other") === cat.id);
      if (catItems.length) groups.set(cat.id, catItems);
    }
    const otherItems = list.items.filter(
      (i) => !groups.has(i.category ?? "other"),
    );
    if (otherItems.length) groups.set("other", otherItems);

    return Array.from(groups.entries()).map(([catId, catItems]) => ({
      category: CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[CATEGORIES.length - 1]!,
      items: catItems,
    }));
  }, [list]);

  const completedCount = list?.items.filter((i) => i.purchased).length ?? 0;
  const totalCount = list?.items.length ?? 0;

  const generateFromMealPlan = () => {
    toast("Generating from meal plan templates...", {
      description: "Using the standard meal plan template",
    });
    const standardPlan = MEAL_PLAN_TEMPLATES.standard;
    const recipeIds = Array.from(
      new Set(standardPlan.map((slot) => slot.recipe)),
    ) as string[];
    setSelectedRecipes(recipeIds);
    const recipes = RECIPE_DATABASE.filter((r) => recipeIds.includes(r.id));
    const newList = generateGroceryListFromRecipes(recipes, recipeIds);
    setList(newList);
    setShowRecipeSelector(false);
    toast.success(`Generated list with ${newList.items.length} items from meal plan`);
  };

  return (
    <motion.div
      className="w-full space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-section font-semibold text-ink">Grocery List</h2>
          {list && (
            <p className="mt-1 text-sm text-ink-muted">
              {completedCount}/{totalCount} items checked off
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowRecipeSelector(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" />
            Add recipes
          </button>
          {list && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              Add item
            </button>
          )}
        </div>
      </div>

      <RecipeSelector
        open={showRecipeSelector}
        onClose={() => setShowRecipeSelector(false)}
        selected={selectedRecipes}
        onSelectAll={() => setSelectedRecipes(RECIPE_DATABASE.map((r) => r.id))}
        onSelectNone={() => setSelectedRecipes([])}
        onSelectRecipe={handleSelectRecipe}
        onGenerate={handleGenerateList}
        onGenerateFromMealPlan={generateFromMealPlan}
      />

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-md border border-border bg-surface-2 p-4"
          >
            <div className="space-y-3">
              <div>
                <label className="text-label uppercase text-ink-faint">Item name</label>
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Avocados"
                  className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-body text-ink placeholder:text-ink-faint"
                />
              </div>
              <div>
                <label className="text-label uppercase text-ink-faint">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-body text-ink"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="h-10 rounded-md border border-border px-4 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={!newItemName.trim()}
                  className="h-10 rounded-md bg-ink px-4 text-label uppercase text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {list && list.items.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setList({ ...list, items: setAllPurchased(list.items, true) })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-meta text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Mark all
          </button>
          <button
            type="button"
            onClick={handleClearPurchased}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-meta text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Clear bought
          </button>
        </div>
      )}

      {list && list.items.length > 0 ? (
        <div className="space-y-4">
          {groupedItems.map(({ category, items }) => (
            <div key={category.id}>
              <h3 className="text-label uppercase text-ink-faint">
                {category.icon} {category.name}
              </h3>
              <ul className="surface-group mt-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="row cursor-pointer py-2"
                      onClick={() => handleToggleItem(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItem(item.id);
                          }}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                            item.purchased
                              ? "border-ink bg-ink text-bg"
                              : "border-border hover:border-ink",
                          )}
                        >
                          {item.purchased && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <span className="flex-1">
                          <span
                            className={cn(
                              "text-body",
                              item.purchased && "line-through text-ink-muted",
                            )}
                          >
                            {item.name}
                          </span>
                          {item.amount && item.unit && (
                            <span className="ml-2 text-meta text-ink-faint">
                              {item.amount} {item.unit}
                            </span>
                          )}
                        </span>
                        {list.selectedRecipes.length > 0 && item.sourceRecipe && (
                          <span className="text-xs text-ink-faint">
                            from: {item.sourceRecipe}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item.id);
                        }}
                        aria-label={`Remove ${item.name}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-4 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Download className="h-3.5 w-3.5" />
              Export text
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-4 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Share2 className="h-3.5 w-3.5" />
              Export JSON
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-ink-faint" />
          <h3 className="text-section font-medium text-ink">No items yet</h3>
          <p className="mt-2 max-w-sm text-sm text-ink-muted">
            Add recipes to auto-generate a shopping list, or add custom items manually.
          </p>
          <button
            type="button"
            onClick={() => setShowRecipeSelector(true)}
            className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-ink px-4 text-label uppercase text-bg transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Select recipes
          </button>
        </div>
      )}
    </motion.div>
  );
}

interface RecipeSelectorProps {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectRecipe: (id: string) => void;
  onGenerate: () => void;
  onGenerateFromMealPlan: () => void;
}

function RecipeSelector({
  open,
  onClose,
  selected,
  onSelectAll,
  onSelectNone,
  onSelectRecipe,
  onGenerate,
  onGenerateFromMealPlan,
}: RecipeSelectorProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl rounded-lg border border-border bg-surface p-5 shadow-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-section font-semibold text-ink">
            Select Recipes for Shopping
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
          >
            <ChevronUp className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="h-9 flex-1 rounded-md border border-border px-3 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onGenerateFromMealPlan}
            className="h-9 flex-1 rounded-md border border-border px-3 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            From meal plan
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
          {RECIPE_DATABASE.map((recipe) => {
            const isChecked = selected.includes(recipe.id);
            return (
              <div
                key={recipe.id}
                className="rounded-md border border-border p-3 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onSelectRecipe(recipe.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-ink focus:ring-ink"
                    />
                    <div>
                      <h3 className="text-body font-medium text-ink">{recipe.name}</h3>
                      <p className="text-meta text-ink-muted">{recipe.description}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {recipe.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(recipe.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
                  >
                    {expanded[recipe.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {expanded[recipe.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ul className="mt-3 space-y-1 pl-6 text-sm">
                        {recipe.ingredients.map((ing) => (
                          <li
                            key={ing.id}
                            className="flex justify-between text-ink-muted"
                          >
                            <span>{ing.name}</span>
                            <span>
                              {ing.amount} {ing.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onSelectNone}
            className="h-10 rounded-md border border-border px-4 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={selected.length === 0}
            className="h-10 w-full rounded-md bg-ink px-4 text-label uppercase text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Generate Shopping List ({selected.length})
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
