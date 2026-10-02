import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { FoodItem } from '../types';
import { CategoryClassifier, ClassificationReport, CategoryPrediction } from '../nlp/classifier';
import { CATEGORIES } from '../nlp/nlu';

interface ClassificationTabProps {
  foods: FoodItem[];
  baselineReport: ClassificationReport;
  leakFreeReport: ClassificationReport;
  baselineClassifier: CategoryClassifier;
  leakFreeClassifier: CategoryClassifier;
}

const PRESET_DESCRIPTIONS = [
  {
    title: "Orchard Fruit",
    text: "Crisp and juicy sweet tree harvest high in pectin soluble fiber and ascorbic acid, supporting gentle digestion and afternoon vitality.",
    expected: "Fruit"
  },
  {
    title: "Cultured Protein",
    text: "Thick strained lactic cultured milk teeming with micellar casein, whey proteins, and live acidophilus probiotic cultures for muscle recovery.",
    expected: "Dairy"
  },
  {
    title: "Deep Sea Catch",
    text: "Cold-water pelagic catch rich in long-chain EPA and DHA omega-3 fatty acids and astaxanthin pigments that protect the heart and arteries.",
    expected: "Seafood"
  },
  {
    title: "Golden Rhizome",
    text: "Pungent aromatic underground root packed with bioactive curcuminoids and essential oils that curb systemic joint inflammation.",
    expected: "Spice"
  }
];

