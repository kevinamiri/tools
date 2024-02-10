

```py
from typing import List, Tuple
from openai import OpenAI
client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> List[float]:
   text = text.replace("\n", " ")
   return client.embeddings.create(input = [text], model=model).data[0].embedding

from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# Your texts
texts: List[str] = ["Text 1", "Text 2", "Text 2"]  # Replace with your actual texts

# Convert texts to embeddings
embeddings: np.ndarray = np.array([get_embedding(text) for text in texts])

# Calculate cosine similarity matrix
similarity_matrix: np.ndarray = cosine_similarity(embeddings)

# Set a threshold for considering texts as duplicates
threshold: float = 0.5
# Identify duplicates
duplicates: List[Tuple[int, int]] = []
for i in range(len(similarity_matrix)):
    for j in range(i+1, len(similarity_matrix)):
        if similarity_matrix[i][j] > threshold:
            duplicates.append((i, j))

# Print duplicate pairs
for dup in duplicates:
    print(f"Text {dup[0]} and Text {dup[1]} are duplicates.")

# Assuming you want to keep the first text in each duplicate pair
unique_text_indices: set = set(range(len(texts))) - {j for i, j in duplicates}

# Filter unique texts
unique_texts: List[str] = [texts[i] for i in unique_text_indices]

print("Unique texts:", unique_texts)

```
