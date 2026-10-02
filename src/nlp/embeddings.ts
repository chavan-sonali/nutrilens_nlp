import { FoodItem } from '../types';
import { buildFoodDocument } from './preprocessor';

// 16 Core Nutritional & Physiological Latent Semantic Concept Dimensions
export interface SemanticDimension {
  id: string;
  name: string;
  keywords: string[];
}

export const SEMANTIC_DIMENSIONS: SemanticDimension[] = [
  {
    id: 'gut_digestive',
    name: 'Gut Health & Digestion',
    keywords: [
      'gut', 'microbiome', 'digest', 'digestion', 'digestive', 'stomach', 'bowel', 'colon',
      'probiotic', 'prebiotic', 'ferment', 'fermented', 'enzyme', 'papain', 'bromelain',
      'actinidin', 'inulin', 'fiber', 'laxative', 'flora', 'gastric', 'bloat', 'motility', 'ulcer'
    ]
  },
  {
    id: 'muscle_hypertrophy',
    name: 'Muscle Growth & Recovery',
    keywords: [
      'muscle', 'hypertrophy', 'protein', 'bcaa', 'amino', 'anabolic', 'synthesis', 'repair',
      'recovery', 'lean', 'gym', 'workout', 'bodybuild', 'bodybuilding', 'casein', 'whey', 'mass'
    ]
  },
  {
    id: 'energy_endurance',
    name: 'Energy & Endurance',
    keywords: [
      'energy', 'stamina', 'endurance', 'workout', 'pre-workout', 'preworkout', 'glycogen',
      'fuel', 'athletic', 'athlete', 'performance', 'fatigue', 'active', 'vitality', 'run', 'sport'
    ]
  },
  {
    id: 'cardiovascular',
    name: 'Heart & Blood Vessels',
    keywords: [
      'heart', 'cardiac', 'cardiovascular', 'arterial', 'artery', 'vessel', 'vascular',
      'blood pressure', 'hypertension', 'cholesterol', 'ldl', 'hdl', 'triglyceride', 'nitric oxide',
      'perfusion', 'vasodilation', 'atherosclerosis', 'endothelial', 'omega-3', 'dha', 'epa'
    ]
  },
  {
    id: 'glycemic_metabolism',
    name: 'Blood Sugar & Diabetes',
    keywords: [
      'diabetes', 'diabetic', 'glycemic', 'glucose', 'insulin', 'sugar', 'postprandial',
      'amylase', 'starch', 'metabolic', 'keto', 'low carb', 'carb', 'resistance', 'stabilize'
    ]
  },
  {
    id: 'weight_satiety',
    name: 'Weight Loss & Satiety',
    keywords: [
      'weight loss', 'lose weight', 'slim', 'diet', 'slimming', 'satiety', 'fullness',
      'low calorie', 'light', 'fewer calories', 'lean', 'deficit', 'curb hunger', 'thermogenesis'
    ]
  },
  {
    id: 'immunity_antioxidant',
    name: 'Immunity & Antioxidants',
    keywords: [
      'immune', 'immunity', 'antioxidant', 'oxidative', 'free radical', 'phagocytosis',
      'polyphenol', 'flavonoid', 'vitamin c', 'curcumin', 'resveratrol', 'quercetin',
      'inflammation', 'anti-inflammatory', 'ascorbic', 'infection', 'defense'
    ]
  },
  {
    id: 'bone_joint',
    name: 'Bones & Joint Cartilage',
    keywords: [
      'bone', 'skeleton', 'skeletal', 'joint', 'cartilage', 'calcium', 'vitamin d',
      'vitamin k', 'matrix', 'mineralization', 'density', 'osteopenia', 'osteoporosis',
      'arthritis', 'collagen', 'phosphorus'
    ]
  },
  {
    id: 'cognitive_sleep',
    name: 'Brain, Focus & Sleep',
    keywords: [
      'brain', 'cognitive', 'cognition', 'memory', 'synaptic', 'neural', 'neuron', 'focus',
      'alert', 'alertness', 'sleep', 'relax', 'relaxation', 'calm', 'anxiety', 'gaba',
      'serotonin', 'melatonin', 'tryptophan', 'theanine', 'caffeine', 'neuroprotective'
    ]
  },
  {
    id: 'ocular_vision',
    name: 'Eye & Visual Acuity',
    keywords: [
      'eye', 'ocular', 'vision', 'retina', 'retinal', 'macular', 'macula', 'lutein',
      'zeaxanthin', 'rhodopsin', 'blue light', 'photoreceptor', 'cataract'
    ]
  },
  {
    id: 'maternal_prenatal',
    name: 'Maternal & Prenatal Health',
    keywords: [
      'pregnant', 'pregnancy', 'prenatal', 'maternal', 'embryo', 'fetal', 'fetus',
      'neural tube', 'folate', 'folic', 'morning sickness', 'trimester'
    ]
  },
  {
    id: 'hydration_fluid',
    name: 'Hydration & Electrolytes',
    keywords: [
      'hydrate', 'hydration', 'rehydrate', 'electrolyte', 'potassium', 'sodium', 'water',
      'diuretic', 'fluid', 'cramp', 'cramping', 'perspiration', 'sweat', 'renal'
    ]
  },
  {
    id: 'thyroid_hormone',
    name: 'Thyroid & Hormonal Health',
    keywords: [
      'thyroid', 'hormone', 'iodine', 'selenium', 'zinc', 'testosterone', 'prostate',
      'estrogen', 'lignan', 'isoflavone', 'basal metabolic'
    ]
  },
  {
    id: 'dermal_skin',
    name: 'Skin, Hair & Anti-Aging',
    keywords: [
      'skin', 'dermal', 'cutaneous', 'elasticity', 'anti-aging', 'photoaging', 'wrinkle',
      'collagen', 'firmness', 'complexion', 'wound', 'uv', 'silica'
    ]
  },
  {
    id: 'plant_based_vegan',
    name: 'Plant-Based & Vegetarian',
    keywords: [
      'vegetarian', 'vegan', 'plant', 'plant-based', 'cruciferous', 'legume', 'pulse',
      'herbaceous', 'botanical', 'dairy-free', 'meat-free'
    ]
  },
  {
    id: 'seafood_marine',
    name: 'Marine & Omega-3 Rich',
    keywords: [
      'seafood', 'fish', 'marine', 'ocean', 'pelagic', 'salmon', 'tuna', 'shrimp',
      'omega-3', 'astaxanthin', 'epipelagic', 'shellfish'
    ]
  }
];

