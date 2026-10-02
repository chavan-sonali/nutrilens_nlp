import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Database, Search, Filter } from 'lucide-react';
import { FoodItem } from '../types';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: FoodItem[];
}

export const DatasetModal: React.FC<DatasetModalProps> = ({ isOpen, onClose, foods }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(foods.map(f => f.category)))];

  const filteredFoods = foods.filter(f => {
    const matchesCat = categoryFilter === 'All' || f.category === categoryFilter;
    const matchesSearch =
      f.food_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vitamins.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.minerals.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDownloadCsv = () => {
    const headers = [
      "food_id", "food_name", "category", "description", "serving_size",
      "calories_kcal", "protein_g", "carbohydrates_g", "fat_g", "fiber_g",
      "vitamins", "minerals", "health_benefits", "recommended_for"
    ];

    const escapeCsv = (str: string | number) => {
      const text = String(str);
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const rows = foods.map(f => [
      f.food_id,
      escapeCsv(f.food_name),
      escapeCsv(f.category),
      escapeCsv(f.description),
      escapeCsv(f.serving_size),
      f.calories_kcal,
      f.protein_g,
      f.carbohydrates_g,
      f.fat_g,
      f.fiber_g,
      escapeCsv(f.vitamins),
      escapeCsv(f.minerals),
      escapeCsv(f.health_benefits),
      escapeCsv(f.recommended_for)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'food_nutrition_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-emerald-100 z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/70 to-teal-50/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#064E3B] font-['Poppins']">
                  NutriLens 100 Foods Dataset
                </h3>
                <p className="text-xs text-gray-500">
                  Authoritative schema with 14 nutritional, demographic, and NLP corpus attributes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadCsv}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </motion.button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search food, nutrients, vitamins..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} {cat === 'All' ? `(${foods.length})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
              <table className="min-w-full text-xs text-left divide-y divide-gray-200">
                <thead className="bg-gray-50/90 text-gray-600 sticky top-0 z-10 backdrop-blur">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">ID</th>
                    <th className="py-2.5 px-3 font-semibold">Food Name</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold font-mono-num text-right">Cals</th>
                    <th className="py-2.5 px-3 font-semibold font-mono-num text-right">Protein</th>
                    <th className="py-2.5 px-3 font-semibold font-mono-num text-right">Carbs</th>
                    <th className="py-2.5 px-3 font-semibold font-mono-num text-right">Fat</th>
                    <th className="py-2.5 px-3 font-semibold font-mono-num text-right">Fiber</th>
                    <th className="py-2.5 px-3 font-semibold">Vitamins & Minerals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredFoods.map((f) => (
                    <tr key={f.food_id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-gray-400">#{f.food_id}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-950">{f.food_name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {f.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-gray-700">{f.calories_kcal}</td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-emerald-700">{f.protein_g}g</td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-gray-700">{f.carbohydrates_g}g</td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-gray-700">{f.fat_g}g</td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-medium text-amber-700">{f.fiber_g}g</td>
                      <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate" title={`${f.vitamins} | ${f.minerals}`}>
                        {f.vitamins}; {f.minerals}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-between items-center text-[11px] text-gray-400 px-1">
              <span>Showing {filteredFoods.length} of {foods.length} items</span>
              <span>100% Client-side Pre-indexed</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
