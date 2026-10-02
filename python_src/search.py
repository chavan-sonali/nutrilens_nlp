"""
NutriLens - Retrieval Engines
Module 2 & 3: TF-IDF Lexical Search, Dense Semantic Embeddings, and Hybrid Re-ranking
"""

import math
from collections import Counter
from typing import List, Dict, Any, Tuple
from .preprocess import clean_text, build_food_document

# 16 Core Physiological & Nutritional Latent Semantic Dimensions
SEMANTIC_DIMENSIONS = [
    ('gut_health', ['gut', 'microbiome', 'digest', 'digestion', 'probiotic', 'prebiotic', 'ferment', 'fiber', 'colon', 'enzyme']),
    ('muscle_repair', ['muscle', 'hypertrophy', 'protein', 'bcaa', 'amino', 'anabolic', 'recovery', 'lean', 'gym', 'workout']),
    ('energy_stamina', ['energy', 'stamina', 'endurance', 'workout', 'pre-workout', 'glycogen', 'fuel', 'fatigue', 'active']),
    ('heart_cardio', ['heart', 'cardiac', 'cardiovascular', 'arterial', 'artery', 'blood pressure', 'cholesterol', 'ldl', 'omega-3']),
    ('diabetes_sugar', ['diabetes', 'diabetic', 'glycemic', 'glucose', 'insulin', 'sugar', 'keto', 'low carb']),
    ('weight_loss', ['weight loss', 'lose weight', 'slim', 'diet', 'slimming', 'satiety', 'low calorie', 'light', 'deficit']),
    ('immunity_antiox', ['immune', 'immunity', 'antioxidant', 'oxidative', 'free radical', 'polyphenol', 'vitamin c', 'inflammation']),
    ('bone_joint', ['bone', 'skeletal', 'joint', 'cartilage', 'calcium', 'vitamin d', 'osteopenia', 'matrix', 'collagen']),
    ('brain_focus', ['brain', 'cognitive', 'memory', 'focus', 'alert', 'sleep', 'calm', 'serotonin', 'neuroprotective']),
    ('vision_eye', ['eye', 'ocular', 'vision', 'retina', 'macular', 'lutein', 'zeaxanthin', 'rhodopsin']),
    ('maternal_prenatal', ['pregnant', 'pregnancy', 'prenatal', 'maternal', 'folate', 'embryo']),
    ('hydration_electrolytes', ['hydrate', 'hydration', 'electrolyte', 'potassium', 'water', 'diuretic', 'perspiration']),
    ('thyroid_hormone', ['thyroid', 'hormone', 'iodine', 'selenium', 'zinc', 'testosterone', 'prostate']),
    ('skin_dermal', ['skin', 'dermal', 'cutaneous', 'elasticity', 'anti-aging', 'collagen', 'wrinkle']),
    ('plant_based', ['vegetarian', 'vegan', 'plant', 'cruciferous', 'legume', 'pulse']),
    ('seafood_marine', ['seafood', 'fish', 'marine', 'ocean', 'salmon', 'tuna', 'shrimp', 'omega-3'])
]