export class SemanticEngine {
  private docEmbeddings: Float32Array[] = [];
  private foods: FoodItem[] = [];
  private dimCount: number = SEMANTIC_DIMENSIONS.length;

  constructor(foods: FoodItem[]) {
    this.foods = foods;
    this.computeEmbeddings();
  }

  /**
   * Pre-computes normalized dense semantic embedding for each food document
   */
  private computeEmbeddings(): void {
    this.docEmbeddings = this.foods.map(food => {
      const docText = buildFoodDocument(food).toLowerCase();
      return this.encodeText(docText);
    });
  }

  /**
   * Projects any string into the 16-D semantic embedding space and L2 normalizes it
   */
  public encodeText(text: string): Float32Array {
    const vector = new Float32Array(this.dimCount);
    const lower = text.toLowerCase();

    let normSq = 0;
    for (let i = 0; i < this.dimCount; i++) {
      const dim = SEMANTIC_DIMENSIONS[i];
      let weight = 0;
      for (const kw of dim.keywords) {
        // Match whole word or stemmed root
        const regex = new RegExp(`\\b${kw}`, 'gi');
        const matches = lower.match(regex);
        if (matches) {
          weight += matches.length * (kw.includes(' ') ? 1.5 : 1.0);
        }
      }

      // Nonlinear squashing: tanh so dominant terms don't blow up
      const val = Math.tanh(weight * 0.45);
      vector[i] = val;
      normSq += val * val;
    }

    // Normalize to unit sphere (L2 norm)
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < this.dimCount; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Computes semantic cosine similarity between query and all stored food embeddings
   */
  public scoreQuery(query: string): Float32Array {
    const qVec = this.encodeText(query);
    const scores = new Float32Array(this.foods.length);

    // If query has 0 semantic match in these dimensions, fallback to small baseline
    let qNorm = 0;
    for (let i = 0; i < this.dimCount; i++) qNorm += qVec[i] * qVec[i];
    if (qNorm === 0) {
      return scores;
    }

    for (let d = 0; d < this.foods.length; d++) {
      const dVec = this.docEmbeddings[d];
      let dot = 0;
      for (let i = 0; i < this.dimCount; i++) {
        dot += qVec[i] * dVec[i];
      }
      // Cosine similarity in range [0, 1]
      scores[d] = Math.max(0, dot);
    }

    return scores;
  }

  /**
   * Identifies top active semantic dimensions for an explanation
   */
  public getTopDimensions(query: string, docIndex: number, topK: number = 2): string[] {
    const qVec = this.encodeText(query);
    const dVec = this.docEmbeddings[docIndex];
    const scoredDims: Array<{ name: string; score: number }> = [];

    for (let i = 0; i < this.dimCount; i++) {
      const prod = qVec[i] * dVec[i];
      if (prod > 0.05) {
        scoredDims.push({ name: SEMANTIC_DIMENSIONS[i].name, score: prod });
      }
    }

    scoredDims.sort((a, b) => b.score - a.score);
    return scoredDims.slice(0, topK).map(d => d.name);
  }
}
