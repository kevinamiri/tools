import os
import random
import uuid
from PIL import Image
import torch
from diffusers import StableDiffusionXLPipeline, EulerAncestralDiscreteScheduler

def save_image(img, output_dir):
    # 🖼️ Save the generated image with a unique name
    unique_name = str(uuid.uuid4()) + ".png"
    output_path = os.path.join(output_dir, unique_name)
    img.save(output_path)
    return output_path

def randomize_seed(seed, randomize):
    # 🎲 Randomize the seed if requested
    if randomize:
        seed = random.randint(0, 2**32 - 1)
    return seed

def load_pipeline():
    # 🚀 Load the pipeline
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "fluently/Fluently-XL-v2",
        torch_dtype=torch.float16,
        use_safetensors=True,
    )
    pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
    pipe.load_lora_weights("ehristoforu/dalle-3-xl-v2", weight_name="dalle-3-xl-lora-v2.safetensors", adapter_name="dalle")
    pipe.set_adapters("dalle")
    pipe.to("cuda")
    return pipe

def generate_image(pipe, prompt, output_dir):
    # 🖌️ Generate image for the prompt
    negative_prompt = ""
    seed = 0
    width = 1024
    height = 1024
    guidance_scale = 3.0
    randomize_seed_val = True

    # 🎨 Generate the image
    seed = randomize_seed(seed, randomize_seed_val)
    images = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        guidance_scale=guidance_scale,
        num_inference_steps=25,
        num_images_per_prompt=1,
        cross_attention_kwargs={"scale": 0.65},
        output_type="pil",
    ).images

    # 💾 Save the generated image
    image_path = save_image(images[0], output_dir)
    print(f"Image generated and saved: {image_path}")

def generate_images_from_file(prompt_file, output_dir):
    # 📖 Read prompts from file
    with open(prompt_file, "r") as file:
        prompts = file.readlines()

    # 🚀 Load the pipeline
    pipe = load_pipeline()

    # 🖌️ Generate images for each prompt
    for prompt in prompts:
        prompt = prompt.strip()
        generate_image(pipe, prompt, output_dir)

def generate_images_from_code(prompts, output_dir):
    # 🚀 Load the pipeline
    pipe = load_pipeline()

    # 🖌️ Generate images for each prompt
    for prompt in prompts:
        generate_image(pipe, prompt, output_dir)

# 🏁 Run the script
if __name__ == "__main__":
    output_dir = "/content/drive/MyDrive/foldername/generated_images"  # 📂 Directory to save the generated images

    # ✨ Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # 📝 Define the prompts directly in the code
    code_prompts = [
        "neon holography crystal cat",
        "a cat eating a piece of cheese",
        "an astronaut riding a horse in space",
        "a cartoon of a boy playing with a tiger",
        "a cute robot artist painting on an easel, concept art",
        "a close up of a woman wearing a transparent, prismatic, elaborate nemeses headdress, over the should pose, brown skin-tone"
    ]

    # 📝 Path to the file containing prompts
    prompt_file = "/content/drive/MyDrive/foldername"

    # 🎬 Generate images based on the prompts from code
    generate_images_from_code(code_prompts, output_dir)

    # 🎬 Generate images based on the prompts from file
    generate_images_from_file(prompt_file, output_dir)
