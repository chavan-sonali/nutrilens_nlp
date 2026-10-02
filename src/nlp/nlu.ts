import { FoodItem, FoodCategory, ParsedQuery } from '../types';

export interface DatasetQuantiles {
  protein_g: { q25: number; q75: number };
  calories_kcal: { q25: number; q75: number };
  fat_g: { q25: number; q75: number };
  fiber_g: { q25: number; q75: number };
  carbohydrates_g: { q25: number; q75: number };
}

/**
 * Computes 25th and 75th percentiles for nutrient columns from the dataset
 */
export function calculateDatasetQuantiles(foods: FoodItem[]): DatasetQuantiles {
  const getQuantile = (arr: number[], q: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  const getNutrientQuantiles = (key: keyof FoodItem) => {
    const vals = foods.map(f => Number(f[key]));
    return {
      q25: parseFloat(getQuantile(vals, 0.25).toFixed(1)),
      q75: parseFloat(getQuantile(vals, 0.75).toFixed(1)),
    };
  };

  return {
    protein_g: getNutrientQuantiles('protein_g'),
    calories_kcal: getNutrientQuantiles('calories_kcal'),
    fat_g: getNutrientQuantiles('fat_g'),
    fiber_g: getNutrientQuantiles('fiber_g'),
    carbohydrates_g: getNutrientQuantiles('carbohydrates_g'),
  };
}

export const AUDIENCE_PATTERNS: Record<string, RegExp> = {
  'Diabetic Patients': /diabet|blood sugar|sugar patient/i,
  'Weight Loss': /weight loss|lose weight|diet|slim|slimming|calorie deficit/i,
  'Fitness Enthusiasts': /gym|workout|bodybuild|fitness|muscle/i,
  'Athletes': /athlet|sport|endurance|marathon|runner/i,
  'Heart Patients': /heart|cardiac|cholesterol|blood pressure|hypertension/i,
  'Vegetarians': /\bveg\b|vegetarian/i,
  'Vegans': /vegan|plant[- ]based/i,
  'Pregnant Women': /pregnan|maternal|prenatal/i,
  'Children': /child|kid|toddler|growth/i,
  'Elderly': /elder|senior|old age|aging/i,
};

export const NUTRIENT_LIST = [
  'vitamin c', 'vitamin a', 'vitamin d', 'vitamin k', 'vitamin e',
  'vitamin b12', 'vitamin b6', 'folate', 'iron', 'calcium', 'potassium',
  'magnesium', 'zinc', 'selenium', 'phosphorus', 'iodine', 'copper', 'omega-3'
];

export const CATEGORIES: FoodCategory[] = [
  'Vegetable', 'Fruit', 'Grain', 'Pulse', 'Dairy', 'Nut & Seed',
  'Seafood', 'Spice', 'Beverage', 'Meat', 'Egg', 'Herb'
];

/**
 * Parses a free-text user query into structured nutritional and audience constraints
 */
export function parseQuery(rawQuery: string, quantiles: DatasetQuantiles): ParsedQuery {
  const q = rawQuery.toLowerCase().trim();
  const parsed: ParsedQuery = {
    raw: rawQuery,
    numeric: [],
    audience: [],
    nutrients: [],
    category: null,
  };

  if (!q) return parsed;

  // 1. Numeric nutrient constraints via dataset quantiles
  if (/high[- ]protein|protein[- ]rich|rich in protein|lots of protein|more protein/i.test(q)) {
    parsed.numeric.push({
      col: 'protein_g',
      op: '>=',
      val: quantiles.protein_g.q75,
      label: `protein ≥ ${quantiles.protein_g.q75}g`,
    });
  }

  if (/low[- ]cal|light|fewer calories|low calorie|burn fat/i.test(q)) {
    parsed.numeric.push({
      col: 'calories_kcal',
      op: '<=',
      val: quantiles.calories_kcal.q25,
      label: `calories ≤ ${quantiles.calories_kcal.q25} kcal`,
    });
  }

  if (/low[- ]fat|fat free|non-fat|least fat/i.test(q)) {
    parsed.numeric.push({
      col: 'fat_g',
      op: '<=',
      val: quantiles.fat_g.q25,
      label: `fat ≤ ${quantiles.fat_g.q25}g`,
    });
  }

  if (/high[- ]fi(b|be)r|fi(b|be)r[- ]rich|rich in fi(b|be)r|more fiber/i.test(q)) {
    parsed.numeric.push({
      col: 'fiber_g',
      op: '>=',
      val: quantiles.fiber_g.q75,
      label: `fiber ≥ ${quantiles.fiber_g.q75}g`,
    });
  }

  if (/low[- ]carb|keto|low carbohydrate|cut carbs/i.test(q)) {
    parsed.numeric.push({
      col: 'carbohydrates_g',
      op: '<=',
      val: quantiles.carbohydrates_g.q25,
      label: `carbs ≤ ${quantiles.carbohydrates_g.q25}g`,
    });
  }

  // 2. Audience target detection
  for (const [tag, pattern] of Object.entries(AUDIENCE_PATTERNS)) {
    if (pattern.test(q)) {
      parsed.audience.push(tag);
    }
  }

  // 3. Vitamins & Minerals mention
  for (const n of NUTRIENT_LIST) {
    if (q.includes(n)) {
      parsed.nutrients.push(n);
    }
  }

  // 4. Food Category detection
  for (const cat of CATEGORIES) {
    const root = cat.toLowerCase().split(' ')[0].replace('&', '');
    if (new RegExp(`\\b${root}s?\\b`, 'i').test(q)) {
      parsed.category = cat;
      break;
    }
  }

  return parsed;
}

/**
 * Checks if a specific food satisfies the parsed structured constraints
 */
export function checkFoodMatchesFilter(food: FoodItem, parsed: ParsedQuery): boolean {
  if (parsed.numeric.length === 0 && parsed.audience.length === 0 && parsed.nutrients.length === 0 && !parsed.category) {
    return true;
  }

  // Check numeric bounds
  for (const num of parsed.numeric) {
    const val = food[num.col];
    if (num.op === '>=' && val < num.val) return false;
    if (num.op === '<=' && val > num.val) return false;
  }

  // Check audience tags
  for (const tag of parsed.audience) {
    if (!food.recommended_for.toLowerCase().includes(tag.toLowerCase())) {
      return false;
    }
  }

  // Check nutrients
  const combinedNutrients = (food.vitamins + ' ' + food.minerals).toLowerCase();
  for (const n of parsed.nutrients) {
    if (!combinedNutrients.includes(n.toLowerCase())) {
      return false;
    }
  }

  // Check category
  if (parsed.category && food.category !== parsed.category) {
    return false;
  }

  return true;
}
