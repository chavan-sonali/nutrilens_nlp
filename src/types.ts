export interface FoodItem {
  food_id: number;
  food_name: string;
  category: FoodCategory;
  description: string;
  serving_size: string;
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
  fiber_g: number;
  vitamins: string;
  minerals: string;
  health_benefits: string;
  recommended_for: string;
}

export type FoodCategory =
  | 'Vegetable'
  | 'Fruit'
  | 'Grain'
  | 'Pulse'
  | 'Dairy'
  | 'Nut & Seed'
  | 'Seafood'
  | 'Spice'
  | 'Beverage'
  | 'Meat'
  | 'Egg'
  | 'Herb';

export interface ParsedQuery {
  raw: string;
  numeric: Array<{
    col: 'protein_g' | 'calories_kcal' | 'fat_g' | 'fiber_g' | 'carbohydrates_g';
    op: '>=' | '<=';
    val: number;
    label: string;
  }>;
  audience: string[];
  nutrients: string[];
  category: FoodCategory | null;
}

export interface RecommendationResult {
  food: FoodItem;
  score: number;
  tfidfScore: number;
  semanticScore: number;
  nluMatch: boolean;
  why: string;
}

export interface EvalMetric {
  precisionAt5: number;
  recallAt10: number;
  mrr: number;
  ndcgAt5: number;
}

export interface EvalQuery {
  id: number;
  query: string;
  type: 'numeric' | 'audience' | 'nutrient' | 'semantic' | 'category' | 'hybrid';
  expectedTags?: string[];
  relevantFilter: (food: FoodItem) => boolean;
}
