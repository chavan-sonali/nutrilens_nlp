import { FoodItem, ParsedQuery, RecommendationResult } from '../types';
import { TfidfEngine } from './tfidf';
import { SemanticEngine } from './embeddings';
import { checkFoodMatchesFilter, DatasetQuantiles } from './nlu';

export function minMaxNormalize(arr: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
  }

  const out = new Float32Array(arr.length);
  const range = max - min;
  if (range <= 1e-9) {
    return out;
  }

  for (let i = 0; i < arr.length; i++) {
    out[i] = (arr[i] - min) / range;
  }
  return out;
}

export function generateExplanation(
  food: FoodItem,
  parsed: ParsedQuery,
  tfidfTerms: Array<{ term: string; weight: number }>,
  semanticDims: string[]
): string {
  const reasons: string[] = [];

  // 1. Numeric matches
  for (const num of parsed.numeric) {
    const val = food[num.col];
    const isPassing = num.op === '>=' ? val >= num.val : val <= num.val;
    if (isPassing) {
      const colClean = num.col.replace('_g', '').replace('_kcal', '');
      reasons.push(`${colClean} = ${val} (${num.op} ${num.val.toFixed(1)})`);
    }
  }

  // 2. Audience matches
  for (const tag of parsed.audience) {
    if (food.recommended_for.toLowerCase().includes(tag.toLowerCase())) {
      reasons.push(`recommended for ${tag}`);
    }
  }

  // 3. Nutrients
  const combinedNutrients = (food.vitamins + ', ' + food.minerals).toLowerCase();
  for (const n of parsed.nutrients) {
    if (combinedNutrients.includes(n.toLowerCase())) {
      reasons.push(`contains ${n}`);
    }
  }

  // 4. Category
  if (parsed.category && food.category === parsed.category) {
    reasons.push(`matches category ${food.category}`);
  }

  // 5. Semantic concept or TF-IDF keywords
  if (reasons.length === 0) {
    if (semanticDims.length > 0) {
      reasons.push(`semantically aligned with ${semanticDims.join(' & ')}`);
    } else if (tfidfTerms.length > 0) {
      reasons.push(`key match: "${tfidfTerms.map(t => t.term).join(', ')}"`);
    } else {
      reasons.push('high overall contextual and nutritional relevance');
    }
  }

  return reasons.join(' · ');
}

export interface RecommendOptions {
  alpha?: number; // Weight for TF-IDF vs Semantic (default 0.4)
  topK?: number;
  strictFilter?: boolean;
}

export class NutriLensRecommender {
  private foods: FoodItem[];
  private tfidf: TfidfEngine;
  private semantic: SemanticEngine;
  private quantiles: DatasetQuantiles;

  constructor(
    foods: FoodItem[],
    tfidf: TfidfEngine,
    semantic: SemanticEngine,
    quantiles: DatasetQuantiles
  ) {
    this.foods = foods;
    this.tfidf = tfidf;
    this.semantic = semantic;
    this.quantiles = quantiles;
  }

  public recommend(
    query: string,
    parsed: ParsedQuery,
    options: RecommendOptions = {}
  ): RecommendationResult[] {
    const alpha = options.alpha ?? 0.4;
    const topK = options.topK ?? 6;
    const strict = options.strictFilter ?? false;

    // Get raw scores
    const rawTfidf = this.tfidf.scoreQuery(query);
    const rawSemantic = this.semantic.scoreQuery(query);

    const normTfidf = minMaxNormalize(rawTfidf);
    const normSemantic = minMaxNormalize(rawSemantic);

    const hasStructuredFilters =
      parsed.numeric.length > 0 ||
      parsed.audience.length > 0 ||
      parsed.nutrients.length > 0 ||
      parsed.category !== null;

    const scoredItems: RecommendationResult[] = [];

    for (let i = 0; i < this.foods.length; i++) {
      const food = this.foods[i];
      const tfidfScore = normTfidf[i];
      const semanticScore = normSemantic[i];

      const hybridScore = alpha * tfidfScore + (1 - alpha) * semanticScore;
      const matchesFilter = checkFoodMatchesFilter(food, parsed);

      if (strict && hasStructuredFilters && !matchesFilter) {
        continue;
      }

      // Soft boost if filter matches (+0.5 boost as specified in Step 7)
      const boost = hasStructuredFilters && matchesFilter ? 0.5 : 0.0;
      const totalScore = hybridScore + boost;

      const topTfidf = this.tfidf.getMatchedTerms(query, i, 2);
      const topSemantic = this.semantic.getTopDimensions(query, i, 2);
      const why = generateExplanation(food, parsed, topTfidf, topSemantic);

      scoredItems.push({
        food,
        score: totalScore,
        tfidfScore,
        semanticScore,
        nluMatch: matchesFilter,
        why,
      });
    }

    // Rank descending
    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.slice(0, topK);
  }
}
