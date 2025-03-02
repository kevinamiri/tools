// ===== IMPORTS =====

/**
 * Import necessary utilities and templates
 */
import { config } from 'dotenv';
import OpenAI from "openai";

// Initialize environment
config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== TEXT PROCESSING =====

/**
 * Clean text by removing special characters and converting to lowercase
 * 
 * @example
 * const text = "Hello, World!";
 * const cleaned = cleanText(text);
 * console.log(cleaned); // "hello world"
 */
const clean_text = (text: string): string => text.toLowerCase().replace(/[^\w\s]/g, '');

/**
 * Convert text to set based on specified tokenization type
 * 
 * @example
 * const text = "hello world";
 * const charSet = toSet(text, 'char');
 * console.log(charSet); // Set {"h", "e", "l", "o", " ", "w", "r", "d"}
 * 
 * const wordSet = toSet(text, 'word');
 * console.log(wordSet); // Set {"hello", "world"}
 */
const toSet = (text: string, type: 'char' | 'word' | 'ngram', n = 3): Set<string> => {
  const cleaned = clean_text(text);
  switch (type) {
    case 'char':
      return new Set(cleaned);
    case 'word':
      return new Set(cleaned.split(/\s+/).filter(Boolean));
    case 'ngram':
      return new Set(
        Array.from(
          { length: cleaned.length - n + 1 }, 
          (_, i) => cleaned.slice(i, i + n)
        )
      );
  }
}

type Method = 'fuzzy' | 'jaccard' | 'char' | 'word' | 'ngram'

interface Result {
  score: number
  method: Method
  details: {
    matches?: string[]
    distance?: number
    intersection?: number
    union?: number
  }
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * @example
 * const distance = calculate_levenshtein_distance("kitten", "sitting");
 * console.log(distance); // 3
 */
const calculate_levenshtein_distance = (str1: string, str2: string): number => {
  const matrix = Array.from({ length: str1.length + 1 }, (_, i) => 
    Array.from({ length: str2.length + 1 }, (_, j) => j === 0 ? i : 0)
  );
  
  matrix[0] = Array.from({ length: str2.length + 1 }, (_, i) => i);

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[str1.length][str2.length];
};

/**
 * Calculate set-based similarity metrics
 * 
 * @example
 * const set1 = new Set(["a", "b", "c"]);
 * const set2 = new Set(["b", "c", "d"]);
 * const similarity = calculate_set_similarity(set1, set2);
 * console.log(similarity);
 * // { 
 * //   matches: ["b", "c"], 
 * //   intersection: 2, 
 * //   union: 4, 
 * //   score: 0.5 
 * // }
 */
const calculate_set_similarity = (set1: Set<string>, set2: Set<string>) => {
  const intersection = new Set([...set1].filter(item => set2.has(item)));
  const union = new Set([...set1, ...set2]);
  
  return {
    matches: Array.from(intersection),
    intersection: intersection.size,
    union: union.size,
    score: intersection.size / union.size
  };
};

/**
 * Calculate fuzzy similarity score based on Levenshtein distance
 * 
 * @example
 * const result = calculate_fuzzy_similarity("hello", "hallo");
 * console.log(result);
 * // {
 * //   score: 0.8,
 * //   method: "fuzzy",
 * //   details: { distance: 1 }
 * // }
 */
const calculate_fuzzy_similarity = (str1: string, str2: string): Result => {
  const distance = calculate_levenshtein_distance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return {
    score: 1 - distance / maxLength,
    method: 'fuzzy',
    details: { distance }
  };
};

/**
 * Calculate Jaccard similarity score based on set overlap
 * 
 * @example
 * const result = calculate_jaccard_similarity("hello world", "hello there", 'word');
 * console.log(result);
 * // {
 * //   score: 0.33,
 * //   method: "word",
 * //   details: { 
 * //     matches: ["hello"], 
 * //     intersection: 1, 
 * //     union: 3 
 * //   }
 * // }
 */
const calculate_jaccard_similarity = (str1: string, str2: string, type: 'char' | 'word' | 'ngram', n = 3): Result => {
  const { matches, intersection, union, score } = calculate_set_similarity(
    toSet(str1, type, n),
    toSet(str2, type, n)
  );
  
  return {
    score,
    method: type,
    details: { matches, intersection, union }
  };
};

/**
 * Compare two strings using multiple similarity methods
 * 
 * @example
 * const similarity = compare_string_similarity("quick brown fox", "quick brown dog");
 * console.log(similarity.fuzzy.score);    // ~0.87
 * console.log(similarity.jaccard.score);  // ~0.67
 */
const compare_string_similarity = (str1: string, str2: string) => ({
  fuzzy: calculate_fuzzy_similarity(str1, str2),
  jaccard: calculate_jaccard_similarity(str1, str2, 'word')
});

/**
 * Compare two strings using Jaccard similarity with different tokenizations
 * 
 * @example
 * const similarity = compare_jaccard_tokenized("hello world", "hello universe");
 * console.log(similarity.char.score);   // ~0.45 (character-level similarity)
 * console.log(similarity.word.score);   // ~0.33 (word-level similarity)
 * console.log(similarity.ngram.score);  // ~0.20 (n-gram similarity)
 */
const compare_jaccard_tokenized = (str1: string, str2: string, ngram_size = 3) => ({
  char: calculate_jaccard_similarity(str1, str2, 'char'),
  word: calculate_jaccard_similarity(str1, str2, 'word'),
  ngram: calculate_jaccard_similarity(str1, str2, 'ngram', ngram_size)
});

/**
 * Calculate cosine similarity between two vectors
 * 
 * @example
 * const vec_a = [1, 2, 3];
 * const vec_b = [4, 5, 6];
 * const similarity = calculate_cosine_similarity(vec_a, vec_b);
 * console.log(similarity); // ~0.974
 */
const calculate_cosine_similarity = (vec_a: number[], vec_b: number[]): number => {
  const dot_product = vec_a.reduce((acc, curr, idx) => acc + curr * vec_b[idx], 0);
  const mag_a = Math.sqrt(vec_a.reduce((acc, curr) => acc + curr * curr, 0));
  const mag_b = Math.sqrt(vec_b.reduce((acc, curr) => acc + curr * curr, 0));
  return dot_product / (mag_a * mag_b);
};

/**
 * Calculate semantic similarity between two strings using embeddings
 * 
 * @example
 * const str1 = "The cat sat on the mat";
 * const str2 = "A feline was resting on a rug";
 * const similarity = await calculate_semantic_similarity(str1, str2);
 * console.log(similarity); // ~0.89 (high semantic similarity)
 */
const calculate_semantic_similarity = async (str1: string, str2: string): Promise<number> => {
  try {
    const embeddings_response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: [str1, str2]
    });

