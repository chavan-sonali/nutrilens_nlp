import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowUpDown,
  Filter,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Zap
} from 'lucide-react';
import { FoodItem, ParsedQuery, RecommendationResult, FoodCategory } from '../types';
import { DatasetQuantiles, CATEGORIES } from '../nlp/nlu';

export type NutrientSortOption =
  | 'relevance'
  | 'protein_desc'
  | 'protein_asc'
  | 'calories_desc'
  | 'calories_asc'
  | 'fiber_desc'
  | 'fiber_asc'
  | 'carbs_asc'
  | 'carbs_desc'
  | 'fat_asc'
  | 'fat_desc';

interface SearchTabProps {
  query: string;
  setQuery: (q: string) => void;
  parsedQuery: ParsedQuery;
  results: RecommendationResult[];
  alpha: number;
  setAlpha: (a: number) => void;
  topK: number;
  setTopK: (k: number) => void;
  strictFilter: boolean;
  setStrictFilter: (s: boolean) => void;
  quantiles: DatasetQuantiles;
  totalFoodsCount: number;
  allFoods: FoodItem[];
}

const SAMPLE_QUERIES = [
  "high protein vegetarian food for weight loss",
  "what can a diabetic person eat?",
  "rich in vitamin C and low calorie",
  "something good for gut health",
  "calcium rich dairy",
  "pre-workout energy snack",
  "iron rich food for energy",
  "low carb snack for gym workout"
];

const CATEGORY_COLORS: Record<FoodCategory, { bg: string; text: string; border: string }> = {
  Vegetable: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  Fruit: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Grain: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  Pulse: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  Dairy: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Nut & Seed': { bg: 'bg-amber-100/60', text: 'text-amber-900', border: 'border-amber-300' },
  Seafood: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  Spice: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  Beverage: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  Meat: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  Egg: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  Herb: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' }
};

