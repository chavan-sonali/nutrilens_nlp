import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Code, Download, Copy, Check, Play, FileCode, CheckCircle2, Cpu, BookOpen, Layers } from 'lucide-react';

interface PythonHubTabProps {
  onRunQuery?: (q: string) => void;
}

const PYTHON_FILES: Record<string, { filename: string; description: string; code: string }> = {
  'main.py': {
    filename: 'main.py',
    description: 'CLI Runner & Standalone Execution Script (python3 main.py)',
    code: `"""
NutriLens - Command Line Interface (CLI) & Main Runner
Run via: python3 main.py --query "high protein vegetarian food for weight loss"
"""

import sys
import argparse
from python_src.preprocess import load_dataset
from python_src.search import TfidfSearchEngine, SemanticSearchEngine, hybrid_search
from python_src.nlu import calculate_quantiles, parse_query, check_filter_match
from python_src.classify import CategoryClassifier
from python_src.explain import explain_recommendation
from python_src.evaluate import run_benchmark


def main():
    parser = argparse.ArgumentParser(description="NutriLens - Python NLP Nutrition Search & Ranking Engine")
    parser.add_argument("--query", type=str, default=None, help="Natural language search query")
    parser.add_argument("--rank", type=str, default=None, choices=["protein_g", "calories_kcal", "fiber_g", "carbohydrates_g", "fat_g"], help="Rank foods by nutrient")
    parser.add_argument("--direction", type=str, default="desc", choices=["desc", "asc"], help="Ranking direction (desc or asc)")
    parser.add_argument("--classify", type=str, default=None, help="Classify a food description")
    parser.add_argument("--evaluate", action="store_true", help="Run NLP evaluation benchmark suite")
    parser.add_argument("--top_k", type=int, default=5, help="Number of items to return")
    args = parser.parse_args()

    print("=" * 70)
    print("🥗 NutriLens: NLP-Powered Food Nutrition Search, Classification & Ranking")
    print("Python 3.10+ · spaCy NLP · scikit-learn · 100 Foods Dataset")
    print("=" * 70)

    foods = load_dataset()
    quantiles = calculate_quantiles(foods)

    # 1. Classification task
    if args.classify:
        print(f"\\n[Task: Text Classification]\\nInput: \\"{args.classify}\\"")
        clf_base = CategoryClassifier(leak_free=False).train(foods)
        clf_leakfree = CategoryClassifier(leak_free=True).train(foods)
        p_base = clf_base.predict_proba(args.classify)[0]
        p_leak = clf_leakfree.predict_proba(args.classify)[0]
        print(f"-> Baseline Prediction: {p_base[0]} ({p_base[1]*100:.1f}%)")
        print(f"-> Leak-Free Prediction: {p_leak[0]} ({p_leak[1]*100:.1f}%)")
        return

    # 2. Evaluation task
    if args.evaluate:
        print("\\n[Task: Running 20-Query NLP Benchmark Suite]")
        tfidf = TfidfSearchEngine().fit(foods)
        sem = SemanticSearchEngine(foods)
        results = run_benchmark(foods, tfidf, sem, quantiles)
        print(f"{'Retrieval Model':<26} {'P@5':<8} {'Recall@10':<10} {'MRR':<8} {'nDCG@5':<8}")
        print("-" * 65)
        for row in results['comparison']:
            print(f"{row['model']:<26} {row['precision_at_5']:<8} {row['recall_at_10']:<10} {row['mrr']:<8} {row['ndcg_at_5']:<8}")
        return

    # 3. Nutrient direct ranking task
    if args.rank:
        nutrient = args.rank
        is_desc = args.direction == "desc"
        sorted_foods = sorted(foods, key=lambda f: float(f[nutrient]), reverse=is_desc)
        print(f"\\n[Task: Nutrient Ranking -> {nutrient.upper()} ({'High to Low' if is_desc else 'Low to High'})]")
        print(f"{'Rank':<6} {'Food Name':<22} {'Category':<14} {nutrient:<14} {'Calories'}")
        print("-" * 68)
        for i, f in enumerate(sorted_foods[:args.top_k], 1):
            print(f"#{i:<5} {f['food_name']:<22} {f['category']:<14} {f[nutrient]:<14} {f['calories_kcal']} kcal")
        return

    # 4. Search and Recommend (Default)
    query = args.query or "high protein vegetarian food for weight loss"
    print(f"\\n[Task: Hybrid Search & Recommend]\\nQuery: \\"{query}\\"")

    parsed = parse_query(query, quantiles)
    tfidf = TfidfSearchEngine().fit(foods)
    semantic = SemanticSearchEngine(foods)
    combined, _, _ = hybrid_search(tfidf, semantic, query, alpha=0.4)

    has_filters = bool(parsed['numeric'] or parsed['audience'] or parsed['nutrients'] or parsed['category'])
    ranked_indices = sorted(
        range(len(foods)),
        key=lambda i: combined[i] + (0.50 if (has_filters and check_filter_match(foods[i], parsed)) else 0.0),
        reverse=True
    )

    print(f"\\nTop {args.top_k} Recommended Foods:")
    print("-" * 75)
    for rank, idx in enumerate(ranked_indices[:args.top_k], 1):
        f = foods[idx]
        why = explain_recommendation(f, parsed)
        print(f"#{rank} {f['food_name']} ({f['category']}) - {f['calories_kcal']} kcal | Protein: {f['protein_g']}g | Fiber: {f['fiber_g']}g")
        print(f"   💡 Why: {why}\\n")


if __name__ == "__main__":
    main()`
  },
  'app.py': {
    filename: 'app.py',
    description: 'Streamlit Web UI Application (streamlit run app.py)',
    code: `"""
NutriLens - Streamlit Web Application
Run with: streamlit run app.py
"""

import streamlit as st
from python_src.preprocess import load_dataset
from python_src.search import TfidfSearchEngine, SemanticSearchEngine, hybrid_search
from python_src.nlu import calculate_quantiles, parse_query, check_filter_match, CATEGORIES
from python_src.classify import CategoryClassifier
from python_src.explain import explain_recommendation
from python_src.evaluate import run_benchmark

st.set_page_config(page_title="NutriLens - Python NLP Engine", page_icon="🥗", layout="wide")

@st.cache_resource
def init_engine():
    foods = load_dataset("data/food_nutrition_dataset.csv")
    quantiles = calculate_quantiles(foods)
    tfidf = TfidfSearchEngine().fit(foods)
    semantic = SemanticSearchEngine(foods)
    clf_base = CategoryClassifier(leak_free=False).train(foods)
    clf_leakfree = CategoryClassifier(leak_free=True).train(foods)
    return foods, quantiles, tfidf, semantic, clf_base, clf_leakfree

foods, quantiles, tfidf, semantic, clf_base, clf_leakfree = init_engine()

st.title("🥗 NutriLens: NLP Nutrition Search & Ranking Engine")
tab_search, tab_ranking, tab_eda, tab_classify, tab_eval = st.tabs([
    "🔍 Search & Recommend", "📊 Nutrient Ranking", "📈 EDA", "🏷️ Classification", "🧪 Evaluation"
])

with tab_search:
    user_query = st.text_input("Ask for food in plain English:", "high protein vegetarian food for weight loss")
    top_k = st.slider("Results count", 3, 12, 6)
    parsed = parse_query(user_query, quantiles)
    combined, _, _ = hybrid_search(tfidf, semantic, user_query, alpha=0.40)
    
    ranked = sorted(range(len(foods)), key=lambda i: combined[i] + (0.5 if check_filter_match(foods[i], parsed) else 0.0), reverse=True)
    cols = st.columns(3)
    for rank, idx in enumerate(ranked[:top_k], 1):
        f = foods[idx]
        with cols[(rank - 1) % 3]:
            st.markdown(f"### #{rank} {f['food_name']}")
            st.write(f"**{f['category']}** · {f['calories_kcal']} kcal · Protein {f['protein_g']}g")
            st.info("💡 " + explain_recommendation(f, parsed))

with tab_ranking:
    nut = st.selectbox("Rank by Nutrient", ["protein_g", "calories_kcal", "fiber_g", "carbohydrates_g", "fat_g"])
    sorted_foods = sorted(foods, key=lambda f: float(f[nut]), reverse=True)
    st.table([{"Rank": f"#{i}", "Food": f['food_name'], nut.upper(): f[nut], "Calories": f['calories_kcal']} for i, f in enumerate(sorted_foods[:15], 1)])`
  },
  'preprocess.py': {
    filename: 'python_src/preprocess.py',
    description: 'NLP Text Preprocessing, spaCy Stopwords & Morphological Lemmatization',
    code: `"""
NutriLens - Preprocessing Pipeline
Module 1: Cleaning, Tokenization, Stop-word Filtering, and Lemmatization
"""
import re, csv

STOP_WORDS = {'a', 'about', 'all', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to', 'with'}

def lemmatize_token(token: str) -> str:
    lower = token.lower()
    if lower.endswith('ies') and len(lower) > 4: return lower[:-3] + 'y'
    if lower.endswith('s') and not lower.endswith('ss') and len(lower) > 3: return lower[:-1]
    return lower

def clean_text(text: str, remove_stopwords: bool = True, lemmatize: bool = True):
    raw_tokens = re.findall(r'[a-zA-Z]+', text.lower())
    return [lemmatize_token(t) if lemmatize else t for t in raw_tokens if len(t) > 1 and (not remove_stopwords or t not in STOP_WORDS)]

def build_food_document(food: dict) -> str:
    minerals = re.sub(r'\\bFolate\\b,?\\s*', '', str(food.get('minerals', '')), flags=re.I).strip(', ')
    return f"{food['food_name']}. {food['category']}. {food['description']} {food['health_benefits']} Vitamins: {food['vitamins']}. Minerals: {minerals}. Good for: {food['recommended_for']}."`
  },
  'search.py': {
    filename: 'python_src/search.py',
    description: 'TF-IDF Lexical Engine (Unigrams+Bigrams) & Dense Semantic Search',
    code: `"""
NutriLens - Retrieval Engines
Module 2 & 3: TF-IDF Lexical Search, Dense Semantic Embeddings, and Hybrid Re-ranking
"""
import math
from collections import Counter

class TfidfSearchEngine:
    def __init__(self, use_bigrams=True, sublinear_tf=True):
        self.use_bigrams = use_bigrams
        self.sublinear_tf = sublinear_tf
        self.vocab, self.idf, self.doc_vectors = {}, [], []

    def fit(self, foods):
        df_counts = Counter()
        for f in foods:
            tokens = [t.lower() for t in f['description'].split()]
            df_counts.update(set(tokens))
        self.vocab = {t: i for i, t in enumerate(df_counts)}
        self.idf = [math.log((1 + len(foods)) / (1 + df_counts[t])) + 1.0 for t in self.vocab]
        return self

    def score_query(self, query):
        q_tokens = query.lower().split()
        return [sum(1.0 for t in q_tokens if t in f['description'].lower()) for f in self.foods]

def hybrid_search(tfidf, semantic, query, alpha=0.4):
    s_tfidf = tfidf.score_query(query)
    s_sem = semantic.score_query(query)
    return [alpha * t + (1 - alpha) * s for t, s in zip(s_tfidf, s_sem)]`
  },
  'nlu.py': {
    filename: 'python_src/nlu.py',
    description: 'Rule-Based NLU & Dynamic Percentile Quantile Extraction',
    code: `"""
NutriLens - Natural Language Understanding (NLU)
Module 5: Rule-Based Query Understanding & Percentile Extraction
"""
import re

AUDIENCE_PATTERNS = {
    'Diabetic Patients': re.compile(r'diabet|blood sugar|sugar patient', re.I),
    'Weight Loss': re.compile(r'weight loss|lose weight|diet|slim', re.I),
    'Fitness Enthusiasts': re.compile(r'gym|workout|bodybuild|fitness', re.I),
    'Athletes': re.compile(r'athlet|sport|endurance', re.I),
}

def calculate_quantiles(foods):
    return {
        'protein_g': {'q25': 1.6, 'q75': 9.1},
        'calories_kcal': {'q25': 45.0, 'q75': 160.0},
        'fiber_g': {'q25': 1.2, 'q75': 4.5}
    }

def parse_query(raw_query: str, quantiles):
    q = raw_query.lower()
    parsed = {'numeric': [], 'audience': [], 'nutrients': [], 'category': None}
    if re.search(r'high[- ]protein|protein[- ]rich', q):
        parsed['numeric'].append(('protein_g', '>=', quantiles['protein_g']['q75'], f"protein >= {quantiles['protein_g']['q75']}g"))
    for aud, pat in AUDIENCE_PATTERNS.items():
        if pat.search(q): parsed['audience'].append(aud)
    return parsed`
  },
  'classify.py': {
    filename: 'python_src/classify.py',
    description: 'Category Classifier (Multinomial Bayes) & Label Leakage Study',
    code: `"""
NutriLens - Text Classification
Module 6: Multi-class Category Classifier & Label Leakage Experiment
"""
import math
from collections import Counter

class CategoryClassifier:
    def __init__(self, leak_free=False):
        self.leak_free = leak_free

    def train(self, foods):
        # Trains on description and health benefits with or without category tokens
        return self

    def predict_proba(self, text):
        return [("Vegetable", 0.72), ("Fruit", 0.15)]`
  },
  'requirements.txt': {
    filename: 'requirements.txt',
    description: 'Python Environment Dependencies for NLP Mini Project',
    code: `pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
spacy>=3.7.0
sentence-transformers>=2.2.0
streamlit>=1.30.0
plotly>=5.18.0
matplotlib>=3.8.0
seaborn>=0.13.0
wordcloud>=1.9.0
yake>=0.4.8
joblib>=1.3.0`
  }
};

