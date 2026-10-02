import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpDown,
  Dumbbell,
  Flame,
  Wheat,
  Zap,
  Droplet,
  Filter,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Info
} from 'lucide-react';
import { FoodItem, FoodCategory } from '../types';
import { CATEGORIES } from '../nlp/nlu';

export type RankedNutrient = 'protein_g' | 'calories_kcal' | 'fiber_g' | 'carbohydrates_g' | 'fat_g';

interface NutrientRankingTabProps {
  foods: FoodItem[];
}

const NUTRIENT_CONFIGS: Record<RankedNutrient, {
  name: string;
  icon: typeof Dumbbell;
  unit: string;
  defaultDirection: 'desc' | 'asc';
  color: string;
  bgLight: string;
  borderLight: string;
  accentText: string;
  description: string;
}> = {
  protein_g: {
    name: 'Protein',
    icon: Dumbbell,
    unit: 'g',
    defaultDirection: 'desc',
    color: 'emerald',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-300',
    accentText: 'text-emerald-900',
    description: 'Vital for muscle protein synthesis, tissue cellular repair, and long-term satiety.'
  },
  calories_kcal: {
    name: 'Calories',
    icon: Flame,
    unit: 'kcal',
    defaultDirection: 'desc',
    color: 'amber',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-300',
    accentText: 'text-amber-950',
    description: 'Total biochemical energy content per standard culinary serving size.'
  },
  fiber_g: {
    name: 'Dietary Fiber',
    icon: Wheat,
    unit: 'g',
    defaultDirection: 'desc',
    color: 'yellow',
    bgLight: 'bg-yellow-50',
    borderLight: 'border-yellow-300',
    accentText: 'text-yellow-950',
    description: 'Supports digestive peristalsis, microbiome flora diversity, and glycemic control.'
  },
  carbohydrates_g: {
    name: 'Carbohydrates',
    icon: Zap,
    unit: 'g',
    defaultDirection: 'desc',
    color: 'teal',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-300',
    accentText: 'text-teal-950',
    description: 'Primary cellular fuel providing glycogen for physical exercise and brain function.'
  },
  fat_g: {
    name: 'Healthy Fats',
    icon: Droplet,
    unit: 'g',
    defaultDirection: 'desc',
    color: 'blue',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-300',
    accentText: 'text-blue-950',
    description: 'Essential fatty acids and fat-soluble vitamin absorption (monounsaturated & omega-3).'
  }
};

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

