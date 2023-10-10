# Guide: Visualizing Text Embeddings with Python

This guide will walk you through the process of visualizing text embeddings using Python libraries such as `pandas`, `scikit-learn`, and `matplotlib`. The code provided is designed to:

1. Load a dataset of text samples and their categories.
2. Generate embeddings for these text samples.
3. Reduce the dimensionality of the embeddings.
4. Plot the embeddings in a 3D space.

## Prerequisites

- Python 3.x
- Jupyter Notebook or Jupyter Lab

## Step-by-Step Instructions

### Step 1: Install Required Packages

First, you'll need to install the required Python packages. Open a Jupyter Notebook and run the following command:

```python
%pip install matplotlib pandas plotly scipy scikit-learn ipympl
```

### Step 2: Import Data

We'll use a dataset in JSONL format, where each line is a JSON object. The dataset contains text samples and their categories.

```python
import pandas as pd

samples = pd.read_json("data/dbpedia_samples.jsonl", lines=True)
categories = sorted(samples["category"].unique())
print("Categories of DBpedia samples:", samples["category"].value_counts())
samples.head()
```

### Step 3: Generate Text Embeddings

We'll use the `get_embeddings` function from the `openai.embeddings_utils` library to generate embeddings for the text samples.

```python
from openai.embeddings_utils import get_embeddings

matrix = get_embeddings(samples["text"].to_list(), engine="text-embedding-ada-002")
```

### Step 4: Reduce Embedding Dimensionality

We'll use Principal Component Analysis (PCA) to reduce the dimensionality of the embeddings to 3 dimensions.

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=3)
vis_dims = pca.fit_transform(matrix)
samples["embed_vis"] = vis_dims.tolist()
```

### Step 5: Plot the Embeddings

Finally, we'll plot the embeddings in a 3D space using `matplotlib`.

```python
%matplotlib widget
import matplotlib.pyplot as plt
import numpy as np

fig = plt.figure(figsize=(10, 5))
ax = fig.add_subplot(projection='3d')
cmap = plt.get_cmap("tab20")

for i, cat in enumerate(categories):
    sub_matrix = np.array(samples[samples["category"] == cat]["embed_vis"].to_list())
    x = sub_matrix[:, 0]
    y = sub_matrix[:, 1]
    z = sub_matrix[:, 2]
    colors = [cmap(i / len(categories))] * len(sub_matrix)
    ax.scatter(x, y, zs=z, zdir='z', c=colors, label=cat)

ax.set_xlabel('x')
ax.set_ylabel('y')
ax.set_zlabel('z')
ax.legend(bbox_to_anchor=(1.1, 1))
```

## Conclusion

This guide has shown you how to visualize text embeddings in a 3D space. You can use this approach to explore the relationships between different categories of text in your dataset.