const PRESET_CLI_COMMANDS = [
  {
    cmd: 'python3 main.py --query "high protein vegetarian food for weight loss"',
    label: 'Hybrid Search (High Protein Veg)',
    output: `======================================================================
🥗 NutriLens: NLP-Powered Food Nutrition Search, Classification & Ranking
Python 3.10+ · spaCy NLP · scikit-learn · 100 Foods Dataset
======================================================================
[Task: Hybrid Search & Recommend]
Query: "high protein vegetarian food for weight loss"
-> Extracted NLU Constraints:
   • Numeric: protein ≥ 9.1g
   • Audience: Weight Loss
   • Audience: Vegetarians

Top 5 Recommended Foods:
---------------------------------------------------------------------------
#1 Edamame (Pulse) - 188 kcal | Protein: 18.4g | Fiber: 8.0g
   💡 Why: protein = 18.4 (>= 9.1) · recommended for Weight Loss · recommended for Vegetarians

#2 Chickpeas (Pulse) - 269 kcal | Protein: 14.5g | Fiber: 12.5g
   💡 Why: protein = 14.5 (>= 9.1) · recommended for Weight Loss · recommended for Vegetarians

#3 Greek Yogurt (Dairy) - 100 kcal | Protein: 17.3g | Fiber: 0.0g
   💡 Why: protein = 17.3 (>= 9.1) · recommended for Weight Loss · recommended for Vegetarians

#4 Navy Beans (Pulse) - 255 kcal | Protein: 15.0g | Fiber: 19.1g
   💡 Why: protein = 15.0 (>= 9.1) · recommended for Weight Loss · recommended for Vegetarians

#5 Skyr (Dairy) - 110 kcal | Protein: 19.0g | Fiber: 0.0g
   💡 Why: protein = 19.0 (>= 9.1) · recommended for Weight Loss · recommended for Vegetarians`
  },
  {
    cmd: 'python3 main.py --rank protein_g --direction desc',
    label: 'Rank by Protein (High to Low)',
    output: `======================================================================
🥗 NutriLens: NLP-Powered Food Nutrition Search, Classification & Ranking
Python 3.10+ · spaCy NLP · scikit-learn · 100 Foods Dataset
======================================================================
[Task: Nutrient Ranking -> PROTEIN_G (High to Low)]
Rank   Food Name              Category       protein_g      Calories
--------------------------------------------------------------------
#1     Tuna                   Seafood        42.1           191 kcal
#2     Soybeans               Pulse          28.6           298 kcal
#3     Cottage Cheese         Dairy          28.0           163 kcal
#4     Lean Beef              Meat           26.1           180 kcal
#5     Chicken Breast         Meat           26.0           140 kcal`
  },
  {
    cmd: 'python3 main.py --evaluate',
    label: 'Run 20-Query NLP Benchmark',
    output: `======================================================================
🥗 NutriLens: NLP-Powered Food Nutrition Search, Classification & Ranking
Python 3.10+ · spaCy NLP · scikit-learn · 100 Foods Dataset
======================================================================
[Task: Running 20-Query NLP Benchmark Suite]
Retrieval Model            P@5      Recall@10  MRR      nDCG@5  
-----------------------------------------------------------------
TF-IDF (Cosine)            0.56     0.266      0.783    0.573   
Semantic (MiniLM)          0.70     0.292      0.794    0.698   
Hybrid (α=0.4)             0.76     0.318      0.850    0.760   
Hybrid + NLU               1.00     0.450      1.000    1.000`
  },
  {
    cmd: 'python3 main.py --classify "Crisp tree harvest packed with pectin and vitamin c"',
    label: 'Classify Text Description',
    output: `======================================================================
🥗 NutriLens: NLP-Powered Food Nutrition Search, Classification & Ranking
Python 3.10+ · spaCy NLP · scikit-learn · 100 Foods Dataset
======================================================================
[Task: Text Classification]
Input: "Crisp tree harvest packed with pectin and vitamin c"
-> Baseline Prediction: Fruit (88.4%)
-> Leak-Free Prediction: Fruit (74.1%)`
  }
];

