"""
NutriLens - Evaluation Suite
Module 10: Quantitative Benchmarks (P@5, Recall@10, MRR, nDCG@5) & Ablation Study
"""

import math
from typing import List, Dict, Any, Set, Tuple
from .search import TfidfSearchEngine, SemanticSearchEngine, hybrid_search
from .nlu import parse_query, check_filter_match, calculate_quantiles


def precision_at_k(ranked_ids: List[int], relevant_ids: Set[int], k: int = 5) -> float:
    top_k = ranked_ids[:k]
    hits = sum(1 for fid in top_k if fid in relevant_ids)
    return hits / k if k > 0 else 0.0


def recall_at_k(ranked_ids: List[int], relevant_ids: Set[int], k: int = 10) -> float:
    if not relevant_ids:
        return 1.0
    top_k = ranked_ids[:k]
    hits = sum(1 for fid in top_k if fid in relevant_ids)
    return min(1.0, hits / len(relevant_ids))


def mrr(ranked_ids: List[int], relevant_ids: Set[int]) -> float:
    for rank, fid in enumerate(ranked_ids, 1):
        if fid in relevant_ids:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(ranked_ids: List[int], relevant_ids: Set[int], k: int = 5) -> float:
    if not relevant_ids:
        return 1.0
    limit = min(k, len(ranked_ids))
    dcg = sum((1.0 / math.log2(i + 2)) for i in range(limit) if ranked_ids[i] in relevant_ids)

    ideal_limit = min(k, len(relevant_ids))
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_limit))
    return dcg / idcg if idcg > 0 else 0.0


def run_benchmark(
    foods: List[Dict[str, Any]],
    tfidf: TfidfSearchEngine,
    semantic: SemanticSearchEngine,
    quantiles: Dict[str, Dict[str, float]]
) -> Dict[str, Any]:
    """Runs the 20 ground-truth query benchmark across the 4 retrieval architectures."""

    test_suite = [
        ("high protein food", lambda f: f['protein_g'] >= quantiles['protein_g']['q75']),
        ("low calorie snack", lambda f: f['calories_kcal'] <= quantiles['calories_kcal']['q25']),
        ("high fibre food", lambda f: f['fiber_g'] >= quantiles['fiber_g']['q75']),
        ("food for diabetic patients", lambda f: "diabetic patients" in f['recommended_for'].lower()),
        ("rich in vitamin C", lambda f: "vitamin c" in f['vitamins'].lower()),
        ("good for pregnant women", lambda f: "pregnant women" in f['recommended_for'].lower()),
        ("high protein vegetarian food for weight loss", lambda f: f['protein_g'] >= quantiles['protein_g']['q75'] and "weight loss" in f['recommended_for'].lower() and f['category'] not in ["Meat", "Seafood"]),
        ("something good for gut health", lambda f: "digest" in f['health_benefits'].lower() or "microbiome" in f['health_benefits'].lower() or f['fiber_g'] >= quantiles['fiber_g']['q75']),
        ("calcium rich dairy", lambda f: f['category'] == "Dairy" and "calcium" in f['minerals'].lower()),
        ("pre-workout energy snack", lambda f: "athletes" in f['recommended_for'].lower() or "fitness" in f['recommended_for'].lower())
    ]

    models = ["TF-IDF (Cosine)", "Semantic (MiniLM)", "Hybrid (α=0.4)", "Hybrid + NLU"]
    metrics = {m: {'p5': [], 'r10': [], 'mrr': [], 'ndcg5': []} for m in models}

    for query_str, rel_filter in test_suite:
        relevant_ids = {f['food_id'] for f in foods if rel_filter(f)}
        parsed = parse_query(query_str, quantiles)

        # 1. TF-IDF
        s_tfidf = tfidf.score_query(query_str)
        rank_tfidf = [foods[i]['food_id'] for i in sorted(range(len(foods)), key=lambda x: s_tfidf[x], reverse=True)]

        # 2. Semantic
        s_sem = semantic.score_query(query_str)
        rank_sem = [foods[i]['food_id'] for i in sorted(range(len(foods)), key=lambda x: s_sem[x], reverse=True)]

        # 3. Hybrid
        s_comb, _, _ = hybrid_search(tfidf, semantic, query_str, alpha=0.4)
        rank_hyb = [foods[i]['food_id'] for i in sorted(range(len(foods)), key=lambda x: s_comb[x], reverse=True)]

        # 4. Hybrid + NLU boost
        has_filters = bool(parsed['numeric'] or parsed['audience'] or parsed['nutrients'] or parsed['category'])
        s_nlu = [
            s_comb[i] + (0.50 if (has_filters and check_filter_match(foods[i], parsed)) else 0.0)
            for i in range(len(foods))
        ]
        rank_nlu = [foods[i]['food_id'] for i in sorted(range(len(foods)), key=lambda x: s_nlu[x], reverse=True)]

        for m_name, ranked in [("TF-IDF (Cosine)", rank_tfidf), ("Semantic (MiniLM)", rank_sem), ("Hybrid (α=0.4)", rank_hyb), ("Hybrid + NLU", rank_nlu)]:
            metrics[m_name]['p5'].append(precision_at_k(ranked, relevant_ids, 5))
            metrics[m_name]['r10'].append(recall_at_k(ranked, relevant_ids, 10))
            metrics[m_name]['mrr'].append(mrr(ranked, relevant_ids))
            metrics[m_name]['ndcg5'].append(ndcg_at_k(ranked, relevant_ids, 5))

    results = []
    for m in models:
        results.append({
            'model': m,
            'precision_at_5': round(sum(metrics[m]['p5']) / len(metrics[m]['p5']), 3),
            'recall_at_10': round(sum(metrics[m]['r10']) / len(metrics[m]['r10']), 3),
            'mrr': round(sum(metrics[m]['mrr']) / len(metrics[m]['mrr']), 3),
            'ndcg_at_5': round(sum(metrics[m]['ndcg5']) / len(metrics[m]['ndcg5']), 3)
        })

    return {'comparison': results}
