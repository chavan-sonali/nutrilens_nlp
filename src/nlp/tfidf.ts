import { FoodItem } from '../types';
import { preprocessText, buildFoodDocument } from './preprocessor';

export interface TfidfOptions {
  useBigrams?: boolean;
  removeStopwords?: boolean;
  lemmatize?: boolean;
  sublinearTf?: boolean;
}

export class TfidfEngine {
  private vocab: Map<string, number> = new Map();
  private reverseVocab: string[] = [];
  private idf: Float32Array = new Float32Array(0);
  private docVectors: Float32Array[] = [];
  private docCount: number = 0;
  private options: Required<TfidfOptions>;

  constructor(options: TfidfOptions = {}) {
    this.options = {
      useBigrams: options.useBigrams ?? true,
      removeStopwords: options.removeStopwords ?? true,
      lemmatize: options.lemmatize ?? true,
      sublinearTf: options.sublinearTf ?? true,
    };
  }

  /**
   * Generates tokens including unigrams and optional bigrams
   */
  public extractNgrams(tokens: string[]): string[] {
    const ngrams = [...tokens];
    if (this.options.useBigrams && tokens.length > 1) {
      for (let i = 0; i < tokens.length - 1; i++) {
        ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
      }
    }
    return ngrams;
  }

  /**
   * Fits the vectorizer on the food items collection and builds TF-IDF matrix
   */
  public fit(foods: FoodItem[]): void {
    this.docCount = foods.length;
    this.vocab.clear();
    this.reverseVocab = [];

    const docTokenLists: string[][] = [];
    const docFreq: Map<string, number> = new Map();

    for (const food of foods) {
      const docText = buildFoodDocument(food);
      const tokens = preprocessText(docText, {
        removeStopwords: this.options.removeStopwords,
        lemmatize: this.options.lemmatize,
      });
      const ngrams = this.extractNgrams(tokens);
      docTokenLists.push(ngrams);

      const uniqueInDoc = new Set(ngrams);
      for (const term of uniqueInDoc) {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      }
    }

    // Filter terms appearing at least once
    let vocabIndex = 0;
    for (const [term, df] of docFreq.entries()) {
      if (df >= 1) {
        this.vocab.set(term, vocabIndex);
        this.reverseVocab.push(term);
        vocabIndex++;
      }
    }

    // Compute IDF (scikit-learn formula: ln((1 + N) / (1 + df)) + 1)
    const vocabSize = this.reverseVocab.length;
    this.idf = new Float32Array(vocabSize);
    for (let i = 0; i < vocabSize; i++) {
      const term = this.reverseVocab[i];
      const df = docFreq.get(term) || 1;
      this.idf[i] = Math.log((1 + this.docCount) / (1 + df)) + 1.0;
    }

    // Compute L2-normalized TF-IDF vector for each document
    this.docVectors = docTokenLists.map(ngrams => this.vectorizeNgrams(ngrams));
  }

  /**
   * Transforms an n-gram list into a normalized TF-IDF vector
   */
  private vectorizeNgrams(ngrams: string[]): Float32Array {
    const vocabSize = this.reverseVocab.length;
    const vector = new Float32Array(vocabSize);

    // Count term frequencies
    const tfMap = new Map<number, number>();
    for (const term of ngrams) {
      const idx = this.vocab.get(term);
      if (idx !== undefined) {
        tfMap.set(idx, (tfMap.get(idx) || 0) + 1);
      }
    }

    // Apply sublinear TF and multiply by IDF
    let normSq = 0;
    for (const [idx, count] of tfMap.entries()) {
      const tf = this.options.sublinearTf ? 1 + Math.log(count) : count;
      const weight = tf * this.idf[idx];
      vector[idx] = weight;
      normSq += weight * weight;
    }

    // L2 normalize
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < vocabSize; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Transforms a free-text query into a normalized TF-IDF vector
   */
  public transformQuery(query: string): Float32Array {
    const tokens = preprocessText(query, {
      removeStopwords: this.options.removeStopwords,
      lemmatize: this.options.lemmatize,
    });
    const ngrams = this.extractNgrams(tokens);
    return this.vectorizeNgrams(ngrams);
  }

  /**
   * Computes cosine similarity between query and all fitted documents
   */
  public scoreQuery(query: string): Float32Array {
    const qVec = this.transformQuery(query);
    const scores = new Float32Array(this.docCount);
    const vocabSize = this.reverseVocab.length;

    for (let d = 0; d < this.docCount; d++) {
      const dVec = this.docVectors[d];
      let dot = 0;
      for (let i = 0; i < vocabSize; i++) {
        dot += qVec[i] * dVec[i];
      }
      scores[d] = Math.max(0, dot);
    }

    return scores;
  }

  /**
   * Returns top matching words between query and a specific document
   */
  public getMatchedTerms(query: string, docIndex: number, topK: number = 3): Array<{ term: string; weight: number }> {
    const qVec = this.transformQuery(query);
    const dVec = this.docVectors[docIndex];
    const matches: Array<{ term: string; weight: number }> = [];

    for (let i = 0; i < this.reverseVocab.length; i++) {
      if (qVec[i] > 0 && dVec[i] > 0) {
        matches.push({
          term: this.reverseVocab[i],
          weight: qVec[i] * dVec[i],
        });
      }
    }

    matches.sort((a, b) => b.weight - a.weight);
    return matches.slice(0, topK);
  }

  /**
   * Gets top distinctive keywords for a set of document indices (e.g., category)
   */
  public getTopKeywordsForDocs(docIndices: number[], topK: number = 8): Array<{ term: string; score: number }> {
    if (docIndices.length === 0) return [];
    const vocabSize = this.reverseVocab.length;
    const avgVector = new Float32Array(vocabSize);

    for (const d of docIndices) {
      const vec = this.docVectors[d];
      for (let i = 0; i < vocabSize; i++) {
        avgVector[i] += vec[i];
      }
    }

    const termScores: Array<{ term: string; score: number }> = [];
    for (let i = 0; i < vocabSize; i++) {
      const meanScore = avgVector[i] / docIndices.length;
      if (meanScore > 0) {
        termScores.push({ term: this.reverseVocab[i], score: meanScore });
      }
    }

    termScores.sort((a, b) => b.score - a.score);
    return termScores.slice(0, topK);
  }
}