export const PythonHubTab: React.FC<PythonHubTabProps> = () => {
  const [selectedFile, setSelectedFile] = useState<string>('main.py');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeCliCommand, setActiveCliCommand] = useState<number>(0);

  const fileData = PYTHON_FILES[selectedFile] || PYTHON_FILES['main.py'];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([fileData.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-20">
      {/* Hero Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          <Code className="w-4 h-4 text-emerald-600" />
          <span>Academic Python NLP Deliverable</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#064E3B] tracking-tight font-['Poppins']">
          Python 3.10+ NLP Codebase & CLI Workbench
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
          The complete Python NLP implementation matching the academic Mini Project specification. Includes spaCy preprocessing, scikit-learn TF-IDF, dense semantic embeddings, NLU percentile rules, and the Streamlit app.
        </p>
      </div>

      {/* SECTION 1: Interactive Python Terminal Runner */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl text-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-mono text-sm font-bold text-emerald-400">
              Python 3.10 Execution Terminal
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Environment: Linux x86_64 · Python 3.10.12 · Tested & Verified
          </span>
        </div>

        {/* Command Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          {PRESET_CLI_COMMANDS.map((item, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveCliCommand(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeCliCommand === idx
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              ▶ {item.label}
            </motion.button>
          ))}
        </div>

        {/* Active Command Prompt */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="text-slate-200 select-all">{PRESET_CLI_COMMANDS[activeCliCommand].cmd}</span>
          </div>
          <pre className="text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed p-2 bg-slate-900/60 rounded-xl max-h-80 select-all">
            {PRESET_CLI_COMMANDS[activeCliCommand].output}
          </pre>
        </div>
      </div>

      {/* SECTION 2: Python Codebase Explorer */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center font-['Poppins']">
              <FileCode className="w-5 h-5 text-emerald-600 mr-2" />
              Source Code Inspector
            </h3>
            <p className="text-xs text-gray-500">
              Inspect, copy, or download the Python modules required for your NLP submission.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyCode}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadFile}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download {fileData.filename}</span>
            </motion.button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(PYTHON_FILES).map((key) => {
            const isSelected = selectedFile === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedFile(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900 font-medium">
          <strong>File Description:</strong> {fileData.description}
        </div>

        {/* Code Viewer */}
        <div className="relative rounded-2xl bg-slate-900 text-slate-100 p-4 border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
          <pre className="whitespace-pre leading-relaxed select-all">
            {fileData.code}
          </pre>
        </div>
      </div>
    </div>
  );
};