export const SearchTab: React.FC<SearchTabProps> = ({
  query,
  setQuery,
  parsedQuery,
  results,
  alpha,
  setAlpha,
  topK,
  setTopK,
  strictFilter,
  setStrictFilter,
  quantiles,
  totalFoodsCount,
  allFoods,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  // Nutrient sorting state
  const [sortBy, setSortBy] = useState<NutrientSortOption>('relevance');
  const [sortScope, setSortScope] = useState<'results' | 'all'>('results');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const toggleExpand = (id: number) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  const hasParsedConstraints =
    parsedQuery.numeric.length > 0 ||
    parsedQuery.audience.length > 0 ||
    parsedQuery.nutrients.length > 0 ||
    parsedQuery.category !== null;

  // Compute final display list based on sorting and scope
  const displayItems = useMemo(() => {
    let baseList: RecommendationResult[] = [];

    if (sortScope === 'all') {
      // Explore all 100 foods
      baseList = allFoods.map(food => {
        // Find if it was in search results to keep match score if available
        const existing = results.find(r => r.food.food_id === food.food_id);
        return {
          food,
          score: existing ? existing.score : 0.5,
          tfidfScore: existing ? existing.tfidfScore : 0,
          semanticScore: existing ? existing.semanticScore : 0,
          nluMatch: existing ? existing.nluMatch : true,
          why: existing ? existing.why : `Nutritional profile: ${food.protein_g}g protein · ${food.calories_kcal} kcal · ${food.fiber_g}g fiber`,
        };
      });
    } else {
      baseList = [...results];
    }

    // Apply category filter if selected
    if (filterCategory !== 'All') {
      baseList = baseList.filter(item => item.food.category === filterCategory);
    }

    // Apply nutrient sorting
    const sorted = [...baseList];

    switch (sortBy) {
      case 'protein_desc':
        sorted.sort((a, b) => b.food.protein_g - a.food.protein_g);
        break;
      case 'protein_asc':
        sorted.sort((a, b) => a.food.protein_g - b.food.protein_g);
        break;
      case 'calories_desc':
        sorted.sort((a, b) => b.food.calories_kcal - a.food.calories_kcal);
        break;
      case 'calories_asc':
        sorted.sort((a, b) => a.food.calories_kcal - b.food.calories_kcal);
        break;
      case 'fiber_desc':
        sorted.sort((a, b) => b.food.fiber_g - a.food.fiber_g);
        break;
      case 'fiber_asc':
        sorted.sort((a, b) => a.food.fiber_g - b.food.fiber_g);
        break;
      case 'carbs_asc':
        sorted.sort((a, b) => a.food.carbohydrates_g - b.food.carbohydrates_g);
        break;
      case 'carbs_desc':
        sorted.sort((a, b) => b.food.carbohydrates_g - a.food.carbohydrates_g);
        break;
      case 'fat_asc':
        sorted.sort((a, b) => a.food.fat_g - b.food.fat_g);
        break;
      case 'fat_desc':
        sorted.sort((a, b) => b.food.fat_g - a.food.fat_g);
        break;
      case 'relevance':
      default:
        // Keep NLP search relevance order
        break;
    }

    return sorted;
  }, [results, allFoods, sortBy, sortScope, filterCategory]);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner & Search Bar */}
      <div className="text-center pt-4 sm:pt-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#064E3B] tracking-tight font-['Poppins']">
            What do you want to eat today?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Ask in plain English or rank foods directly by their nutritional values like protein, calories, fiber, or carbs.
          </p>
        </motion.div>

        {/* Input box with micro-interaction */}
        <div className="mt-6 sm:mt-8 relative max-w-3xl mx-auto">
          <motion.div
            whileFocus={{ scale: 1.01 }}
            className="relative flex items-center shadow-lg shadow-emerald-900/5 rounded-2xl border-2 border-emerald-500/30 bg-white focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all overflow-hidden"
          >
            <div className="pl-4 sm:pl-5 text-emerald-600">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (sortScope === 'all') setSortScope('results');
              }}
              placeholder="e.g. high protein vegetarian food for weight loss"
              className="w-full py-4 px-3 sm:px-4 text-sm sm:text-base text-gray-800 placeholder-gray-400 focus:outline-hidden bg-transparent"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="px-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowConfig(!showConfig)}
              className={`mr-2 p-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                showConfig
                  ? 'bg-emerald-100 text-emerald-800 shadow-inner'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Tune Retrieval Engine"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Engine Settings</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Sample Query Suggestions with micro-bounce */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
            Try:
          </span>
          {SAMPLE_QUERIES.map((sample, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setQuery(sample);
                setSortScope('results');
                setSortBy('relevance');
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 border border-emerald-100 text-emerald-800 transition-all hover:border-emerald-300 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              {sample}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Engine Settings Drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto px-4"
          >
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-200 shadow-md shadow-emerald-900/5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600 mr-1.5" />
                  NutriLens Retrieval & NLU Parameters
                </h3>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-mono">
                  {totalFoodsCount} Foods Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
                {/* Alpha slider */}
                <div className="space-y-2">
                  <div className="flex justify-between font-medium text-gray-700">
                    <span>Hybrid Balance (α): <strong className="text-emerald-800 font-mono">{alpha.toFixed(2)}</strong></span>
                    <span className="text-gray-500">
                      {alpha > 0.5 ? `${Math.round(alpha * 100)}% TF-IDF` : `${Math.round((1 - alpha) * 100)}% Semantic`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>0.0 (Pure Semantic Dense)</span>
                    <span className="font-semibold text-emerald-700">0.40 (Recommended)</span>
                    <span>1.0 (Pure TF-IDF Lexical)</span>
                  </div>
                </div>

                {/* Top-K slider */}
                <div className="space-y-2">
                  <div className="flex justify-between font-medium text-gray-700">
                    <span>Results Count (k): <strong className="text-emerald-800 font-mono">{topK}</strong></span>
                    <span className="text-gray-500">Ranked outputs</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="1"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>3 items</span>
                    <span>6 items</span>
                    <span>12 items</span>
                  </div>
                </div>
              </div>

              {/* Filtering strategy toggle */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-700">Filter Strategy:</span>
                  <button
                    onClick={() => setStrictFilter(false)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      !strictFilter
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Soft Boost (+0.50 score)
                  </button>
                  <button
                    onClick={() => setStrictFilter(true)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      strictFilter
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Strict (Must Match 100%)
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  Soft boost guarantees continuous recommendations even if a food slightly misses a single threshold.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Query Understanding Layer (Parsed Chips) */}
      {query && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4"
        >
          <div className="bg-white/90 backdrop-blur rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-xs flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#064E3B] uppercase tracking-wider flex items-center mr-1">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
              Understood as:
            </span>

            {/* Numeric constraints */}
            {parsedQuery.numeric.map((num, i) => (
              <motion.span
                key={`num-${i}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono-num"
              >
                {num.label}
              </motion.span>
            ))}

            {/* Audience tags */}
            {parsedQuery.audience.map((aud, i) => (
              <motion.span
                key={`aud-${i}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200"
              >
                👥 {aud}
              </motion.span>
            ))}

            {/* Nutrients */}
            {parsedQuery.nutrients.map((nut, i) => (
              <motion.span
                key={`nut-${i}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-900 border border-purple-200 capitalize"
              >
                🧪 {nut}
              </motion.span>
            ))}

            {/* Category */}
            {parsedQuery.category && (
              <motion.span
                key="cat"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200"
              >
                📂 {parsedQuery.category}
              </motion.span>
            )}

            {!hasParsedConstraints && (
              <span className="text-xs text-gray-500 italic">
                Broad semantic query (mapping dense conceptual vectors without rigid numerical filters)
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* NUTRIENT VALUE SORTING & RANKING TOOLBAR */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-sm shadow-emerald-900/5 space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ArrowUpDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-['Poppins']">
                  Nutrient Value Ranking & Sorting
                </h3>
                <p className="text-xs text-gray-500">
                  List foods ordered from high-to-low or low-to-high by any nutrient content
                </p>
              </div>
            </div>

            {/* Scope toggle: Current search results vs All 100 foods */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-500 font-medium">Scope:</span>
              <div className="bg-gray-100 p-0.5 rounded-xl flex">
                <button
                  onClick={() => setSortScope('results')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    sortScope === 'results'
                      ? 'bg-white text-emerald-900 font-bold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Search Matches ({results.length})
                </button>
                <button
                  onClick={() => setSortScope('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    sortScope === 'all'
                      ? 'bg-white text-emerald-900 font-bold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Database ({allFoods.length} Foods)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Nutrient Sorting Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-gray-500 flex items-center mr-1">
              Quick Sort:
            </span>

            {/* Protein: High to Low */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSortBy(sortBy === 'protein_desc' ? 'relevance' : 'protein_desc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                sortBy === 'protein_desc'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Protein (High → Low)</span>
              {sortBy === 'protein_desc' && <span className="text-[10px] bg-emerald-800 px-1.5 py-0.2 rounded-full">Active</span>}
            </motion.button>

            {/* Calories: Low to High */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSortBy(sortBy === 'calories_asc' ? 'relevance' : 'calories_asc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                sortBy === 'calories_asc'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Calories (Low → High / Light)</span>
              {sortBy === 'calories_asc' && <span className="text-[10px] bg-emerald-800 px-1.5 py-0.2 rounded-full">Active</span>}
            </motion.button>

            {/* Fiber: High to Low */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSortBy(sortBy === 'fiber_desc' ? 'relevance' : 'fiber_desc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                sortBy === 'fiber_desc'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Wheat className="w-3.5 h-3.5" />
              <span>Fiber (High → Low)</span>
              {sortBy === 'fiber_desc' && <span className="text-[10px] bg-emerald-800 px-1.5 py-0.2 rounded-full">Active</span>}
            </motion.button>

            {/* Carbs: Low to High */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSortBy(sortBy === 'carbs_asc' ? 'relevance' : 'carbs_asc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                sortBy === 'carbs_asc'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Carbs (Low → High / Keto)</span>
              {sortBy === 'carbs_asc' && <span className="text-[10px] bg-emerald-800 px-1.5 py-0.2 rounded-full">Active</span>}
            </motion.button>

            {/* Fat: Low to High */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSortBy(sortBy === 'fat_asc' ? 'relevance' : 'fat_asc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                sortBy === 'fat_asc'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>Fat (Low → High)</span>
              {sortBy === 'fat_asc' && <span className="text-[10px] bg-emerald-800 px-1.5 py-0.2 rounded-full">Active</span>}
            </motion.button>

            {/* Reset to relevance */}
            {sortBy !== 'relevance' && (
              <button
                onClick={() => setSortBy('relevance')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
              >
                Reset to Match Score
              </button>
            )}
          </div>

          {/* Granular Dropdown & Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-medium">All Sort Options:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as NutrientSortOption)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="relevance">⭐ NLP Relevance Score (Default)</option>
                <option value="protein_desc">🥩 Protein: Highest to Lowest</option>
                <option value="protein_asc">🥩 Protein: Lowest to Highest</option>
                <option value="calories_desc">🔥 Calories: Highest to Lowest</option>
                <option value="calories_asc">🥗 Calories: Lowest to Highest (Light)</option>
                <option value="fiber_desc">🌾 Fiber: Highest to Lowest</option>
                <option value="fiber_asc">🌾 Fiber: Lowest to Highest</option>
                <option value="carbs_asc">🥑 Carbs: Lowest to Highest (Keto)</option>
                <option value="carbs_desc">⚡ Carbs: Highest to Lowest (Energy)</option>
                <option value="fat_asc">💧 Fat: Lowest to Highest (Lean)</option>
                <option value="fat_desc">🥜 Fat: Highest to Lowest</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 font-medium">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="All">All Categories ({allFoods.length})</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section (Responsive max-w-8xl Grid) */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-['Poppins']">
              {sortScope === 'all' ? 'Nutrient-Ranked Catalog' : 'Recommended Foods'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
              Showing {displayItems.length} Foods
            </span>
          </div>

          <div className="text-xs text-gray-500 flex items-center space-x-2">
            <span>Ordered by:</span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {sortBy === 'protein_desc' && '🥩 Protein: High to Low'}
              {sortBy === 'protein_asc' && '🥩 Protein: Low to High'}
              {sortBy === 'calories_asc' && '🥗 Calories: Low to High'}
              {sortBy === 'calories_desc' && '🔥 Calories: High to Low'}
              {sortBy === 'fiber_desc' && '🌾 Fiber: High to Low'}
              {sortBy === 'fiber_asc' && '🌾 Fiber: Low to High'}
              {sortBy === 'carbs_asc' && '🥑 Carbs: Low to High'}
              {sortBy === 'carbs_desc' && '⚡ Carbs: High to Low'}
              {sortBy === 'fat_asc' && '💧 Fat: Low to High'}
              {sortBy === 'fat_desc' && '🥜 Fat: High to Low'}
              {sortBy === 'relevance' && '⭐ NLP Match Relevance'}
            </span>
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">
              No foods match your selected filter. Try choosing "All Categories" or resetting your sort order.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5 sm:gap-6">
            {displayItems.map((item, index) => {
              const { food, score, tfidfScore, semanticScore, nluMatch, why } = item;
              const catColor = CATEGORY_COLORS[food.category] || CATEGORY_COLORS.Vegetable;
              const isExpanded = expandedCardId === food.food_id;

              const isProteinSorted = sortBy === 'protein_desc' || sortBy === 'protein_asc';
              const isCaloriesSorted = sortBy === 'calories_desc' || sortBy === 'calories_asc';
              const isFiberSorted = sortBy === 'fiber_desc' || sortBy === 'fiber_asc';
              const isCarbsSorted = sortBy === 'carbs_desc' || sortBy === 'carbs_asc';
              const isFatSorted = sortBy === 'fat_desc' || sortBy === 'fat_asc';

              return (
                <motion.div
                  key={food.food_id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(0.3, index * 0.03) }}
                  whileHover={{ y: -4 }}
                  className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                    isProteinSorted && index === 0
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border-emerald-100/90 shadow-md shadow-emerald-950/5 hover:shadow-xl hover:border-emerald-300'
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Row: Name, Rank & Category */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${
                            index < 3 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}>
                            {index + 1}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-[#064E3B] font-['Poppins'] line-clamp-1">
                            {food.food_name}
                          </h3>
                        </div>
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                          {food.category}
                        </span>
                      </div>

                      {/* Rank / Value Highlight Badge */}
                      <div className="text-right shrink-0">
                        {isProteinSorted && (
                          <div className="text-xs font-bold text-emerald-900 font-mono-num bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                            🥩 {food.protein_g}g Protein
                          </div>
                        )}
                        {isCaloriesSorted && (
                          <div className="text-xs font-bold text-amber-900 font-mono-num bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs">
                            🔥 {food.calories_kcal} kcal
                          </div>
                        )}
                        {isFiberSorted && (
                          <div className="text-xs font-bold text-amber-950 font-mono-num bg-yellow-100 px-2.5 py-1 rounded-xl border border-yellow-300 shadow-2xs">
                            🌾 {food.fiber_g}g Fiber
                          </div>
                        )}
                        {isCarbsSorted && (
                          <div className="text-xs font-bold text-teal-900 font-mono-num bg-teal-100 px-2.5 py-1 rounded-xl border border-teal-300 shadow-2xs">
                            🥑 {food.carbohydrates_g}g Carbs
                          </div>
                        )}
                        {isFatSorted && (
                          <div className="text-xs font-bold text-blue-900 font-mono-num bg-blue-100 px-2.5 py-1 rounded-xl border border-blue-300 shadow-2xs">
                            💧 {food.fat_g}g Fat
                          </div>
                        )}
                        {sortBy === 'relevance' && (
                          <div className="text-xs font-bold text-emerald-800 font-mono-num bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                            {(score * 100).toFixed(0)}% Match
                          </div>
                        )}
                        {nluMatch && hasParsedConstraints && sortBy === 'relevance' && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                            ✓ Matched NLU
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Monospace Nutrition Facts Grid with sorted nutrient highlighted */}
                    <div className="bg-gray-50/90 rounded-2xl p-2.5 sm:p-3 border border-gray-100 font-mono-num text-xs text-gray-700 grid grid-cols-4 gap-1 text-center">
                      <div className={`rounded-xl p-1 transition-all ${
                        isCaloriesSorted ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-xs' : 'hover:bg-white'
                      }`}>
                        <div className="text-[10px] text-gray-400 uppercase">Cals</div>
                        <div className="font-bold">{food.calories_kcal}</div>
                      </div>

                      <div className={`rounded-xl p-1 transition-all ${
                        isProteinSorted ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300 shadow-xs' : 'hover:bg-white'
                      }`}>
                        <div className="text-[10px] text-gray-400 uppercase">Protein</div>
                        <div className="font-bold text-emerald-700">{food.protein_g}g</div>
                      </div>

                      <div className={`rounded-xl p-1 transition-all ${
                        isCarbsSorted ? 'bg-teal-100 text-teal-950 font-bold border border-teal-300 shadow-xs' : 'hover:bg-white'
                      }`}>
                        <div className="text-[10px] text-gray-400 uppercase">Carbs</div>
                        <div className="font-semibold">{food.carbohydrates_g}g</div>
                      </div>

                      <div className={`rounded-xl p-1 transition-all ${
                        isFiberSorted ? 'bg-yellow-100 text-yellow-950 font-bold border border-yellow-300 shadow-xs' : 'hover:bg-white'
                      }`}>
                        <div className="text-[10px] text-gray-400 uppercase">Fiber</div>
                        <div className="font-semibold text-amber-700">{food.fiber_g}g</div>
                      </div>
                    </div>

                    {/* Why this food explanation */}
                    <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100/70 text-xs">
                      <div className="flex items-start space-x-1.5 text-emerald-950">
                        <span className="text-amber-500 font-bold shrink-0">💡 Why:</span>
                        <span className="text-gray-700 leading-snug line-clamp-3">{why}</span>
                      </div>
                    </div>

                    {/* Similarity Breakdown Bar */}
                    {sortBy === 'relevance' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>TF-IDF: {(tfidfScore * 100).toFixed(0)}%</span>
                          <span>Semantic: {(semanticScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${Math.min(100, tfidfScore * 100 * alpha)}%` }}
                            title="TF-IDF Contribution"
                          />
                          <div
                            className="bg-teal-400 h-full transition-all"
                            style={{ width: `${Math.min(100, semanticScore * 100 * (1 - alpha))}%` }}
                            title="Semantic Contribution"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expandable Details Footer */}
                  <div className="border-t border-gray-100 bg-gray-50/60">
                    <button
                      onClick={() => toggleExpand(food.food_id)}
                      className="w-full px-5 py-3 text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center justify-between hover:bg-emerald-50/50 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Nutrition Details' : 'View Nutrition Details & Science'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-5 pb-5 pt-1 space-y-3 text-xs text-gray-600 border-t border-gray-100 overflow-hidden"
                        >
                          <div>
                            <strong className="text-gray-900">Serving Size:</strong> {food.serving_size}
                          </div>
                          <div>
                            <strong className="text-gray-900">Description:</strong>
                            <p className="mt-0.5 leading-relaxed text-gray-700">{food.description}</p>
                          </div>
                          <div>
                            <strong className="text-gray-900">Health Benefits:</strong>
                            <p className="mt-0.5 leading-relaxed text-emerald-900">{food.health_benefits}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-white p-2 rounded-xl border border-gray-100">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Vitamins</span>
                              <span className="text-gray-800">{food.vitamins}</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-gray-100">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Minerals</span>
                              <span className="text-gray-800">{food.minerals}</span>
                            </div>
                          </div>
                          <div>
                            <strong className="text-gray-900">Recommended For:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {food.recommended_for.split(',').map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-medium border border-amber-200"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
