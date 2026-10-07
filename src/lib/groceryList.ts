import { type Recipe } from "@/lib/recipeDatabase";

export interface GroceryItem {
  id: string;
  name: string;
  category?: string;
  amount?: number;
  unit?: string;
  notes?: string;
  purchased: boolean;
  sourceRecipe?: string;
}

export interface GroceryList {
  id: string;
  name: string;
  createdAt: number;
  items: GroceryItem[];
  selectedRecipes: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export const CATEGORIES: Category[] = [
  { id: "produce", name: "Produce", icon: "🥬", order: 0 },
  { id: "meat", name: "Meat & Seafood", icon: "🍖", order: 1 },
  { id: "dairy", name: "Dairy & Eggs", icon: "🥛", order: 2 },
  { id: "pantry", name: "Pantry", icon: "🏠", order: 3 },
  { id: "frozen", name: "Frozen", icon: "🧊", order: 4 },
  { id: "bakery", name: "Bakery", icon: "🍞", order: 5 },
  { id: "beverages", name: "Beverages", icon: "🥤", order: 6 },
  { id: "snacks", name: "Snacks", icon: "🍿", order: 7 },
  { id: "spices", name: "Spices & Seasonings", icon: "🌶️", order: 8 },
  { id: "other", name: "Other", icon: "📦", order: 9 },
];

const DEFAULT_CATEGORY = {
  eggs: "dairy",
  chicken: "meat",
  beef: "meat",
  turkey: "meat",
  fish: "meat",
  tuna: "meat",
  salmon: "meat",
  rice: "pantry",
  pasta: "pantry",
  flour: "pantry",
  sugar: "pantry",
  salt: "spices",
  pepper: "spices",
  oil: "pantry",
  milk: "dairy",
  yogurt: "dairy",
  cheese: "dairy",
  butter: "dairy",
  oats: "pantry",
  nuts: "snacks",
  banana: "produce",
  apple: "produce",
  "almond milk": "beverages",
} as const;

export function inferCategory(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  for (const [keyword, cat] of Object.entries(DEFAULT_CATEGORY)) {
    if (lower.includes(keyword)) return cat;
  }
  return "other";
}

export function generateGroceryListFromRecipes(
  recipes: Recipe[],
  recipeIds: string[],
): GroceryList {
  const merged = new Map<string, GroceryItem>();

  const selectedRecipes = recipes.filter((r) => recipeIds.includes(r.id));

  for (const recipe of selectedRecipes) {
    for (const ingredient of recipe.ingredients) {
      const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
      const existing = merged.get(key);
      if (existing) {
        merged.set(key, {
          ...existing,
          amount: (existing.amount ?? 0) + ingredient.amount,
          sourceRecipe: existing.sourceRecipe
            ? `${existing.sourceRecipe}, ${recipe.name}`
            : recipe.name,
        });
      } else {
        merged.set(key, {
          id: `${recipe.id}-${ingredient.id}`,
          name: ingredient.name,
          category: inferCategory(ingredient.name),
          amount: ingredient.amount,
          unit: ingredient.unit,
          purchased: false,
          sourceRecipe: recipe.name,
        });
      }
    }
  }

  const items = Array.from(merged.values()).sort(
    (a, b) =>
      (CATEGORIES.find((c) => c.id === a.category)?.order ?? 99) -
      (CATEGORIES.find((c) => c.id === b.category)?.order ?? 99),
  );

  return {
    id: `list-${Date.now()}`,
    name: `Meal Plan ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    createdAt: Date.now(),
    items,
    selectedRecipes: recipeIds,
  };
}

export function createGroceryItem(
  partial: Omit<GroceryItem, "id" | "purchased">,
): GroceryItem {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    purchased: false,
    ...partial,
  };
}

export function togglePurchased(items: GroceryItem[], id: string): GroceryItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, purchased: !item.purchased } : item,
  );
}

export function removeItem(items: GroceryItem[], id: string): GroceryItem[] {
  return items.filter((item) => item.id !== id);
}

export function clearPurchased(items: GroceryItem[]): GroceryItem[] {
  return items.filter((item) => !item.purchased);
}

export function setAllPurchased(items: GroceryItem[], purchased: boolean): GroceryItem[] {
  return items.map((item) => ({ ...item, purchased }));
}

export function exportToText(list: GroceryList): string {
  const grouped = new Map<string, GroceryItem[]>();
  for (const cat of CATEGORIES) {
    const catItems = list.items.filter((i) => (i.category ?? "other") === cat.id);
    if (catItems.length) grouped.set(cat.name, catItems);
  }
  const otherItems = list.items.filter(
    (i) => !CATEGORIES.find((c) => c.id === (i.category ?? "other")),
  );
  if (otherItems.length) grouped.set("Other", otherItems);

  let text = `${list.name}\n${"=".repeat(list.name.length)}\n\n`;
  for (const [catName, catItems] of grouped) {
    text += `**${catName}**\n`;
    for (const item of catItems) {
      const checkbox = item.purchased ? "[x]" : "[ ]";
      text += `${checkbox} ${item.name}${item.amount ? ` (${item.amount}${item.unit ?? ""})` : ""}\n`;
    }
    text += "\n";
  }
  return text;
}

export function exportToJSON(list: GroceryList): string {
  return JSON.stringify(list, null, 2);
}
