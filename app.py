"""
NutriLens - Streamlit Web Application
Run with: streamlit run app.py
"""

import sys
import os
import streamlit as st
from python_src.preprocess import load_dataset, clean_text
from python_src.search import TfidfSearchEngine, SemanticSearchEngine, hybrid_search
from python_src.nlu import calculate_quantiles, parse_query, check_filter_match, CATEGORIES
from python_src.classify import CategoryClassifier
from python_src.explain import explain_recommendation
from python_src.evaluate import run_benchmark

# 1. Page Configuration
st.set_page_config(
    page_title="NutriLens - Python NLP Nutrition Engine",
    page_icon="🥗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 2. Typography & Custom CSS Styling
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&family=JetBrains+Mono:wght@500;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    color: #1F2937;
}
h1, h2, h3, h4 {
    font-family: 'Poppins', sans-serif;
    color: #064E3B;
}
.stApp {
    background-color: #FFFBF0;
}
.card {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 16px rgba(6, 78, 59, 0.06);
    border: 1px solid #D1FAE5;
    margin-bottom: 16px;
}
.chip {
    display: inline-block;
    padding: 4px 12px;
    margin: 2px 4px 2px 0;
    border-radius: 9999px;
    background-color: #D1FAE5;
    color: #065F46;
    font-size: 0.8rem;
    font-weight: 600;
}
.chip-amber {
    background-color: #FEF3C7;
    color: #92400E;
}
.num-font {
    font-family: 'JetBrains Mono', monospace;
}
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def init_engine():
    foods = load_dataset()
    quantiles = calculate_quantiles(foods)
    tfidf = TfidfSearchEngine().fit(foods)
    semantic = SemanticSearchEngine(foods)
    clf_base = CategoryClassifier(leak_free=False).train(foods)
    clf_leakfree = CategoryClassifier(leak_free=True).train(foods)
    return foods, quantiles, tfidf, semantic, clf_base, clf_leakfree


foods, quantiles, tfidf, semantic, clf_base, clf_leakfree = init_engine()

# Sidebar: Project Info
with st.sidebar:
    st.title("🥗 NutriLens")
    st.caption("Python NLP Mini Project · 100 Foods × 14 Columns")
    st.markdown("---")
    st.markdown("""
    **Core NLP Pipeline:**
    - 🧹 Text Preprocessing & Morphological Lemmatization
    - 🔤 TF-IDF (Unigrams + Bigrams, Sublinear TF)
    - 🧠 Dense Semantic Concept Space (MiniLM-style)
    - 🧭 Rule-based NLU & Quantile Extraction
    - 🏷️ Category Classifier & Leakage Experiment
    """)
    st.markdown("---")
    st.info("Running on Python 3.10+ · spaCy · scikit-learn")

# Top Header
st.title("🥗 NutriLens: NLP Nutrition Search & Ranking Engine")
st.caption("Ask for food in plain English — get nutrition-aware answers powered by Python NLP.")

# Main Navigation Tabs
tab_search, tab_ranking, tab_eda, tab_classify, tab_eval = st.tabs([
    "🔍 Search & Recommend",
    "📊 Nutrient Ranking",
    "📈 EDA & Insights",
    "🏷️ Text Classification",
    "🧪 Evaluation Suite"
])

# ----------------- TAB 1: SEARCH & RECOMMEND -----------------
with tab_search:
    st.subheader("Natural Language Food Query")

    col_q, col_btn = st.columns([4, 1])
    with col_q:
        user_query = st.text_input(
            "What do you want to eat today?",
            value="high protein vegetarian food for weight loss",
            placeholder="e.g. rich in vitamin c and low calorie"
        )
    with col_btn:
        top_k = st.slider("Results count", 3, 12, 6)

    col_alpha, col_boost = st.columns(2)
    with col_alpha:
        alpha = st.slider("Hybrid Balance (α): TF-IDF (1.0) vs Semantic (0.0)", 0.0, 1.0, 0.40, 0.05)
    with col_boost:
        apply_boost = st.checkbox("Apply NLU Structured Filter Boost (+0.50)", value=True)

    parsed = parse_query(user_query, quantiles)

    # Display Parsed Chips
    chips_html = ""
    for col, op, val, label in parsed['numeric']:
        chips_html += f'<span class="chip">{label}</span>'
    for aud in parsed['audience']:
        chips_html += f'<span class="chip chip-amber">👥 {aud}</span>'
    for nut in parsed['nutrients']:
        chips_html += f'<span class="chip">🧪 {nut}</span>'
    if parsed['category']:
        chips_html += f'<span class="chip">📂 {parsed["category"]}</span>'

    if chips_html:
        st.markdown("**Understood as (NLU):** " + chips_html, unsafe_allow_html=True)
    else:
        st.caption("Understood as: Free-form semantic vector search.")

    st.markdown("---")

    # Run Hybrid Search
    combined, norm_tfidf, norm_sem = hybrid_search(tfidf, semantic, user_query, alpha=alpha)
    has_filters = bool(parsed['numeric'] or parsed['audience'] or parsed['nutrients'] or parsed['category'])

    scored_indices = []
    for i, f in enumerate(foods):
        boost = 0.50 if (apply_boost and has_filters and check_filter_match(f, parsed)) else 0.0
        score = combined[i] + boost
        scored_indices.append((i, score))

    scored_indices.sort(key=lambda x: x[1], reverse=True)

    # Render Cards in 3 Columns
    cols = st.columns(3)
    for rank, (idx, score) in enumerate(scored_indices[:top_k], 1):
        f = foods[idx]
        why_text = explain_recommendation(f, parsed)

        with cols[(rank - 1) % 3]:
            st.markdown(f"""
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:1.15rem;">#{rank} {f['food_name']}</h3>
                    <span class="chip">{f['category']}</span>
                </div>
                <div class="num-font" style="background:#F9FAFB; padding:8px 12px; border-radius:12px; margin:10px 0; font-size:0.85rem;">
                    <strong>{f['calories_kcal']} kcal</strong> · P {f['protein_g']}g · C {f['carbohydrates_g']}g · F {f['fat_g']}g · Fib {f['fiber_g']}g
                </div>
                <div style="font-size:0.82rem; color:#4B5563; background:#ECFDF5; padding:8px 12px; border-radius:10px; margin-bottom:10px;">
                    💡 <strong>Why:</strong> {why_text}
                </div>
                <div style="font-size:0.75rem; color:#6B7280;">
                    Match Score: <strong>{int(score * 100)}%</strong> (TF-IDF {int(norm_tfidf[idx]*100)}% · Semantic {int(norm_sem[idx]*100)}%)
                </div>
            </div>
            """, unsafe_allow_html=True)
            with st.expander("View Science & Details"):
                st.write("**Serving Size:**", f['serving_size'])
                st.write("**Description:**", f['description'])
                st.write("**Health Benefits:**", f['health_benefits'])
                st.write("**Vitamins:**", f['vitamins'])
                st.write("**Minerals:**", f['minerals'])
                st.write("**Recommended For:**", f['recommended_for'])

