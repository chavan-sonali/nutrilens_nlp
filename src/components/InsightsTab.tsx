import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, PieChart, Sparkles, Filter } from 'lucide-react';
import { FoodItem, FoodCategory } from '../types';
import { CATEGORIES } from '../nlp/nlu';
import { CategoryKeywords } from '../nlp/keywords';

interface InsightsTabProps {
  foods: FoodItem[];
  categoryKeywords: CategoryKeywords[];
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ foods, categoryKeywords }) => {
  const [selectedScatterCategory, setSelectedScatterCategory] = useState<string>('All');
  const [activeKeywordCat, setActiveKeywordCat] = useState<FoodCategory>('Vegetable');

  // 1. Category counts
  const categoryCounts: Record<string, number> = {};
  for (const f of foods) {
    categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
  }
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // 2. Vitamins & Minerals frequencies
  const vitaminFreq: Record<string, number> = {};
  const mineralFreq: Record<string, number> = {};
  for (const f of foods) {
    f.vitamins.split(',').forEach(v => {
      const trimmed = v.trim();
      if (trimmed) vitaminFreq[trimmed] = (vitaminFreq[trimmed] || 0) + 1;
    });
    f.minerals.split(',').forEach(m => {
      const trimmed = m.trim();
      if (trimmed) mineralFreq[trimmed] = (mineralFreq[trimmed] || 0) + 1;
    });
  }
  const topVitamins = Object.entries(vitaminFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topMinerals = Object.entries(mineralFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // 3. Audience tags frequencies
  const audienceFreq: Record<string, number> = {};
  for (const f of foods) {
    f.recommended_for.split(',').forEach(t => {
      const trimmed = t.trim();
      if (trimmed) audienceFreq[trimmed] = (audienceFreq[trimmed] || 0) + 1;
    });
  }
  const topAudience = Object.entries(audienceFreq).sort((a, b) => b[1] - a[1]);

  // 4. Nutrient Quantiles & Summary
  const calcStats = (key: 'calories_kcal' | 'protein_g' | 'carbohydrates_g' | 'fat_g' | 'fiber_g') => {
    const vals = foods.map(f => Number(f[key])).sort((a, b) => a - b);
    const min = vals[0];
    const max = vals[vals.length - 1];
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const q25 = vals[Math.floor(vals.length * 0.25)];
    const q75 = vals[Math.floor(vals.length * 0.75)];
    return { min, q25, mean: parseFloat(mean.toFixed(1)), q75, max };
  };

  const macroStats = [
    { label: 'Calories (kcal)', ...calcStats('calories_kcal') },
    { label: 'Protein (g)', ...calcStats('protein_g') },
    { label: 'Carbohydrates (g)', ...calcStats('carbohydrates_g') },
    { label: 'Fat (g)', ...calcStats('fat_g') },
    { label: 'Fiber (g)', ...calcStats('fiber_g') },
  ];

  // Scatter plot filtered data
  const scatterFoods = selectedScatterCategory === 'All'
    ? foods
    : foods.filter(f => f.category === selectedScatterCategory);

  const selectedKeywords = categoryKeywords.find(k => k.category === activeKeywordCat);

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-16">
      {/* Intro Header */}
      <div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#064E3B] tracking-tight font-['Poppins']">
          Exploratory Data Analysis & NLP Insights
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
          Statistical and corpus analysis over 100 foods across 14 multidimensional nutritional and textual attributes.
        </p>
      </div>

      {/* Row 1: Category Distribution & Audience Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Category distribution */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <BarChart3 className="w-5 h-5 text-emerald-600 mr-2" />
              Foods per Category ({foods.length} Total)
            </h3>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              12 Classes
            </span>
          </div>

          <div className="space-y-3">
            {sortedCategories.map(([cat, count], idx) => {
              const pct = (count / foods.length) * 100;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-700">
                    <span>{cat}</span>
                    <span className="font-mono-num font-semibold text-emerald-800">{count} foods ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct * 3.5}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.03 }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audience tags distribution */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <PieChart className="w-5 h-5 text-amber-600 mr-2" />
              Target Audience Frequency (<code className="text-xs font-mono">recommended_for</code>)
            </h3>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
              Multi-label
            </span>
          </div>

          <div className="space-y-3">
            {topAudience.slice(0, 10).map(([aud, count], idx) => {
              const pct = (count / foods.length) * 100;
              return (
                <div key={aud} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-700">
                    <span>👥 {aud}</span>
                    <span className="font-mono-num font-semibold text-amber-900">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / 45) * 100}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.03 }}
                      className="bg-gradient-to-r from-amber-400 to-amber-600 h-2.5 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Protein vs Calories Interactive Scatter Visualization */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <TrendingUp className="w-5 h-5 text-emerald-600 mr-2" />
              Protein vs Calories Distribution Scatter Plot
            </h3>
            <p className="text-xs text-gray-500">
              Hover over points to inspect macro ratios. High-protein lean foods cluster in the upper-left quadrant.
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedScatterCategory}
              onChange={(e) => setSelectedScatterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Categories ({foods.length})</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scatter Canvas Grid */}
        <div className="relative h-72 sm:h-96 w-full bg-slate-50/70 rounded-2xl p-4 border border-gray-200 overflow-hidden">
          {/* Axis Labels */}
          <div className="absolute left-3 top-3 text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
            ↑ Protein (0g - 35g)
          </div>
          <div className="absolute right-4 bottom-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            Calories (0 - 300 kcal) →
          </div>

          {/* Grid lines */}
          <div className="absolute inset-x-8 top-1/4 border-b border-dashed border-gray-200" />
          <div className="absolute inset-x-8 top-2/4 border-b border-dashed border-gray-200" />
          <div className="absolute inset-x-8 top-3/4 border-b border-dashed border-gray-200" />
          <div className="absolute inset-y-6 left-1/4 border-r border-dashed border-gray-200" />
          <div className="absolute inset-y-6 left-2/4 border-r border-dashed border-gray-200" />
          <div className="absolute inset-y-6 left-3/4 border-r border-dashed border-gray-200" />

          {/* Data Points with micro-animations */}
          <div className="relative w-full h-full">
            {scatterFoods.map((f) => {
              const left = Math.min(95, Math.max(5, (f.calories_kcal / 300) * 90 + 5));
              const top = Math.min(95, Math.max(5, 95 - (f.protein_g / 35) * 90));

              return (
                <motion.div
                  key={f.food_id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <motion.div
                    whileHover={{ scale: 1.8 }}
                    className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-xs group-hover:bg-amber-500 transition-colors"
                  />
                  
                  {/* Tooltip with micro-animation */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2.5 bg-gray-900/95 backdrop-blur text-white text-[11px] rounded-xl shadow-xl z-30 pointer-events-none">
                    <div className="font-bold text-emerald-400">{f.food_name}</div>
                    <div className="text-gray-200 font-mono-num">{f.calories_kcal} kcal · {f.protein_g}g protein</div>
                    <div className="text-[10px] text-gray-400">{f.category}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Numeric Summary Table & Micronutrient Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Macro Summary Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 font-['Poppins']">
            Nutritional Distribution (Dataset Quantiles)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2.5 font-semibold">Nutrient</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right">Min</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right">25th %</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right text-emerald-800">Mean</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right">75th %</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono-num">
                {macroStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 font-medium text-gray-800 font-sans">{stat.label}</td>
                    <td className="py-3 text-right text-gray-500">{stat.min}</td>
                    <td className="py-3 text-right text-gray-600">{stat.q25}</td>
                    <td className="py-3 text-right font-bold text-emerald-700">{stat.mean}</td>
                    <td className="py-3 text-right text-gray-600">{stat.q75}</td>
                    <td className="py-3 text-right text-gray-900 font-semibold">{stat.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vitamins & Minerals */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 font-['Poppins']">
            Top Vitamins & Minerals Frequency
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px] block mb-2">
                Top Vitamins (12 Total)
              </span>
              <div className="space-y-1.5">
                {topVitamins.map(([vit, cnt]) => (
                  <div key={vit} className="flex justify-between items-center bg-purple-50/70 hover:bg-purple-100/60 px-3 py-1.5 rounded-xl text-purple-950 transition-colors">
                    <span>{vit}</span>
                    <span className="font-mono-num font-bold text-purple-800">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-teal-900 uppercase tracking-wider text-[10px] block mb-2">
                Top Minerals (10 Total)
              </span>
              <div className="space-y-1.5">
                {topMinerals.map(([min, cnt]) => (
                  <div key={min} className="flex justify-between items-center bg-teal-50/70 hover:bg-teal-100/60 px-3 py-1.5 rounded-xl text-teal-950 transition-colors">
                    <span>{min}</span>
                    <span className="font-mono-num font-bold text-teal-800">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Keyword Extraction per Category */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
              Category Keyword Extraction (Mean TF-IDF Feature Weights)
            </h3>
            <p className="text-xs text-gray-500">
              Distinctive vocabulary extracted from unigram and bigram document frequencies across categories.
            </p>
          </div>
        </div>

        {/* Category selector pills */}
        <div className="flex flex-wrap gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveKeywordCat(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeKeywordCat === cat
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Selected Category Keyword Chips */}
        {selectedKeywords && (
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 space-y-4">
            <div className="text-xs text-gray-600 font-medium">
              Top discriminative terms for <strong className="text-emerald-950 font-bold">{activeKeywordCat}</strong> ({selectedKeywords.count} foods):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedKeywords.topTerms.map((term, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-950 capitalize">
                    <span>{term.term}</span>
                    <span className="text-[10px] text-gray-400">#{idx + 1}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, term.score * 500)}%` }}
                      transition={{ duration: 0.4 }}
                      className="bg-emerald-600 h-1.5 rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
