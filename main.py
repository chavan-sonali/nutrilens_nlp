"""
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
        print(f"\n[Task: Text Classification]\nInput: \"{args.classify}\"")
        clf_base = CategoryClassifier(leak_free=False).train(foods)
        clf_leakfree = CategoryClassifier(leak_free=True).train(foods)
        p_base = clf_base.predict_proba(args.classify)[0]
        p_leak = clf_leakfree.predict_proba(args.classify)[0]
        print(f"-> Baseline Prediction: {p_base[0]} ({p_base[1]*100:.1f}%)")
        print(f"-> Leak-Free Prediction: {p_leak[0]} ({p_leak[1]*100:.1f}%)")
        return

    # 2. Evaluation task
    if args.evaluate:
        print("\n[Task: Running 20-Query NLP Benchmark Suite]")
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
        print(f"\n[Task: Nutrient Ranking -> {nutrient.upper()} ({'High to Low' if is_desc else 'Low to High'})]")
        print(f"{'Rank':<6} {'Food Name':<22} {'Category':<14} {nutrient:<14} {'Calories'}")
        print("-" * 68)
        for i, f in enumerate(sorted_foods[:args.top_k], 1):
            print(f"#{i:<5} {f['food_name']:<22} {f['category']:<14} {f[nutrient]:<14} {f['calories_kcal']} kcal")
        return

    # 4. Search and Recommend (Default)
    query = args.query or "high protein vegetarian food for weight loss"
    print(f"\n[Task: Hybrid Search & Recommend]\nQuery: \"{query}\"")

    parsed = parse_query(query, quantiles)
    if parsed['numeric'] or parsed['audience'] or parsed['nutrients'] or parsed['category']:
        print("-> Extracted NLU Constraints:")
        for col, op, val, label in parsed['numeric']:
            print(f"   • Numeric: {label}")
        for aud in parsed['audience']:
            print(f"   • Audience: {aud}")
        for nut in parsed['nutrients']:
            print(f"   • Nutrient: {nut}")
        if parsed['category']:
            print(f"   • Category: {parsed['category']}")

    tfidf = TfidfSearchEngine().fit(foods)
    semantic = SemanticSearchEngine(foods)
    combined, _, _ = hybrid_search(tfidf, semantic, query, alpha=0.4)

    has_filters = bool(parsed['numeric'] or parsed['audience'] or parsed['nutrients'] or parsed['category'])
    ranked_indices = sorted(
        range(len(foods)),
        key=lambda i: combined[i] + (0.50 if (has_filters and check_filter_match(foods[i], parsed)) else 0.0),
        reverse=True
    )

    print(f"\nTop {args.top_k} Recommended Foods:")
    print("-" * 75)
    for rank, idx in enumerate(ranked_indices[:args.top_k], 1):
        f = foods[idx]
        why = explain_recommendation(f, parsed)
        print(f"#{rank} {f['food_name']} ({f['category']}) - {f['calories_kcal']} kcal | Protein: {f['protein_g']}g | Fiber: {f['fiber_g']}g")
        print(f"   💡 Why: {why}")
        print()


if __name__ == "__main__":
    main()