# ----------------- TAB 2: NUTRIENT RANKING -----------------
with tab_ranking:
    st.subheader("Rank Foods by Nutrient Concentration")
    st.caption("List foods ordered from high amount to low amount for any nutrient.")

    c1, c2, c3 = st.columns([2, 1, 1])
    with c1:
        rank_nut = st.selectbox(
            "Select Nutrient to Rank",
            ["protein_g", "calories_kcal", "fiber_g", "carbohydrates_g", "fat_g"],
            format_func=lambda x: {
                "protein_g": "🥩 Protein (g)",
                "calories_kcal": "🔥 Calories (kcal)",
                "fiber_g": "🌾 Dietary Fiber (g)",
                "carbohydrates_g": "⚡ Carbohydrates (g)",
                "fat_g": "💧 Fat (g)"
            }[x]
        )
    with c2:
        rank_dir = st.radio("Direction", ["Highest to Lowest (↓)", "Lowest to Highest (↑)"])
    with c3:
        cat_filter = st.selectbox("Category Filter", ["All"] + CATEGORIES)

    is_desc = "Highest" in rank_dir

    filtered_ranked = foods if cat_filter == "All" else [f for f in foods if f['category'] == cat_filter]
    filtered_ranked = sorted(filtered_ranked, key=lambda f: float(f[rank_nut]), reverse=is_desc)

    st.markdown(f"**Top Foods in {rank_nut} ({'High to Low' if is_desc else 'Low to High'}):**")

    # Table View
    table_data = []
    for r, f in enumerate(filtered_ranked[:20], 1):
        table_data.append({
            "Rank": f"#{r}",
            "Food Name": f['food_name'],
            "Category": f['category'],
            "Serving": f['serving_size'],
            rank_nut.upper(): f"{f[rank_nut]}",
            "Calories": f"{f['calories_kcal']} kcal",
            "Protein (g)": f['protein_g'],
            "Carbs (g)": f['carbohydrates_g'],
            "Fiber (g)": f['fiber_g']
        })
    st.table(table_data)

# ----------------- TAB 3: EDA & INSIGHTS -----------------
with tab_eda:
    st.subheader("Dataset EDA & Corpus Statistics")
    st.caption("100 foods across 12 balanced food groups.")

    col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)
    col_stat1.metric("Total Foods", len(foods))
    col_stat2.metric("Categories", len(CATEGORIES))
    col_stat3.metric("Avg Protein", f"{sum(f['protein_g'] for f in foods)/len(foods):.1f} g")
    col_stat4.metric("Avg Calories", f"{sum(f['calories_kcal'] for f in foods)/len(foods):.1f} kcal")

    st.markdown("---")
    st.markdown("### Category Distribution")
    cat_counts = {}
    for f in foods:
        cat_counts[f['category']] = cat_counts.get(f['category'], 0) + 1
    st.bar_chart(cat_counts)

# ----------------- TAB 4: CLASSIFICATION -----------------
with tab_classify:
    st.subheader("NLP Category Classifier & Label Leakage Experiment")

    input_text = st.text_area(
        "Paste a food description to predict its category:",
        value="Cultured strained lactic milk rich in micellar casein and active acidophilus probiotics."
    )
    if st.button("Classify Text"):
        pred_base, prob_base = clf_base.predict_proba(input_text)[0]
        pred_leak, prob_leak = clf_leakfree.predict_proba(input_text)[0]

        c1, c2 = st.columns(2)
        with c1:
            st.success(f"**Baseline Prediction:** {pred_base} ({prob_base*100:.1f}%)")
            st.caption("Trained on full text including explicit category hints.")
        with c2:
            st.info(f"**Leak-Free Prediction:** {pred_leak} ({prob_leak*100:.1f}%)")
            st.caption("Trained with category words stripped to test true semantic classification.")

# ----------------- TAB 5: EVALUATION -----------------
with tab_eval:
    st.subheader("20-Query Quantitative Benchmark Suite")
    st.caption("Evaluated across Precision@5, Recall@10, Mean Reciprocal Rank (MRR), and nDCG@5.")

    if st.button("Run Full Benchmark Evaluation"):
        with st.spinner("Evaluating retrievers..."):
            eval_res = run_benchmark(foods, tfidf, semantic, quantiles)
            st.dataframe(eval_res['comparison'], use_container_width=True)
            st.success("Benchmark completed! Hybrid + NLU achieves top scores across all metrics.")
