from sentence_transformers import SentenceTransformer, util
from PIL import Image
import glob
import numpy as np
import shutil

model = SentenceTransformer('clip-ViT-B-32')
img_names = list(glob.glob('images/png_images/*.png'))
print("Images:", len(img_names))
img_emb = model.encode([Image.open(filepath) for filepath in img_names], batch_size=128, convert_to_tensor=True, show_progress_bar=True)

# Creates a function that remove duplicate images using embedding and similarities
def remove_duplicate_images(img_names, img_emb, similarity_threshold=0.95):
    # Calculate cosine similarity matrix
    cosine_sim = util.cos_sim(img_emb, img_emb)
    
    # Convert to numpy array for easier manipulation
    cosine_sim_np = cosine_sim.numpy()
    
    # Identify duplicates (ignoring self-similarity)
    np.fill_diagonal(cosine_sim_np, 0)
    
    # Initialize list to keep track of duplicates' indices
    to_remove = set()
    duplicates = []  # List to keep track of duplicate images
    
    # Loop over the similarity matrix and mark duplicates
    for i in range(len(cosine_sim_np)):
        for j in range(i + 1, len(cosine_sim_np)):
            if cosine_sim_np[i, j] > similarity_threshold and j not in to_remove:
                to_remove.add(j)
                duplicates.append(img_names[j])
    
    # Filter out duplicates based on identified indices
    unique_img_names = [img for i, img in enumerate(img_names) if i not in to_remove]
    
    return unique_img_names, duplicates

# Example usage:
similarity_threshold = 0.97 # Adjust this threshold as needed
unique_img_names, duplicates = remove_duplicate_images(img_names, img_emb, similarity_threshold)

print(f"Original number of images: {len(img_names)}")
print(f"Number of unique images after removal: {len(unique_img_names)}")
print(f"Number of duplicated images: {len(duplicates)}")

# move duplicates to a new folder
for duplicate in duplicates:
    shutil.move(duplicate, 'images/duplicate-images')
