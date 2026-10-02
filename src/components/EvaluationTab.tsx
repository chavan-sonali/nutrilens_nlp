import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle, BarChart, Layers, Play } from 'lucide-react';
import { ModelComparisonRow, AblationRow, createEvaluationQueries } from '../nlp/evaluation';
import { FoodItem } from '../types';
import { DatasetQuantiles } from '../nlp/nlu';

interface EvaluationTabProps {
  comparison: ModelComparisonRow[];
  ablation: AblationRow[];
  foods: FoodItem[];
  quantiles: DatasetQuantiles;
  onSelectQuery: (q: string) => void;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({
  comparison,
  ablation,
  foods,
  quantiles,
  onSelectQuery,
}) => {
  const evalQueries = createEvaluationQueries(foods, quantiles);
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredQueries = selectedType === 'all'
    ? evalQueries
    : evalQueries.filter(q => q.type === selectedType);

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-16">
      {/* Intro */}
      <div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#064E3B] tracking-tight font-['Poppins']">
          System Evaluation & Retrieval Benchmarks
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
          Quantitative empirical benchmarking across Precision@5, Recall@10, Mean Reciprocal Rank (MRR), and nDCG@5.
        </p>
      </div>

      {/* Main Benchmarks Comparison Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <Award className="w-5 h-5 text-emerald-600 mr-2" />
              Comparative Retriever Evaluation (20 Ground-Truth Benchmarks)
            </h3>
            <p className="text-xs text-gray-500">
              Evaluated on queries spanning numeric nutrient limits, target audience tags, and unstructured semantic intents.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-3 font-semibold">Retrieval Method</th>
                <th className="py-3 font-semibold font-mono-num text-right">Precision@5</th>
                <th className="py-3 font-semibold font-mono-num text-right">Recall@10</th>
                <th className="py-3 font-semibold font-mono-num text-right">MRR</th>
                <th className="py-3 font-semibold font-mono-num text-right">nDCG@5</th>
                <th className="py-3 font-semibold pl-6">Qualitative Strengths & Trade-offs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono-num">
              {comparison.map((row, i) => {
                const isBest = i === comparison.length - 1;
                return (
                  <tr key={i} className={`hover:bg-gray-50/80 transition-colors ${isBest ? 'bg-emerald-50/40 font-semibold' : ''}`}>
                    <td className="py-3.5 font-sans font-medium text-gray-900 flex items-center space-x-1.5">
                      {isBest && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 inline" />}
                      <span>{row.modelName}</span>
                    </td>
                    <td className={`py-3.5 text-right ${isBest ? 'text-emerald-800 font-bold text-sm' : 'text-gray-700'}`}>
                      {row.precisionAt5.toFixed(3)}
                    </td>
                    <td className={`py-3.5 text-right ${isBest ? 'text-emerald-800 font-bold text-sm' : 'text-gray-700'}`}>
                      {row.recallAt10.toFixed(3)}
                    </td>
                    <td className={`py-3.5 text-right ${isBest ? 'text-emerald-800 font-bold text-sm' : 'text-gray-700'}`}>
                      {row.mrr.toFixed(3)}
                    </td>
                    <td className={`py-3.5 text-right ${isBest ? 'text-emerald-800 font-bold text-sm' : 'text-gray-700'}`}>
                      {row.ndcgAt5.toFixed(3)}
                    </td>
                    <td className="py-3.5 pl-6 font-sans text-gray-600 text-xs">
                      {row.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ablation Study Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <Layers className="w-5 h-5 text-teal-600 mr-2" />
              Ablation Study (Component Contribution Analysis)
            </h3>
            <p className="text-xs text-gray-500">
              Isolating the empirical contribution of NLU boosting, dense semantic vectors, and hybrid weighting (α).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-3 font-semibold">Pipeline Configuration</th>
                <th className="py-3 font-semibold font-mono-num text-right">Precision@5</th>
                <th className="py-3 font-semibold font-mono-num text-right">MRR</th>
                <th className="py-3 font-semibold pl-6">Impact / Performance Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono-num">
              {ablation.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 font-sans font-medium text-gray-800">{row.configuration}</td>
                  <td className="py-3.5 text-right text-gray-700 font-bold">{row.precisionAt5.toFixed(3)}</td>
                  <td className="py-3.5 text-right text-gray-700">{row.mrr.toFixed(3)}</td>
                  <td className={`py-3.5 pl-6 font-sans text-xs ${i === 0 ? 'text-emerald-700 font-bold' : 'text-gray-600'}`}>
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 20 Ground Truth Benchmark Queries Explorer */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <BarChart className="w-5 h-5 text-amber-500 mr-2" />
              Evaluation Benchmark Queries Suite ({evalQueries.length} Total)
            </h3>
            <p className="text-xs text-gray-500">
              Automated ground-truth test queries generated via structured nutritional rules. Click "Run in Engine" to test live.
            </p>
          </div>

          {/* Filter query type with micro-interaction */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {['all', 'numeric', 'audience', 'nutrient', 'semantic', 'hybrid'].map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-colors cursor-pointer ${
                  selectedType === type
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
          {filteredQueries.map((eq) => {
            const relevantCount = foods.filter(eq.relevantFilter).length;
            return (
              <div
                key={eq.id}
                className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-emerald-50/60 hover:border-emerald-200 transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                      Q{eq.id}
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      "{eq.query}"
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                    <span className="capitalize text-emerald-800 font-medium">Type: {eq.type}</span>
                    <span>·</span>
                    <span>Relevant: <strong className="font-mono text-gray-800">{relevantCount} items</strong></span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onSelectQuery(eq.query)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-gray-600 text-xs font-semibold flex items-center space-x-1 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shrink-0 cursor-pointer"
                  title="Run this query in the search tab"
                >
                  <span>Test</span>
                  <Play className="w-3 h-3 fill-current" />
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
