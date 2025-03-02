



[json_jsonl.py](https://github.com/kevinamiri/tools/blob/main/json_jsonl.py)

```bash

# excutable
chmod +x json_jsonl.py

# JSONl to JSON
python3 json_jsonl.py /path/to/jsonl_file.jsonl /path/to/json_file.json

# JSON to JSONL
python3 json_jsonl.py /path/to/json_file.json /path/to/jsonl_file.jsonl
```



`nlp_similarity.ts` : A toolkit provides a collection of functions for calculating text similarity using various methods, ranging from simple string distance metrics to advanced semantic similarity using OpenAI embeddings.

## Features

- **Fuzzy Similarity (Levenshtein Distance):** Measures the similarity between two strings based on the number of edits (insertions, deletions, substitutions) needed to change one string into the other.
- **Jaccard Similarity:** Calculates similarity based on the overlap of sets of characters, words, or n-grams between two strings.
- **Semantic Similarity (OpenAI Embeddings):** Leverages OpenAI's `text-embedding-ada-002` model to compute semantic similarity, capturing the meaning and context of the text.
- **Exact Match Score:**  Determines if two strings are exactly the same after trimming whitespace. Useful for evaluation.
- **Simplified BLEU Score:**  Provides a basic BLEU score calculation based on word overlap, useful for evaluating LLMs

## Getting Started

### Prerequisites

- Node.js installed
- npm or yarn package manager
- An OpenAI API key (required for semantic similarity functions)

### Installation

1. **Clone or download the file:**
   If you are using this as part of a larger project, place the file (e.g.`nlp_similarity.ts`) in your project directory.

2. **Install dependencies:**
   If you intend to use the semantic similarity features or want to run this code in a Node.js environment, you'll need to install the `dotenv` and `openai` packages:

   ```bash
   npm install dotenv openai
   # or
   yarn add dotenv openai
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root of your project directory and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=YOUR_OPENAI_API_KEY
   ```

   Replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key.

### Usage

You can import and use the functions in your JavaScript or TypeScript code.

**Example (JavaScript - CommonJS):**

```javascript
const textSimilarity = require('./text_similarity'); // Assuming the file is named text_similarity.js

// Fuzzy Similarity
const fuzzyResult = textSimilarity.calculate_fuzzy_similarity("kitten", "sitting");
console.log("Fuzzy Similarity:", fuzzyResult);
// Output: Fuzzy Similarity: { score: 0.7142857142857143, method: 'fuzzy', details: { distance: 3 } }

// Jaccard Similarity (word level)
const jaccardWordResult = textSimilarity.calculate_jaccard_similarity("hello world", "hello there", 'word');
console.log("Jaccard Word Similarity:", jaccardWordResult);
// Output: Jaccard Word Similarity: { score: 0.3333333333333333, method: 'word', details: { matches: [ 'hello' ], intersection: 1, union: 3 } }

// Compare String Similarity (Fuzzy and Jaccard Word)
const comparisonResult = textSimilarity.compare_string_similarity("quick brown fox", "quick brown dog");
console.log("String Similarity Comparison:", comparisonResult);
// Output: String Similarity Comparison: { fuzzy: { score: 0.875, method: 'fuzzy', details: { distance: 2 } }, jaccard: { score: 0.6666666666666666, method: 'word', details: { matches: [ 'brown', 'quick' ], intersection: 2, union: 3 } } }

// Semantic Similarity (requires OpenAI API key and is asynchronous)
async function runSemanticSimilarity() {
  const semanticScore = await textSimilarity.semantic_similarity("The sky is blue", "The color of the sky is azure");
  console.log("Semantic Similarity:", semanticScore);
  // Output: Semantic Similarity: 0.89234... (approximate)
}
runSemanticSimilarity();
```

**Example (TypeScript - ES Modules):**

```typescript
import {
  calculate_fuzzy_similarity,
  calculate_jaccard_similarity,
  compare_string_similarity,
  semantic_similarity,
  calculate_text_similarity
} from './text_similarity'; // Assuming the file is named text_similarity.ts

// Fuzzy Similarity
const fuzzyResult = calculate_fuzzy_similarity("kitten", "sitting");
console.log("Fuzzy Similarity:", fuzzyResult);

// Jaccard Similarity (word level)
const jaccardWordResult = calculate_jaccard_similarity("hello world", "hello there", 'word');
console.log("Jaccard Word Similarity:", jaccardWordResult);

// Compare String Similarity (Fuzzy and Jaccard Word)
const comparisonResult = compare_string_similarity("quick brown fox", "quick brown dog");
console.log("String Similarity Comparison:", comparisonResult);

// Semantic Similarity (requires OpenAI API key and is asynchronous)
async function runSemanticSimilarity() {
  const semanticScore = await semantic_similarity("The sky is blue", "The color of the sky is azure");
  console.log("Semantic Similarity:", semanticScore);

  // Calculate Text Similarity (all methods: fuzzy, jaccard, semantic)
  const fullSimilarityResult = await calculate_text_similarity("Hello world", "Hello there");
  console.log("Full Text Similarity Result:", fullSimilarityResult);
  // Output: Full Text Similarity Result: { fuzzy: 0.7272727272727273, jaccard: 0.5, semantic: 0.859... }
}
runSemanticSimilarity();
```

## API Reference

### `clean_text(text: string): string`
Cleans the input text by converting it to lowercase and removing special characters (non-alphanumeric and non-whitespace).

### `toSet(text: string, type: 'char' | 'word' | 'ngram', n = 3): Set<string>`
Converts text into a set of tokens based on the specified type:
- `'char'`: Set of individual characters.
- `'word'`: Set of words (split by whitespace).
- `'ngram'`: Set of n-grams of size `n`.

### `calculate_levenshtein_distance(str1: string, str2: string): number`
Calculates the Levenshtein distance between two strings.

### `calculate_set_similarity(set1: Set<string>, set2: Set<string>)`
Calculates set-based similarity metrics (intersection, union, and Jaccard score) for two sets. Returns an object with `matches`, `intersection`, `union`, and `score`.

### `calculate_fuzzy_similarity(str1: string, str2: string): Result`
Calculates fuzzy similarity score based on Levenshtein distance. Returns a `Result` object with `score`, `method: 'fuzzy'`, and `details: { distance }`.

### `calculate_jaccard_similarity(str1: string, str2: string, type: 'char' | 'word' | 'ngram', n = 3): Result`
Calculates Jaccard similarity score based on set overlap for the given tokenization `type` and n-gram size `n`. Returns a `Result` object with `score`, `method`, and `details` including `matches`, `intersection`, and `union`.

### `compare_string_similarity(str1: string, str2: string)`
Compares two strings using fuzzy and Jaccard (word-level) similarity methods. Returns an object containing results for `'fuzzy'` and `'jaccard'` methods.

### `compare_jaccard_tokenized(str1: string, str2: string, ngram_size = 3)`
Compares two strings using Jaccard similarity with character, word, and n-gram tokenization. Returns an object containing results for `'char'`, `'word'`, and `'ngram'` methods.

### `calculate_cosine_similarity(vec_a: number[], vec_b: number[]): number`
Calculates the cosine similarity between two numeric vectors.

### `calculate_semantic_similarity(str1: string, str2: string): Promise<number>`
Calculates semantic similarity between two strings using OpenAI's `text-embedding-ada-002` model. Requires an OpenAI API key. Returns a promise that resolves to the semantic similarity score (a number between 0 and 1).

### `calculate_text_similarity(str1: string, str2: string): Promise<Record<string, number>>`
Calculates text similarity using fuzzy, Jaccard (word-level), and semantic methods. Returns a promise that resolves to an object containing scores for `'fuzzy'`, `'jaccard'`, and `'semantic'`.

### `calculate_exact_match_score(expected: string, actual: string): number`
Calculates the exact match score (1.0 for exact match, 0.0 otherwise) between two strings after trimming whitespace.

### `calculate_bleu_score(expected: string, actual: string): number`
Calculates a simplified BLEU score based on word overlap between two strings.

### `semantic_similarity(expected: string, actual: string): Promise<number>`
Alias for `calculate_semantic_similarity`. Calculates semantic similarity between two strings using OpenAI embeddings.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key. Required for using `calculate_semantic_similarity` and `semantic_similarity` functions.
