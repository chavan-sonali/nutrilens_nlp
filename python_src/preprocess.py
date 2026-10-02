"""
NutriLens - Preprocessing Pipeline
Module 1: Cleaning, Tokenization, Stop-word Filtering, and Lemmatization
"""

import re
import csv
from typing import List, Dict, Any, Optional

# Standard English stopwords (matching spaCy en_core_web_sm stop list)
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
    'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
    'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
    'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
    'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
    'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
    'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
    'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
    'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
    'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d',
    'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'also', 'delivers', 'provides',
    'contains', 'known', 'making', 'including', 'used'
}

# Domain irregular lemmatization table
IRREGULAR_LEMMAS = {
    'apples': 'apple', 'bananas': 'banana', 'berries': 'berry', 'blueberries': 'blueberry',
    'strawberries': 'strawberry', 'leaves': 'leaf', 'veggies': 'vegetable', 'vegetables': 'vegetable',
    'fruits': 'fruit', 'grains': 'grain', 'beans': 'bean', 'seeds': 'seed', 'nuts': 'nut',
    'calories': 'calorie', 'proteins': 'protein', 'carbs': 'carbohydrate', 'carbohydrates': 'carbohydrate',
    'fats': 'fat', 'fibers': 'fiber', 'fibres': 'fiber', 'vitamins': 'vitamin', 'minerals': 'mineral',
    'patients': 'patient', 'diabetics': 'diabetic', 'supports': 'support', 'reduces': 'reduce',
    'improves': 'improve', 'enhances': 'enhance', 'regulates': 'regulate', 'lowers': 'lower',
    'promotes': 'promote', 'aids': 'aid', 'helps': 'help', 'boosting': 'boost', 'boosts': 'boost',
    'protects': 'protect', 'strengthens': 'strengthen', 'maintains': 'maintain', 'curbs': 'curb',
    'eating': 'eat', 'eaten': 'eat', 'drinking': 'drink'
}

# Category leakage regex
LEAK_WORDS_PATTERN = re.compile(
    r'\b(fruit|fruits|vegetable|vegetables|grain|grains|pulse|pulses|legume|legumes|dairy|nut|nuts|seed|seeds|seafood|fish|fishes|spice|spices|beverage|beverages|drink|meat|meats|egg|eggs|herb|herbs)\b',
    re.IGNORECASE
)


def lemmatize_token(token: str) -> str:
    """Lemmatizes a token with linguistic rules and morphological mappings."""
    lower = token.lower()
    if lower in IRREGULAR_LEMMAS:
        return IRREGULAR_LEMMAS[lower]

    if lower.endswith('ies') and len(lower) > 4:
        return lower[:-3] + 'y'
    if lower.endswith('ves') and len(lower) > 4:
        return lower[:-3] + 'f'
    if lower.endswith('ses') or lower.endswith('xes') or lower.endswith('shes') or lower.endswith('ches'):
        return lower[:-2]
    if lower.endswith('s') and not lower.endswith('ss') and len(lower) > 3:
        return lower[:-1]
    if lower.endswith('ing') and len(lower) > 5:
        return lower[:-3]
    if lower.endswith('ed') and len(lower) > 4:
        return lower[:-2]

    return lower


def clean_text(text: str, remove_stopwords: bool = True, lemmatize: bool = True) -> List[str]:
    """
    Tokenizes, strips punctuation, filters stopwords, and applies lemmatization.
    Equivalent to spaCy pipeline: [token.lemma_ for token in doc if token.is_alpha and not token.is_stop]
    """
    if not text:
        return []

    # Clean punctuation and split
    raw_tokens = re.findall(r'[a-zA-Z]+', text.lower())
    processed = []

    for token in raw_tokens:
        if len(token) <= 1:
            continue
        if remove_stopwords and token in STOP_WORDS:
            continue
        lemma = lemmatize_token(token) if lemmatize else token
        if len(lemma) > 1:
            processed.append(lemma)

    return processed


def strip_leakage(text: str) -> str:
    """Removes category words to prevent label leakage in text classification."""
    return LEAK_WORDS_PATTERN.sub(' ', text)


def build_food_document(food: Dict[str, Any]) -> str:
    """
    Constructs a rich single document from structured attributes.
    Fixes minor data quirk: Folate is removed from minerals.
    """
    minerals = re.sub(r'\bFolate\b,?\s*', '', str(food.get('minerals', '')), flags=re.I).strip(', ')
    return (
        f"{food.get('food_name', '')}. {food.get('category', '')}. "
        f"{food.get('description', '')} {food.get('health_benefits', '')} "
        f"Vitamins: {food.get('vitamins', '')}. Minerals: {minerals}. "
        f"Good for: {food.get('recommended_for', '')}."
    )


def load_dataset(csv_path: str = "data/food_nutrition_dataset.csv") -> List[Dict[str, Any]]:
    """Loads and casts dataset records from CSV."""
    records = []
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append({
                'food_id': int(row['food_id']),
                'food_name': row['food_name'],
                'category': row['category'],
                'description': row['description'],
                'serving_size': row['serving_size'],
                'calories_kcal': int(row['calories_kcal']),
                'protein_g': float(row['protein_g']),
                'carbohydrates_g': float(row['carbohydrates_g']),
                'fat_g': float(row['fat_g']),
                'fiber_g': float(row['fiber_g']),
                'vitamins': row['vitamins'],
                'minerals': row['minerals'],
                'health_benefits': row['health_benefits'],
                'recommended_for': row['recommended_for'],
            })
    return records
