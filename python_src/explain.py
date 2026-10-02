"""
NutriLens - Explainability Module
Module 8: Explainable Recommendation ("Why this food?")
"""

from typing import Dict, Any, List


def explain_recommendation(
    food: Dict[str, Any],
    parsed: Dict[str, Any],
    top_terms: List[str] = None
) -> str:
    """Generates an intuitive, evidence-based reason for a recommended item."""
    reasons = []

    # 1. Numeric matches
    for col, op, val, label in parsed.get('numeric', []):
        f_val = food[col]
        is_match = (f_val >= val) if op == '>=' else (f_val <= val)
        if is_match:
            clean_col = col.replace('_g', '').replace('_kcal', '')
            reasons.append(f"{clean_col} = {f_val} ({op} {val:.1f})")

    # 2. Audience matches
    for tag in parsed.get('audience', []):
        if tag.lower() in food.get('recommended_for', '').lower():
            reasons.append(f"recommended for {tag}")

    # 3. Nutrient matches
    combined_nutrients = (food.get('vitamins', '') + ', ' + food.get('minerals', '')).lower()
    for n in parsed.get('nutrients', []):
        if n.lower() in combined_nutrients:
            reasons.append(f"contains {n}")

    # 4. Category match
    if parsed.get('category') and food.get('category') == parsed['category']:
        reasons.append(f"matches category {food['category']}")

    # 5. Fallback semantic reasons
    if not reasons:
        if top_terms:
            reasons.append(f"matched keywords: {', '.join(top_terms[:2])}")
        else:
            reasons.append("high contextual and nutritional relevance to query")

    return " · ".join(reasons)
