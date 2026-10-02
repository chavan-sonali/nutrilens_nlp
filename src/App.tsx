/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, ActiveTab } from './components/Header';
import { SearchTab } from './components/SearchTab';
import { NutrientRankingTab } from './components/NutrientRankingTab';
import { PythonHubTab } from './components/PythonHubTab';
import { InsightsTab } from './components/InsightsTab';
import { ClassificationTab } from './components/ClassificationTab';
import { EvaluationTab } from './components/EvaluationTab';
import { DatasetModal } from './components/DatasetModal';

import { FOOD_DATASET } from './data/foodDataset';
import { TfidfEngine } from './nlp/tfidf';
import { SemanticEngine } from './nlp/embeddings';
import { calculateDatasetQuantiles, parseQuery } from './nlp/nlu';
import { NutriLensRecommender } from './nlp/recommender';
import { CategoryClassifier } from './nlp/classifier';
import { extractAllCategoryKeywords } from './nlp/keywords';
import { evaluateRetrievers } from './nlp/evaluation';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [query, setQuery] = useState<string>('high protein vegetarian food for weight loss');
  const [alpha, setAlpha] = useState<number>(0.40);
  const [topK, setTopK] = useState<number>(6);
  const [strictFilter, setStrictFilter] = useState<boolean>(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);

  // Initialize NLP engines (memoized)
  const {
    foods,
    tfidf,
    semantic,
    quantiles,
    recommender,
    baselineClassifier,
    leakFreeClassifier,
    baselineReport,
    leakFreeReport,
    categoryKeywords,
    evalResults,
  } = useMemo(() => {
    const foods = FOOD_DATASET;

    // 1. TF-IDF Engine
    const tfidf = new TfidfEngine({ useBigrams: true, sublinearTf: true });
    tfidf.fit(foods);

    // 2. Semantic Dense Embeddings
    const semantic = new SemanticEngine(foods);

    // 3. Dynamic dataset quantiles
    const quantiles = calculateDatasetQuantiles(foods);

    // 4. Hybrid Recommender
    const recommender = new NutriLensRecommender(foods, tfidf, semantic, quantiles);

    // 5. Classifiers (Baseline & Leak-Free)
    const baselineClassifier = new CategoryClassifier(false);
    baselineClassifier.train(foods);
    const baselineReport = baselineClassifier.evaluate(foods);

    const leakFreeClassifier = new CategoryClassifier(true);
    leakFreeClassifier.train(foods);
    const leakFreeReport = leakFreeClassifier.evaluate(foods);

    // 6. Keywords per category
    const categoryKeywords = extractAllCategoryKeywords(foods, tfidf);

    // 7. Retriever Evaluation & Benchmarks
    const evalResults = evaluateRetrievers(foods, tfidf, semantic, recommender);

    return {
      foods,
      tfidf,
      semantic,
      quantiles,
      recommender,
      baselineClassifier,
      leakFreeClassifier,
      baselineReport,
      leakFreeReport,
      categoryKeywords,
      evalResults,
    };
  }, []);

  // Parse current query
  const parsedQuery = useMemo(() => {
    return parseQuery(query, quantiles);
  }, [query, quantiles]);

  // Run live recommendation
  const searchResults = useMemo(() => {
    return recommender.recommend(query, parsedQuery, {
      alpha,
      topK,
      strictFilter,
    });
  }, [query, parsedQuery, recommender, alpha, topK, strictFilter]);

  const handleSelectQueryFromBenchmark = (selectedQ: string) => {
    setQuery(selectedQ);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-[#1F2937] flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataset={() => setIsDatasetModalOpen(true)}
      />

      {/* Main Content Area with animated tab transitions */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'search' && (
              <SearchTab
                query={query}
                setQuery={setQuery}
                parsedQuery={parsedQuery}
                results={searchResults}
                alpha={alpha}
                setAlpha={setAlpha}
                topK={topK}
                setTopK={setTopK}
                strictFilter={strictFilter}
                setStrictFilter={setStrictFilter}
                quantiles={quantiles}
                totalFoodsCount={foods.length}
                allFoods={foods}
              />
            )}

            {activeTab === 'nutrients' && (
              <NutrientRankingTab
                foods={foods}
              />
            )}

            {activeTab === 'python' && (
              <PythonHubTab />
            )}

            {activeTab === 'insights' && (
              <InsightsTab
                foods={foods}
                categoryKeywords={categoryKeywords}
              />
            )}

            {activeTab === 'classify' && (
              <ClassificationTab
                foods={foods}
                baselineReport={baselineReport}
                leakFreeReport={leakFreeReport}
                baselineClassifier={baselineClassifier}
                leakFreeClassifier={leakFreeClassifier}
              />
            )}

            {activeTab === 'evaluation' && (
              <EvaluationTab
                comparison={evalResults.comparison}
                ablation={evalResults.ablation}
                foods={foods}
                quantiles={quantiles}
                onSelectQuery={handleSelectQueryFromBenchmark}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dedicated Dataset Modal */}
      <DatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        foods={foods}
      />

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white/70 py-6 text-center text-xs text-gray-500">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-emerald-950 font-semibold font-['Poppins']">
            <span>🥗 NutriLens</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-emerald-700 font-normal">NLP-Powered Food Nutrition Engine</span>
          </div>
          <div className="text-[11px] text-gray-400">
            100 Foods × 14 Attributes · TF-IDF + Dense Embeddings + Rule-Based NLU
          </div>
        </div>
      </footer>
    </div>
  );
}
