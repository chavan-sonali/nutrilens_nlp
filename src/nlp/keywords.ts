import { FoodItem, FoodCategory } from '../types';
import { TfidfEngine } from './tfidf';
import { CATEGORIES } from './nlu';

export interface CategoryKeywords {
  category: FoodCategory;
  count: number;
  topTerms: Array<{ term: string; score: number }>;
}

export function extractAllCategoryKeywords(foods: FoodItem[], tfidf: TfidfEngine): CategoryKeywords[] {
  const results: CategoryKeywords[] = [];

  for (const cat of CATEGORIES) {
    const docIndices: number[] = [];
    for (let i = 0; i < foods.length; i++) {
      if (foods[i].category === cat) {
        docIndices.push(i);
      }
    }

    if (docIndices.length > 0) {
      const topTerms = tfidf.getTopKeywordsForDocs(docIndices, 10);
      results.push({
        category: cat,
        count: docIndices.length,
        topTerms,
      });
    }
  }

  return results;
}
