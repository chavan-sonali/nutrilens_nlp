import React from 'react';
import { motion } from 'motion/react';
import { Database, Search, ArrowUpDown, BarChart3, Tag, Award, Terminal } from 'lucide-react';

export type ActiveTab = 'search' | 'nutrients' | 'python' | 'insights' | 'classify' | 'evaluation';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDataset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenDataset }) => {
  const tabs = [
    { id: 'search', label: 'Search & Recommend', icon: Search },
    { id: 'nutrients', label: 'Nutrient Ranking', icon: ArrowUpDown },
    { id: 'python', label: 'Python NLP Code & CLI', icon: Terminal },
    { id: 'insights', label: 'EDA & Insights', icon: BarChart3 },
    { id: 'classify', label: 'Text Classification', icon: Tag },
    { id: 'evaluation', label: 'Evaluation & Benchmarks', icon: Award },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-40 transition-all">
      <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Branding */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('search')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 text-xl font-bold">
              🥗
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#064E3B] font-['Poppins']">
                  NutriLens
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                  Python NLP
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden md:block truncate max-w-sm">
                Python NLP Food Nutrition Search, Classification & Ranking
              </p>
            </div>
          </motion.div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenDataset}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 transition-colors shadow-2xs cursor-pointer"
              title="Inspect 100-food dataset"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline font-semibold">100 Foods Dataset</span>
              <span className="sm:hidden font-semibold">Dataset</span>
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation with Micro-interaction indicator */}
        <div className="flex space-x-1 sm:space-x-2.5 border-t border-gray-100 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`relative flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-white font-semibold shadow-sm'
                    : 'text-gray-600 hover:text-emerald-900 hover:bg-emerald-50/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-emerald-600 rounded-xl -z-10 shadow-sm shadow-emerald-700/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
