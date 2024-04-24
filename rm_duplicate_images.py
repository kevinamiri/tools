from sentence_transformers import SentenceTransformer, util
from PIL import Image
import glob
import numpy as np
import shutil

# Load the pre-trained model from sentence transformers
model = SentenceTransformer('clip-ViT-B-32')

# Load and sort image names from the directory alphabetically
img_names = sorted(glob.glob('/home/kevin/generate-ts/image-search-kat/jpgs/*.jpg'))
print("Images:", len(img_names))

# Generate embeddings for the images
img_emb = model.encode([Image.open(filepath) for filepath in img_names], batch_size=128, convert_to_tensor=True, show_progress_bar=True)

def remove_duplicate_images(img_names, img_emb, similarity_threshold=0.95):
    # Calculate cosine similarity matrix
    cosine_sim = util.cos_sim(img_emb, img_emb)
    
    # Convert to numpy array for easier manipulation
    cosine_sim_np = cosine_sim.numpy()
    
    # Ignore self-similarity by setting diagonal to zero
    np.fill_diagonal(cosine_sim_np, 0)
    
    # Initialize set for indices of images to remove and list for tracking duplicates
    to_remove = set()
    duplicates = []
    
    # Iterate over the similarity matrix and identify duplicates
    for i in range(len(cosine_sim_np)):
        for j in range(i + 1, len(cosine_sim_np)):
            if cosine_sim_np[i, j] > similarity_threshold:
                # Check which image to keep: the one with the lower index, i.e., lexicographically earlier
                if img_names[i] < img_names[j]:
                    to_remove.add(j)
                    duplicates.append(img_names[j])
                else:
                    to_remove.add(i)
                    duplicates.append(img_names[i])
    
    # Retain unique images
    unique_img_names = [img for i, img in enumerate(img_names) if i not in to_remove]
    
    return unique_img_names, duplicates

# Set the similarity thresh
similarity_threshold = 0.97
unique_img_names, duplicates = remove_duplicate_images(img_names, img_emb, similarity_threshold)

print(f"Original number of images: {len(img_names)}")
print(f"Number of unique images after removal: {len(unique_img_names)}")
print(f"Number of duplicated images: {len(duplicates)}")

# Move duplicates to a new folder
for duplicate in duplicates:
    shutil.move(duplicate, '/home/kevin/generate-ts/image-search-kat/dup2')