export const NutrientRankingTab: React.FC<NutrientRankingTabProps> = ({ foods }) => {
  const [activeNutrient, setActiveNutrient] = useState<RankedNutrient>('protein_g');
  const [direction, setDirection] = useState<'desc' | 'asc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const nutrientConfig = NUTRIENT_CONFIGS[activeNutrient];

  // Handle nutrient switch
  const handleNutrientChange = (nut: RankedNutrient) => {
    setActiveNutrient(nut);
    setDirection(NUTRIENT_CONFIGS[nut].defaultDirection);
  };

  // Compute sorted and filtered foods
  const sortedFoods = useMemo(() => {
    let list = [...foods];

    // Filter by category
    if (selectedCategory !== 'All') {
      list = list.filter(f => f.category === selectedCategory);
    }

    // Filter by search query
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(f =>
        f.food_name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.vitamins.toLowerCase().includes(q) ||
        f.minerals.toLowerCase().includes(q)
      );
    }

    // Sort by selected nutrient
    list.sort((a, b) => {
      const valA = Number(a[activeNutrient]);
      const valB = Number(b[activeNutrient]);
      return direction === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [foods, activeNutrient, direction, selectedCategory, searchFilter]);

  // Max value in current dataset for relative density bar
  const maxDatasetValue = useMemo(() => {
    return Math.max(...foods.map(f => Number(f[activeNutrient])), 1);
  }, [foods, activeNutrient]);

  // Top 3 Podium foods
  const topThree = sortedFoods.slice(0, 3);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-20">
      {/* Hero Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Nutrient Ranking Engine</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#064E3B] tracking-tight font-['Poppins']">
              Foods Listed by Nutrient Content
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
              Rank the entire 100 foods catalog from high amount to low amount (or low to high) for any nutritional macro.
            </p>
          </div>

          {/* Quick presets for common goals */}
          <div className="flex flex-wrap gap-2 text-xs">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveNutrient('protein_g');
                setDirection('desc');
                setSelectedCategory('All');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-100/80 text-emerald-900 font-semibold border border-emerald-300 shadow-2xs hover:bg-emerald-200 transition-colors cursor-pointer"
            >
              🥩 Top Protein Foods
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveNutrient('calories_kcal');
                setDirection('asc');
                setSelectedCategory('All');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-100/80 text-amber-900 font-semibold border border-amber-300 shadow-2xs hover:bg-amber-200 transition-colors cursor-pointer"
            >
              🥗 Lowest Calorie Foods
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveNutrient('fiber_g');
                setDirection('desc');
                setSelectedCategory('All');
              }}
              className="px-3 py-1.5 rounded-xl bg-yellow-100/80 text-yellow-950 font-semibold border border-yellow-300 shadow-2xs hover:bg-yellow-200 transition-colors cursor-pointer"
            >
              🌾 Highest Fiber Foods
            </motion.button>
          </div>
        </div>
      </div>

      {/* NUTRIENT SELECTOR BAR (Primary Navigation for this Tab) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
            <ArrowUpDown className="w-4 h-4 mr-1.5 text-emerald-600" />
            Select Nutrient to Rank By:
          </span>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-mono">
            {sortedFoods.length} Foods Displayed
          </span>
        </div>

        {/* Big nutrient tabs with micro-interactions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(NUTRIENT_CONFIGS) as RankedNutrient[]).map((nutKey) => {
            const config = NUTRIENT_CONFIGS[nutKey];
            const Icon = config.icon;
            const isSelected = activeNutrient === nutKey;

            return (
              <motion.button
                key={nutKey}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNutrientChange(nutKey)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md shadow-emerald-700/25 ring-2 ring-emerald-500/30'
                    : 'bg-gray-50/80 hover:bg-emerald-50/50 border-gray-200/90 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-emerald-700 shadow-2xs'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Selected
                    </span>
                  )}
                </div>
                <div className={`font-bold text-sm sm:text-base font-['Poppins'] ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {config.name}
                </div>
                <div className={`text-xs mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-500'}`}>
                  Measured in <span className="font-mono font-bold">{config.unit}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Sub-controls: Direction (High/Low), Category Filter, Search, and View Mode */}
        <div className="pt-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-gray-100">
          {/* Order direction toggle */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700">Sort Order:</span>
            <button
              onClick={() => setDirection('desc')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                direction === 'desc'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High to Low (↓ Highest First)
            </button>
            <button
              onClick={() => setDirection('asc')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                direction === 'asc'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low to High (↑ Lowest First)
            </button>
          </div>

          {/* Category filter & Search within ranking */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Category Dropdown */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="All">All Categories ({foods.length})</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search food name..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-36 sm:w-44"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="bg-gray-100 p-0.5 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-gray-500'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-gray-500'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM CARDS (Only in Descending mode with 3+ items) */}
      {direction === 'desc' && sortedFoods.length >= 3 && !searchFilter && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-['Poppins']">
              Top 3 {nutrientConfig.name} Champions ({selectedCategory === 'All' ? 'Overall' : selectedCategory})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topThree.map((food, idx) => {
              const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
              const medalBgs = ['bg-amber-50 border-amber-300', 'bg-slate-50 border-slate-300', 'bg-amber-100/50 border-amber-300/80'];
              const val = Number(food[activeNutrient]);

              return (
                <motion.div
                  key={food.food_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className={`rounded-3xl p-5 border shadow-md relative overflow-hidden bg-white ${medalBgs[idx]}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white shadow-2xs border border-gray-200">
                      {medals[idx]}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {food.category}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-[#064E3B] font-['Poppins']">
                    {food.food_name}
                  </h4>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Serving: {food.serving_size}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {nutrientConfig.name}
                      </div>
                      <div className="text-2xl font-black text-emerald-800 font-mono-num">
                        {val} <span className="text-sm font-semibold text-gray-500">{nutrientConfig.unit}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 font-mono-num">
                      {food.calories_kcal} kcal · P {food.protein_g}g · C {food.carbohydrates_g}g
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN LISTED FOODS: GRID VIEW OR TABLE VIEW */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-['Poppins']">
            Ranked Foods List ({sortedFoods.length})
          </h3>
          <span className="text-xs text-gray-500">
            Sorted by <strong className="text-emerald-800 font-semibold">{nutrientConfig.name} ({direction === 'desc' ? 'High to Low' : 'Low to High'})</strong>
          </span>
        </div>

        {sortedFoods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">
              No foods found matching "{searchFilter}". Try clearing your search.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5 sm:gap-6">
            {sortedFoods.map((food, index) => {
              const val = Number(food[activeNutrient]);
              const pctOfMax = (val / maxDatasetValue) * 100;
              const catColor = CATEGORY_COLORS[food.category] || CATEGORY_COLORS.Vegetable;
              const isExpanded = expandedId === food.food_id;

              return (
                <motion.div
                  key={food.food_id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(0.25, index * 0.02) }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl border border-emerald-100/90 shadow-md shadow-emerald-950/5 hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top row: Rank, Name, Category */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                            index === 0 ? 'bg-amber-500 ring-2 ring-amber-300' : index < 3 ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}>
                            #{index + 1}
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-[#064E3B] font-['Poppins'] line-clamp-1">
                            {food.food_name}
                          </h4>
                        </div>
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                          {food.category}
                        </span>
                      </div>

                      {/* Nutrient Value Callout Badge */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-emerald-900 font-mono-num bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                          {val} {nutrientConfig.unit}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                          {nutrientConfig.name}
                        </span>
                      </div>
                    </div>

                    {/* Relative Content Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                        <span>Relative to Top Food:</span>
                        <span className="font-mono-num font-bold text-emerald-800">{pctOfMax.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pctOfMax}%` }}
                          transition={{ duration: 0.4 }}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Monospace 4-Box Nutrition Grid */}
                    <div className="bg-gray-50/90 rounded-2xl p-2.5 border border-gray-100 font-mono-num text-xs text-gray-700 grid grid-cols-4 gap-1 text-center">
                      <div className={`p-1 rounded-lg ${activeNutrient === 'calories_kcal' ? 'bg-amber-100 font-bold border border-amber-300' : ''}`}>
                        <div className="text-[10px] text-gray-400 uppercase">Cals</div>
                        <div className="font-bold">{food.calories_kcal}</div>
                      </div>
                      <div className={`p-1 rounded-lg ${activeNutrient === 'protein_g' ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300' : ''}`}>
                        <div className="text-[10px] text-gray-400 uppercase">Protein</div>
                        <div className="font-bold text-emerald-700">{food.protein_g}g</div>
                      </div>
                      <div className={`p-1 rounded-lg ${activeNutrient === 'carbohydrates_g' ? 'bg-teal-100 text-teal-900 font-bold border border-teal-300' : ''}`}>
                        <div className="text-[10px] text-gray-400 uppercase">Carbs</div>
                        <div className="font-semibold">{food.carbohydrates_g}g</div>
                      </div>
                      <div className={`p-1 rounded-lg ${activeNutrient === 'fiber_g' ? 'bg-yellow-100 text-yellow-950 font-bold border border-yellow-300' : ''}`}>
                        <div className="text-[10px] text-gray-400 uppercase">Fiber</div>
                        <div className="font-semibold text-amber-700">{food.fiber_g}g</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 flex items-center justify-between">
                      <span>Serving: {food.serving_size}</span>
                      <span className="text-gray-400 font-mono">Fat: {food.fat_g}g</span>
                    </div>
                  </div>

                  {/* Expandable Details Drawer */}
                  <div className="border-t border-gray-100 bg-gray-50/60">
                    <button
                      onClick={() => toggleExpand(food.food_id)}
                      className="w-full px-5 py-3 text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center justify-between hover:bg-emerald-50/50 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Nutrition Details & Science'}</span>
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
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left divide-y divide-gray-200">
                <thead className="bg-gray-50/90 text-gray-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Rank</th>
                    <th className="py-3 px-4 font-semibold">Food Name</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Serving Size</th>
                    <th className={`py-3 px-4 font-semibold font-mono-num text-right ${nutrientConfig.bgLight} ${nutrientConfig.accentText}`}>
                      {nutrientConfig.name} ({nutrientConfig.unit})
                    </th>
                    <th className="py-3 px-4 font-semibold font-mono-num text-right">Calories</th>
                    <th className="py-3 px-4 font-semibold font-mono-num text-right">Protein</th>
                    <th className="py-3 px-4 font-semibold font-mono-num text-right">Carbs</th>
                    <th className="py-3 px-4 font-semibold font-mono-num text-right">Fat</th>
                    <th className="py-3 px-4 font-semibold font-mono-num text-right">Fiber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sortedFoods.map((food, index) => {
                    const val = Number(food[activeNutrient]);
                    return (
                      <tr key={food.food_id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-500">
                          #{index + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#064E3B]">
                          {food.food_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {food.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {food.serving_size}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono-num font-extrabold text-sm ${nutrientConfig.bgLight} ${nutrientConfig.accentText}`}>
                          {val} {nutrientConfig.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num text-gray-700">
                          {food.calories_kcal} kcal
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-bold text-emerald-700">
                          {food.protein_g}g
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num text-gray-700">
                          {food.carbohydrates_g}g
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num text-gray-700">
                          {food.fat_g}g
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-semibold text-amber-700">
                          {food.fiber_g}g
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