class TfidfSearchEngine:
    """TF-IDF vectorizer matching scikit-learn TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)."""

    def __init__(self, use_bigrams: bool = True, sublinear_tf: bool = True):
        self.use_bigrams = use_bigrams
        self.sublinear_tf = sublinear_tf
        self.vocab: Dict[str, int] = {}
        self.reverse_vocab: List[str] = []
        self.idf: List[float] = []
        self.doc_vectors: List[Dict[int, float]] = []
        self.doc_count: int = 0

    def extract_ngrams(self, tokens: List[str]) -> List[str]:
        ngrams = list(tokens)
        if self.use_bigrams and len(tokens) > 1:
            for i in range(len(tokens) - 1):
                ngrams.append(f"{tokens[i]} {tokens[i+1]}")
        return ngrams

    def fit(self, foods: List[Dict[str, Any]]) -> 'TfidfSearchEngine':
        self.doc_count = len(foods)
        self.vocab.clear()
        self.reverse_vocab.clear()

        doc_ngrams_list = []
        df_counts = Counter()

        for food in foods:
            doc_str = build_food_document(food)
            tokens = clean_text(doc_str)
            ngrams = self.extract_ngrams(tokens)
            doc_ngrams_list.append(ngrams)

            unique_terms = set(ngrams)
            for t in unique_terms:
                df_counts[t] += 1

        idx = 0
        for term, df in df_counts.items():
            self.vocab[term] = idx
            self.reverse_vocab.append(term)
            idx += 1

        vocab_size = len(self.reverse_vocab)
        self.idf = [0.0] * vocab_size
        for i, term in enumerate(self.reverse_vocab):
            df = df_counts[term]
            self.idf[i] = math.log((1 + self.doc_count) / (1 + df)) + 1.0

        self.doc_vectors = [self._vectorize(ngrams) for ngrams in doc_ngrams_list]
        return self

    def _vectorize(self, ngrams: List[str]) -> Dict[int, float]:
        tf_counts = Counter()
        for t in ngrams:
            if t in self.vocab:
                tf_counts[self.vocab[t]] += 1

        vec = {}
        norm_sq = 0.0
        for idx, count in tf_counts.items():
            tf = (1.0 + math.log(count)) if self.sublinear_tf else float(count)
            weight = tf * self.idf[idx]
            vec[idx] = weight
            norm_sq += weight * weight

        norm = math.sqrt(norm_sq)
        if norm > 0:
            for idx in vec:
                vec[idx] /= norm
        return vec

    def score_query(self, query: str) -> List[float]:
        q_tokens = clean_text(query)
        q_ngrams = self.extract_ngrams(q_tokens)
        q_vec = self._vectorize(q_ngrams)

        scores = [0.0] * self.doc_count
        for d in range(self.doc_count):
            d_vec = self.doc_vectors[d]
            dot = sum(val * d_vec.get(idx, 0.0) for idx, val in q_vec.items())
            scores[d] = max(0.0, dot)
        return scores


class SemanticSearchEngine:
    """Dense Semantic Representation (16-D latent physiological concept vector space)."""

    def __init__(self, foods: List[Dict[str, Any]]):
        self.foods = foods
        self.doc_vectors = [self._encode(build_food_document(f).lower()) for f in foods]

    def _encode(self, text: str) -> List[float]:
        vec = []
        norm_sq = 0.0
        for _, keywords in SEMANTIC_DIMENSIONS:
            weight = 0
            for kw in keywords:
                weight += text.count(kw)
            val = math.tanh(weight * 0.45)
            vec.append(val)
            norm_sq += val * val

        norm = math.sqrt(norm_sq)
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def score_query(self, query: str) -> List[float]:
        q_vec = self._encode(query.lower())
        scores = []
        for d_vec in self.doc_vectors:
            dot = sum(q * d for q, d in zip(q_vec, d_vec))
            scores.append(max(0.0, dot))
        return scores


def min_max_normalize(scores: List[float]) -> List[float]:
    min_val, max_val = min(scores), max(scores)
    range_val = max_val - min_val
    if range_val <= 1e-9:
        return [0.0] * len(scores)
    return [(s - min_val) / range_val for s in scores]


def hybrid_search(
    tfidf_engine: TfidfSearchEngine,
    semantic_engine: SemanticSearchEngine,
    query: str,
    alpha: float = 0.4
) -> Tuple[List[float], List[float], List[float]]:
    """Combines lexical TF-IDF with dense semantic embeddings."""
    tfidf_scores = tfidf_engine.scoreQuery(query) if hasattr(tfidf_engine, 'scoreQuery') else tfidf_engine.score_query(query)
    semantic_scores = semantic_engine.scoreQuery(query) if hasattr(semantic_engine, 'scoreQuery') else semantic_engine.score_query(query)

    norm_tfidf = min_max_normalize(tfidf_scores)
    norm_semantic = min_max_normalize(semantic_scores)

    combined = [
        alpha * t + (1.0 - alpha) * s
        for t, s in zip(norm_tfidf, norm_semantic)
    ]
    return combined, norm_tfidf, norm_semantic
