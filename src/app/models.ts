export interface Nutrition {
  name: string;
  carbs: number;
  fat: number;
  protein: number;
}

export interface RecipeIngredient {
  name: string;
  nutrition?: Nutrition | null;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  createdAt: string;
}