export const ClassificationTab: React.FC<ClassificationTabProps> = ({
  foods,
  baselineReport,
  leakFreeReport,
  baselineClassifier,
  leakFreeClassifier,
}) => {
  const [inputText, setInputText] = useState(PRESET_DESCRIPTIONS[0].text);
  const [useLeakFreeMode, setUseLeakFreeMode] = useState(true);

  const activeClassifier = useLeakFreeMode ? leakFreeClassifier : baselineClassifier;
  const activeReport = useLeakFreeMode ? leakFreeReport : baselineReport;

  const predictions: CategoryPrediction[] = activeClassifier.predictProbabilities(inputText);
  const topPrediction = predictions[0];

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-16">
      {/* Intro */}
      <div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#064E3B] tracking-tight font-['Poppins']">
          NLP Text Classification & Label Leakage Study
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
          Predicting food categories (12 classes) from natural language descriptions with leave-one-out cross-validation and leakage mitigation.
        </p>
      </div>

      {/* Section 1: Live Interactive Classifier */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <Sparkles className="w-5 h-5 text-emerald-600 mr-2" />
              Live Food Description Classifier
            </h3>
            <p className="text-xs text-gray-500">
              Type or paste any food description to see model predictions in real time.
            </p>
          </div>

          {/* Model Mode Toggle */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-gray-700">Leakage Defense:</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setUseLeakFreeMode(!useLeakFreeMode)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                useLeakFreeMode
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {useLeakFreeMode ? '🛡️ Leak-Free Mode (Active)' : '⚠️ Baseline (Leakage Allowed)'}
            </motion.button>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Sample Inputs:</span>
          {PRESET_DESCRIPTIONS.map((preset, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setInputText(preset.text)}
              className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
            >
              {preset.title}
            </motion.button>
          ))}
        </div>

        {/* Text Area and Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or write a description of any food..."
              className="w-full p-4 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm text-gray-800 transition-all focus:outline-hidden"
            />
            <p className="text-[11px] text-gray-400">
              In Leak-Free Mode, explicit category words (e.g. "fruit", "dairy", "seafood") are automatically stripped to test true contextual semantic understanding.
            </p>
          </div>

          {/* Prediction Output Card with micro-animation */}
          <motion.div
            key={topPrediction?.category}
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200/90 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Top Predicted Class
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-['Poppins']">
                  {topPrediction?.category}
                </span>
                <span className="text-xs font-bold font-mono-num text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                  {((topPrediction?.probability || 0) * 100).toFixed(1)}%
                </span>
              </div>

              {/* Probability Breakdown Bar */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-gray-600 block">
                  Probability Distribution:
                </span>
                {predictions.slice(0, 4).map((pred, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-700">
                      <span>{pred.category}</span>
                      <span className="font-mono-num font-semibold">{(pred.probability * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-emerald-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pred.probability * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className="bg-emerald-600 h-1.5 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Section 2: The Label Leakage Experiment */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
              Experiment: Baseline vs. Leakage-Free Classification
            </h3>
            <p className="text-xs text-gray-500">
              Evaluated via Leave-One-Out Cross-Validation across 100 food descriptions.
            </p>
          </div>
        </div>

        {/* Comparison Callout Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-950 font-['Poppins']">Baseline (With Category Words)</h4>
              <span className="text-xs font-mono-num font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                Accuracy: {(baselineReport.accuracy * 100).toFixed(1)}% · Macro-F1: {(baselineReport.macroF1 * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Food descriptions often contain literal words like <em>"Spinach is a leafy green <strong>vegetable</strong>..."</em> or <em>"Apple is a pomaceous <strong>fruit</strong>..."</em>. This creates artificial label leakage and artificially inflates accuracy.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#064E3B] font-['Poppins']">Leak-Free (Category Words Removed)</h4>
              <span className="text-xs font-mono-num font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                Accuracy: {(leakFreeReport.accuracy * 100).toFixed(1)}% · Macro-F1: {(leakFreeReport.macroF1 * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              When words like <em>fruit, vegetable, grain, dairy</em> are stripped prior to training, the model must rely strictly on functional nutrients, preparation methods, and botanical descriptors.
            </p>
          </div>
        </div>

        {/* Per-Category Metrics Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 font-['Poppins']">
              Per-Category Evaluation ({useLeakFreeMode ? 'Leak-Free Model' : 'Baseline Model'})
            </h4>
            <span className="text-xs text-gray-500">
              Macro-F1: <strong className="text-emerald-800 font-mono-num">{(activeReport.macroF1 * 100).toFixed(1)}%</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2.5 font-semibold">Category</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right">Support (N)</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right">Precision</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right">Recall</th>
                  <th className="py-2.5 font-semibold font-mono-num text-right text-emerald-800">F1-Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono-num">
                {activeReport.categories.map((cat, i) => (
                  <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 font-medium text-gray-800 font-sans">{cat.name}</td>
                    <td className="py-2.5 text-right text-gray-500">{cat.support}</td>
                    <td className="py-2.5 text-right text-gray-600">{(cat.precision * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-right text-gray-600">{(cat.recall * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">{(cat.f1 * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confusion Matrix Visualization */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 font-['Poppins']">
              Confusion Matrix Heatmap (12 × 12)
            </h4>
            <span className="text-[11px] text-gray-400">Rows: True Class · Columns: Predicted Class</span>
          </div>

          <div className="overflow-x-auto p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <table className="min-w-full text-[10px] text-center font-mono-num">
              <thead>
                <tr>
                  <th className="p-1 text-left text-gray-400 font-sans">True \ Pred</th>
                  {CATEGORIES.map(c => (
                    <th key={c} className="p-1 text-gray-500 font-bold truncate max-w-[40px]" title={c}>
                      {c.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeReport.confusionMatrix.map((row, rIdx) => {
                  const trueCat = CATEGORIES[rIdx];
                  return (
                    <tr key={rIdx} className="hover:bg-gray-100/60 transition-colors">
                      <td className="p-1.5 text-left font-sans font-medium text-gray-700 truncate max-w-[80px]" title={trueCat}>
                        {trueCat}
                      </td>
                      {row.map((cell, cIdx) => {
                        const isDiagonal = rIdx === cIdx;
                        let cellBg = 'bg-white';
                        if (isDiagonal && cell > 0) {
                          cellBg = cell >= 5 ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-200 text-emerald-900 font-bold';
                        } else if (!isDiagonal && cell > 0) {
                          cellBg = 'bg-rose-100 text-rose-800 font-semibold';
                        }
                        return (
                          <td key={cIdx} className={`p-1.5 border border-gray-200/50 rounded-xs transition-colors ${cellBg}`}>
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
