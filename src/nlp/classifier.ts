import { FoodItem, FoodCategory } from '../types';
import { CATEGORIES } from './nlu';
import { preprocessText, stripCategoryLeakage } from './preprocessor';

export interface CategoryPrediction {
  category: FoodCategory;
  probability: number;
}

export interface ClassificationReport {
  accuracy: number;
  macroF1: number;
  categories: Array<{
    name: FoodCategory;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusionMatrix: number[][];
}

export class CategoryClassifier {
  private categories: FoodCategory[] = CATEGORIES;
  private featureWeights: Map<string, Float32Array> = new Map(); // term -> weight per category
  private categoryPriors: Float32Array;
  private leakFree: boolean;

  constructor(leakFree: boolean = false) {
    this.leakFree = leakFree;
    this.categoryPriors = new Float32Array(this.categories.length);
  }

  /**
   * Trains a Multinomial Naive Bayes / Logistic model with Laplace smoothing on food descriptions
   */
  public train(foods: FoodItem[]): void {
    const numClasses = this.categories.length;
    this.categoryPriors = new Float32Array(numClasses);
    this.featureWeights.clear();

    const classDocCounts = new Int32Array(numClasses);
    const classTotalWords = new Float32Array(numClasses);
    const termClassCounts = new Map<string, Int32Array>();

    for (const food of foods) {
      const classIdx = this.categories.indexOf(food.category);
      if (classIdx === -1) continue;

      classDocCounts[classIdx]++;

      let rawText = `${food.description} ${food.health_benefits}`;
      if (this.leakFree) {
        rawText = stripCategoryLeakage(rawText);
      }

      const tokens = preprocessText(rawText);
      for (const token of tokens) {
        classTotalWords[classIdx]++;
        let counts = termClassCounts.get(token);
        if (!counts) {
          counts = new Int32Array(numClasses);
          termClassCounts.set(token, counts);
        }
        counts[classIdx]++;
      }
    }

    // Priors: log(P(c))
    const totalDocs = foods.length;
    for (let c = 0; c < numClasses; c++) {
      this.categoryPriors[c] = Math.log((classDocCounts[c] + 1) / (totalDocs + numClasses));
    }

    // Likelihood weights: log((count(w, c) + alpha) / (totalWords(c) + alpha * vocabSize))
    const vocabSize = termClassCounts.size;
    const alpha = 0.8; // Laplace smoothing parameter

    for (const [term, counts] of termClassCounts.entries()) {
      const weights = new Float32Array(numClasses);
      for (let c = 0; c < numClasses; c++) {
        const pWordGivenClass = (counts[c] + alpha) / (classTotalWords[c] + alpha * vocabSize);
        weights[c] = Math.log(pWordGivenClass);
      }
      this.featureWeights.set(term, weights);
    }
  }

  /**
   * Predicts class probabilities for an arbitrary input text
   */
  public predictProbabilities(text: string): CategoryPrediction[] {
    const numClasses = this.categories.length;
    const logPosteriors = new Float32Array(this.categoryPriors);

    let clean = text;
    if (this.leakFree) {
      clean = stripCategoryLeakage(clean);
    }

    const tokens = preprocessText(clean);
    for (const token of tokens) {
      const weights = this.featureWeights.get(token);
      if (weights) {
        for (let c = 0; c < numClasses; c++) {
          logPosteriors[c] += weights[c];
        }
      }
    }

    // Softmax normalization
    let maxLog = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      if (logPosteriors[c] > maxLog) maxLog = logPosteriors[c];
    }

    let sumExp = 0;
    const expVals = new Float32Array(numClasses);
    for (let c = 0; c < numClasses; c++) {
      expVals[c] = Math.exp(logPosteriors[c] - maxLog);
      sumExp += expVals[c];
    }

    const predictions: CategoryPrediction[] = [];
    for (let c = 0; c < numClasses; c++) {
      predictions.push({
        category: this.categories[c],
        probability: sumExp > 0 ? expVals[c] / sumExp : 1 / numClasses,
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);
    return predictions;
  }

  /**
   * Predicts the most likely category for an input text
   */
  public predict(text: string): FoodCategory {
    const probs = this.predictProbabilities(text);
    return probs[0].category;
  }

  /**
   * Evaluates classification performance using Leave-One-Out / K-Fold cross validation
   */
  public evaluate(foods: FoodItem[]): ClassificationReport {
    const numClasses = this.categories.length;
    const confusionMatrix = Array.from({ length: numClasses }, () => new Array(numClasses).fill(0));

    // Leave-One-Out validation across all foods
    for (let i = 0; i < foods.length; i++) {
      const trainSet = foods.filter((_, idx) => idx !== i);
      const testItem = foods[i];

      const model = new CategoryClassifier(this.leakFree);
      model.train(trainSet);

      const predicted = model.predict(`${testItem.description} ${testItem.health_benefits}`);
      const trueIdx = this.categories.indexOf(testItem.category);
      const predIdx = this.categories.indexOf(predicted);

      if (trueIdx !== -1 && predIdx !== -1) {
        confusionMatrix[trueIdx][predIdx]++;
      }
    }

    // Compute metrics
    let totalCorrect = 0;
    let sumF1 = 0;
    let activeCategoriesCount = 0;

    const perCategory = this.categories.map((cat, c) => {
      let tp = confusionMatrix[c][c];
      let fn = 0;
      let fp = 0;

      for (let j = 0; j < numClasses; j++) {
        if (j !== c) {
          fn += confusionMatrix[c][j];
          fp += confusionMatrix[j][c];
        }
      }

      const support = tp + fn;
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = support > 0 ? tp / support : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      totalCorrect += tp;
      if (support > 0) {
        sumF1 += f1;
        activeCategoriesCount++;
      }

      return {
        name: cat,
        precision,
        recall,
        f1,
        support,
      };
    });

    const accuracy = foods.length > 0 ? totalCorrect / foods.length : 0;
    const macroF1 = activeCategoriesCount > 0 ? sumF1 / activeCategoriesCount : 0;

    return {
      accuracy,
      macroF1,
      categories: perCategory,
      confusionMatrix,
    };
  }
}
