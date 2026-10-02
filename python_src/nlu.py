"""
NutriLens - Natural Language Understanding (NLU)
Module 5: Rule-Based Query Understanding & Percentile Extraction
"""

import re
from typing import List, Dict, Any, Tuple, Optional

AUDIENCE_PATTERNS = {
    'Diabetic Patients': re.compile(r'diabet|blood sugar|sugar patient', re.I),
    'Weight Loss': re.compile(r'weight loss|lose weight|diet|slim|slimming|calorie deficit', re.I),
    'Fitness Enthusiasts': re.compile(r'gym|workout|bodybuild|fitness|muscle', re.I),
    'Athletes': re.compile(r'athlet|sport|endurance|marathon|runner', re.I),
    'Heart Patients': re.compile(r'heart|cardiac|cholesterol|blood pressure|hypertension', re.I),
    'Vegetarians': re.compile(r'\bveg\b|vegetarian', re.I),
    'Vegans': re.compile(r'vegan|plant[- ]based', re.I),
    'Pregnant Women': re.compile(r'pregnan|maternal|prenatal', re.I),
    'Children': re.compile(r'child|kid|toddler|growth', re.I),
    'Elderly': re.compile(r'elder|senior|old age|aging', re.I),
}

NUTRIENT_LIST = [
    'vitamin c', 'vitamin a', 'vitamin d', 'vitamin k', 'vitamin e',
    'vitamin b12', 'vitamin b6', 'folate', 'iron', 'calcium', 'potassium',
    'magnesium', 'zinc', 'selenium', 'phosphorus', 'iodine', 'copper', 'omega-3'
]

CATEGORIES = [
    'Vegetable', 'Fruit', 'Grain', 'Pulse', 'Dairy', 'Nut & Seed',
    'Seafood', 'Spice', 'Beverage', 'Meat', 'Egg', 'Herb'
]


def calculate_quantiles(foods: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    """Calculates 25th and 75th percentiles for numerical nutrients."""
    def get_q(arr: List[float], q: float) -> float:
        s = sorted(arr)
        pos = (len(s) - 1) * q
        base = int(pos)
        rest = pos - base
        if base + 1 < len(s):
            return s[base] + rest * (s[base + 1] - s[base])
        return s[base]

    keys = ['protein_g', 'calories_kcal', 'fat_g', 'fiber_g', 'carbohydrates_g']
    quantiles = {}
    for k in keys:
        vals = [float(f[k]) for f in foods]
        quantiles[k] = {
            'q25': round(get_q(vals, 0.25), 1),
            'q75': round(get_q(vals, 0.75), 1),
        }
    return quantiles


def parse_query(raw_query: str, quantiles: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
    """Parses natural language query into structured nutritional and demographic constraints."""
    q = raw_query.lower()
    parsed = {
        'raw': raw_query,
        'numeric': [],
        'audience': [],
        'nutrients': [],
        'category': None
    }

    if not q.strip():
        return parsed

    # 1. Numeric thresholds
    if re.search(r'high[- ]protein|protein[- ]rich|rich in protein|lots of protein|more protein', q):
        parsed['numeric'].append(('protein_g', '>=', quantiles['protein_g']['q75'], f"protein ≥ {quantiles['protein_g']['q75']}g"))

    if re.search(r'low[- ]cal|light|fewer calories|low calorie|burn fat', q):
        parsed['numeric'].append(('calories_kcal', '<=', quantiles['calories_kcal']['q25'], f"calories ≤ {quantiles['calories_kcal']['q25']} kcal"))

    if re.search(r'low[- ]fat|fat free|non-fat|least fat', q):
        parsed['numeric'].append(('fat_g', '<=', quantiles['fat_g']['q25'], f"fat ≤ {quantiles['fat_g']['q25']}g"))

    if re.search(r'high[- ]fi(b|be)r|fi(b|be)r[- ]rich|rich in fi(b|be)r|more fiber', q):
        parsed['numeric'].append(('fiber_g', '>=', quantiles['fiber_g']['q75'], f"fiber ≥ {quantiles['fiber_g']['q75']}g"))

    if re.search(r'low[- ]carb|keto|low carbohydrate|cut carbs', q):
        parsed['numeric'].append(('carbohydrates_g', '<=', quantiles['carbohydrates_g']['q25'], f"carbs ≤ {quantiles['carbohydrates_g']['q25']}g"))

    # 2. Audience target detection
    for tag, pattern in AUDIENCE_PATTERNS.items():
        if pattern.search(q):
            parsed['audience'].append(tag)

    # 3. Nutrient mentions
    for n in NUTRIENT_LIST:
        if n in q:
            parsed['nutrients'].append(n)

    # 4. Category filter
    for cat in CATEGORIES:
        root = cat.lower().split()[0].replace('&', '')
        if re.search(rf'\b{root}s?\b', q):
            parsed['category'] = cat
            break

    return parsed


def check_filter_match(food: Dict[str, Any], parsed: Dict[str, Any]) -> bool:
    """Evaluates whether a food item satisfies parsed constraints."""
    for col, op, val, _ in parsed.get('numeric', []):
        f_val = food[col]
        if op == '>=' and f_val < val:
            return False
        if op == '<=' and f_val > val:
            return False

    for tag in parsed.get('audience', []):
        if tag.lower() not in food.get('recommended_for', '').lower():
            return False

    combined_nutrients = (food.get('vitamins', '') + ' ' + food.get('minerals', '')).lower()
    for n in parsed.get('nutrients', []):
        if n.lower() not in combined_nutrients:
            return False

    cat = parsed.get('category')
    if cat and food.get('category') != cat:
        return False

    return True
