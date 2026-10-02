import { FoodItem } from '../types';

// Standard English stop words
export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d',
  'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Common nutritional filler words that don't discriminate
  'also', 'delivers', 'provides', 'contains', 'known', 'making', 'including', 'used'
]);

// Morphological lemmatization dictionary & rules
const IRREGULAR_LEMMAS: Record<string, string> = {
  apples: 'apple',
  bananas: 'banana',
  berries: 'berry',
  blueberries: 'blueberry',
  strawberries: 'strawberry',
  leaves: 'leaf',
  veggies: 'vegetable',
  vegetables: 'vegetable',
  fruits: 'fruit',
  grains: 'grain',
  beans: 'bean',
  seeds: 'seed',
  nuts: 'nut',
  fishes: 'fish',
  spices: 'spice',
  herbs: 'herb',
  calories: 'calorie',
  proteins: 'protein',
  carbs: 'carbohydrate',
  carbohydrates: 'carbohydrate',
  fats: 'fat',
  fibers: 'fiber',
  fibres: 'fiber',
  vitamins: 'vitamin',
  minerals: 'mineral',
  patients: 'patient',
  diabetics: 'diabetic',
  supports: 'support',
  reduces: 'reduce',
  improves: 'improve',
  enhances: 'enhance',
  regulates: 'regulate',
  lowers: 'lower',
  promotes: 'promote',
  aids: 'aid',
  helps: 'help',
  boosting: 'boost',
  boosts: 'boost',
  protects: 'protect',
  strengthens: 'strengthen',
  acts: 'act',
  maintains: 'maintain',
  curbs: 'curb',
  supplies: 'supply',
  rich: 'rich',
  higher: 'high',
  eating: 'eat',
  eaten: 'eat',
  drank: 'drink',
  drinking: 'drink'
};

/**
 * Lemmatizes a token applying domain-specific irregular mapping + regular English inflections
 */
export function lemmatizeToken(token: string): string {
  const lower = token.toLowerCase();
  if (IRREGULAR_LEMMAS[lower]) return IRREGULAR_LEMMAS[lower];

  // Plural -> singular rules
  if (lower.endsWith('ies') && lower.length > 4) {
    return lower.slice(0, -3) + 'y';
  }
  if (lower.endsWith('ves') && lower.length > 4) {
    return lower.slice(0, -3) + 'f';
  }
  if (lower.endsWith('ses') || lower.endsWith('xes') || lower.endsWith('shes') || lower.endsWith('ches')) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) {
    return lower.slice(0, -1);
  }

  // Verb endings
  if (lower.endsWith('ing') && lower.length > 5) {
    return lower.slice(0, -3);
  }
  if (lower.endsWith('ed') && lower.length > 4) {
    return lower.slice(0, -2);
  }

  return lower;
}

/**
 * Tokenizes, removes punctuation, filters stopwords, and lemmatizes tokens
 */
export function preprocessText(
  text: string,
  options: { removeStopwords?: boolean; lemmatize?: boolean } = {}
): string[] {
  const { removeStopwords = true, lemmatize = true } = options;
  if (!text) return [];

  // Lowercase and extract alphabetic sequences
  const rawTokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(t => t.length > 1 && !/^\d+$/.test(t));

  const processed: string[] = [];
  for (const token of rawTokens) {
    if (removeStopwords && STOP_WORDS.has(token)) {
      continue;
    }
    const lemma = lemmatize ? lemmatizeToken(token) : token;
    if (lemma.length > 1) {
      processed.push(lemma);
    }
  }

  return processed;
}

/**
 * Builds rich combined text for a food item matching the specification:
 * food_name + ". " + category + ". " + description + " " + health_benefits +
 * " Vitamins: " + vitamins + ". Minerals: " + minerals + ". Good for: " + recommended_for + "."
 */
export function buildFoodDocument(food: FoodItem): string {
  // Clean small data quirk: folate is a vitamin, remove from minerals if it appears
  const cleanMinerals = food.minerals.replace(/\bFolate\b,?\s*/gi, '').replace(/^,\s*|,\s*$/g, '');

  return `${food.food_name}. ${food.category}. ${food.description} ${food.health_benefits} Vitamins: ${food.vitamins}. Minerals: ${cleanMinerals}. Good for: ${food.recommended_for}.`;
}

/**
 * Category leakage words used for leakage ablation experiments
 */
export const LEAK_WORDS_REGEX = /\b(fruit|fruits|vegetable|vegetables|grain|grains|pulse|pulses|legume|legumes|dairy|nut|nuts|seed|seeds|seafood|fish|fishes|spice|spices|beverage|beverages|drink|meat|meats|egg|eggs|herb|herbs)\b/gi;

export function stripCategoryLeakage(text: string): string {
  return text.replace(LEAK_WORDS_REGEX, ' ');
}