    const embeddings = embeddings_response.data.map(embed => embed.embedding);
    if (embeddings.length === 2) {
      return calculate_cosine_similarity(embeddings[0], embeddings[1]);
    } else {
      throw new Error("Could not retrieve embeddings for both strings.");
    }
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0; // Return 0 similarity in case of an error
  }
};

/**
 * Text similarity calculator combining multiple methods
 * 
 * @example
 * const result = await calculate_text_similarity("Hello world", "Hello there");
 * console.log(result.fuzzy);     // ~0.73
 * console.log(result.jaccard);   // ~0.50
 * console.log(result.semantic);  // ~0.86
 */
const calculate_text_similarity = async (str1: string, str2: string): Promise<Record<string, number>> => {
  const methods = compare_string_similarity(str1, str2);
  const semantic = await calculate_semantic_similarity(str1, str2);
  
  return {
    fuzzy: methods.fuzzy.score,
    jaccard: methods.jaccard.score,
    semantic
  };
};

/**
 * Calculate exact match score
 * 
 * @example
 * const score1 = calculate_exact_match_score("hello world", "hello world");  // 1.0
 * const score2 = calculate_exact_match_score("hello world", "hello");        // 0.0
 */
const calculate_exact_match_score = (expected: string, actual: string): number => 
  expected.trim() === actual.trim() ? 1 : 0;

/**
 * Calculate BLEU score (simplified)
 * 
 * @example
 * const score1 = calculate_bleu_score("the cat sat on the mat", "the cat sat on the mat");  // 1.0
 * const score2 = calculate_bleu_score("the cat sat on the mat", "a cat sits on the mat");   // ~0.67
 */
const calculate_bleu_score = (expected: string, actual: string): number => {
  // Simplified BLEU calculation
  const expected_words = expected.split(' ');
  const actual_words = actual.split(' ');
  
  if (expected_words.length === 0) return 0;
  
  const overlap = expected_words.filter(w => actual_words.includes(w)).length;
  return overlap / expected_words.length;
};

/**
 * Calculate semantic similarity using OpenAI embeddings
 * 
 * @example
 * const score = await calculate_semantic_similarity("The sky is blue", "The color of the sky is azure");
 * console.log(score); // ~0.85 (high semantic similarity despite different wording)
 */
const semantic_similarity = async (expected: string, actual: string): Promise<number> => {
  return await calculate_semantic_similarity(expected, actual);
};


export {
  calculate_levenshtein_distance,
  calculate_set_similarity,
  calculate_fuzzy_similarity,
  calculate_jaccard_similarity,
  compare_string_similarity,
};
