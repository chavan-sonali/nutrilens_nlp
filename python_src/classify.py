"""
NutriLens - Text Classification
Module 6: Multi-class Category Classifier & Label Leakage Experiment
"""

import math
from collections import Counter
from typing import List, Dict, Any, Tuple
from .preprocess import clean_text, strip_leakage
from .nlu import CATEGORIES


class CategoryClassifier:
    """Multinomial Naive Bayes / Softmax Classifier with Laplace smoothing."""

    def __init__(self, leak_free: bool = False, alpha: float = 0.8):
        self.leak_free = leak_free
        self.alpha = alpha
        self.categories = list(CATEGORIES)
        self.priors: List[float] = []
        self.feature_weights: Dict[str, List[float]] = {}

    def train(self, foods: List[Dict[str, Any]]) -> 'CategoryClassifier':
        num_classes = len(self.categories)
        cat_to_idx = {c: i for i, c in enumerate(self.categories)}

        class_doc_counts = [0] * num_classes
        class_total_words = [0.0] * num_classes
        term_class_counts: Dict[str, List[int]] = {}

        for food in foods:
            cat = food['category']
            if cat not in cat_to_idx:
                continue
            c_idx = cat_to_idx[cat]
            class_doc_counts[c_idx] += 1

            raw_text = f"{food['description']} {food['health_benefits']}"
            if self.leak_free:
                raw_text = strip_leakage(raw_text)

            tokens = clean_text(raw_text)
            for t in tokens:
                class_total_words[c_idx] += 1
                if t not in term_class_counts:
                    term_class_counts[t] = [0] * num_classes
                term_class_counts[t][c_idx] += 1

        total_docs = len(foods)
        self.priors = [
            math.log((class_doc_counts[c] + 1) / (total_docs + num_classes))
            for c in range(num_classes)
        ]

        vocab_size = len(term_class_counts)
        self.feature_weights.clear()

        for term, counts in term_class_counts.items():
            weights = []
            for c in range(num_classes):
                prob = (counts[c] + self.alpha) / (class_total_words[c] + self.alpha * vocab_size)
                weights.append(math.log(prob))
            self.feature_weights[term] = weights

        return self

    def predict_proba(self, text: str) -> List[Tuple[str, float]]:
        clean = strip_leakage(text) if self.leak_free else text
        tokens = clean_text(clean)

        num_classes = len(self.categories)
        log_posteriors = list(self.priors)

        for t in tokens:
            weights = self.feature_weights.get(t)
            if weights:
                for c in range(num_classes):
                    log_posteriors[c] += weights[c]

        max_log = max(log_posteriors)
        exp_vals = [math.exp(lp - max_log) for lp in log_posteriors]
        total_exp = sum(exp_vals)

        probs = [
            (self.categories[c], exp_vals[c] / total_exp if total_exp > 0 else 1.0 / num_classes)
            for c in range(num_classes)
        ]
        probs.sort(key=lambda x: x[1], reverse=True)
        return probs

    def predict(self, text: str) -> str:
        return self.predict_proba(text)[0][0]

    def evaluate(self, foods: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Leave-one-out cross validation report and confusion matrix."""
        num_classes = len(self.categories)
        cat_to_idx = {c: i for i, c in enumerate(self.categories)}
        matrix = [[0] * num_classes for _ in range(num_classes)]

        for i, test_item in enumerate(foods):
            train_set = [f for j, f in enumerate(foods) if j != i]
            model = CategoryClassifier(leak_free=self.leak_free, alpha=self.alpha)
            model.train(train_set)

            pred = model.predict(f"{test_item['description']} {test_item['health_benefits']}")
            true_idx = cat_to_idx.get(test_item['category'], -1)
            pred_idx = cat_to_idx.get(pred, -1)
            if true_idx != -1 and pred_idx != -1:
                matrix[true_idx][pred_idx] += 1

        total_correct = sum(matrix[c][c] for c in range(num_classes))
        accuracy = total_correct / len(foods) if foods else 0.0

        f1_scores = []
        for c in range(num_classes):
            tp = matrix[c][c]
            fp = sum(matrix[r][c] for r in range(num_classes) if r != c)
            fn = sum(matrix[c][col] for col in range(num_classes) if col != c)
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
            if (tp + fn) > 0:
                f1_scores.append(f1)

        macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0.0

        return {
            'accuracy': round(accuracy, 3),
            'macro_f1': round(macro_f1, 3),
            'confusion_matrix': matrix,
            'categories': self.categories
        }
