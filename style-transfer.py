import cv2
import torch
import random
import tempfile
import numpy as np
from pathlib import Path
from PIL import Image
from diffusers import ControlNetModel, StableDiffusionXLControlNetPipeline, TCDScheduler
import spaces
import gradio as gr
from huggingface_hub import hf_hub_download, snapshot_download
from ip_adapter import IPAdapterXL
import os

snapshot_download(
    repo_id="h94/IP-Adapter", allow_patterns="sdxl_models/*", local_dir="."
)

# global variable
MAX_SEED = np.iinfo(np.int32).max
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if str(device).__contains__("cuda") else torch.float32

# initialization
base_model_path = "stabilityai/stable-diffusion-xl-base-1.0"
image_encoder_path = "sdxl_models/image_encoder"
ip_ckpt = "sdxl_models/ip-adapter_sdxl.bin"

controlnet_path = "diffusers/controlnet-canny-sdxl-1.0"
controlnet = ControlNetModel.from_pretrained(
    controlnet_path, use_safetensors=False, torch_dtype=torch.float16
).to(device)

# load Hyper SD

pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
    base_model_path,
    controlnet=controlnet,
    torch_dtype=torch.float16,
    variant="fp16",
    add_watermarker=False,
).to(device)
pipe.set_progress_bar_config(disable=True)
pipe.scheduler = TCDScheduler.from_config(pipe.scheduler.config)
pipe.load_lora_weights(
    hf_hub_download("ByteDance/Hyper-SD", "Hyper-SDXL-1step-lora.safetensors")
)
eta = 1.0

ip_model = IPAdapterXL(
    pipe,
    image_encoder_path,
    ip_ckpt,
    device,
    target_blocks=["up_blocks.0.attentions.1"],
)


def resize_img(
    input_image,
    max_side=1280,
    min_side=1024,
    size=None,
    pad_to_max_side=False,
    mode=Image.BILINEAR,
    base_pixel_number=64,
):
    w, h = input_image.size
    if size is not None:
        w_resize_new, h_resize_new = size
    else:
        ratio = min_side / min(h, w)
        w, h = round(ratio * w), round(ratio * h)
        ratio = max_side / max(h, w)
        input_image = input_image.resize([round(ratio * w), round(ratio * h)], mode)
        w_resize_new = (round(ratio * w) // base_pixel_number) * base_pixel_number
        h_resize_new = (round(ratio * h) // base_pixel_number) * base_pixel_number
    input_image = input_image.resize([w_resize_new, h_resize_new], mode)

    if pad_to_max_side:
        res = np.ones([max_side, max_side, 3], dtype=np.uint8) * 255
        offset_x = (max_side - w_resize_new) // 2
        offset_y = (max_side - h_resize_new) // 2
        res[offset_y : offset_y + h_resize_new, offset_x : offset_x + w_resize_new] = (
            np.array(input_image)
        )
        input_image = Image.fromarray(res)
    return input_image


@spaces.GPU(enable_queue=True)
def create_image(
    image_pil,
    input_image,
    prompt,
    n_prompt,
    scale,
    control_scale,
    guidance_scale,
    num_inference_steps,
    seed,
    target="Load only style blocks",
    neg_content_prompt=None,
    neg_content_scale=0,
):
    seed = random.randint(0, MAX_SEED) if seed == -1 else seed
    if target == "Load original IP-Adapter":

        ip_model = IPAdapterXL(
            pipe, image_encoder_path, ip_ckpt, device, target_blocks=["blocks"]
        )
    elif target == "Load only style blocks":

        ip_model = IPAdapterXL(
            pipe,
            image_encoder_path,
            ip_ckpt,
            device,
            target_blocks=["up_blocks.0.attentions.1"],
        )
    elif target == "Load style+layout block":

        ip_model = IPAdapterXL(
            pipe,
            image_encoder_path,
            ip_ckpt,
            device,
            target_blocks=["up_blocks.0.attentions.1", "down_blocks.2.attentions.1"],
        )

    if input_image is not None:
        input_image = resize_img(input_image, max_side=1024)
        cv_input_image = pil_to_cv2(input_image)
        detected_map = cv2.Canny(cv_input_image, 50, 200)
        canny_map = Image.fromarray(cv2.cvtColor(detected_map, cv2.COLOR_BGR2RGB))
    else:
        canny_map = Image.new("RGB", (1024, 1024), color=(255, 255, 255))
        control_scale = 0

    if float(control_scale) == 0:
        canny_map = canny_map.resize((1024, 1024))

    if len(neg_content_prompt) > 0 and neg_content_scale != 0:
        images = ip_model.generate(
            pil_image=image_pil,
            prompt=prompt,
            negative_prompt=n_prompt,
            scale=scale,
            guidance_scale=guidance_scale,
            num_samples=1,
            num_inference_steps=num_inference_steps,
            seed=seed,
            image=canny_map,
            controlnet_conditioning_scale=float(control_scale),
            neg_content_prompt=neg_content_prompt,
            neg_content_scale=neg_content_scale,
            eta=1.0,
        )
    else:
        images = ip_model.generate(
            pil_image=image_pil,
            prompt=prompt,
            negative_prompt=n_prompt,
            scale=scale,
            guidance_scale=guidance_scale,
            num_samples=1,
            num_inference_steps=num_inference_steps,
            seed=seed,
            image=canny_map,
            controlnet_conditioning_scale=float(control_scale),
            eta=1.0,
        )
    image = images[0]
    return image


def pil_to_cv2(image_pil):
    image_np = np.array(image_pil)
    image_cv2 = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    return image_cv2


# Define paths as constants
INPUT_FOLDER = "/content/drive/MyDrive/no-bg-images"
STYLE_IMAGE = "/content/drive/MyDrive/no-bg-images/illustra.png"
OUTPUT_FOLDER = "/content/drive/MyDrive/out"

def process_images(input_folder, style_image, output_folder):
    style_image_pil = Image.open(style_image)

    for filename in os.listdir(input_folder):
        if filename.endswith(".jpg") or filename.endswith(".png"):
            input_image_path = os.path.join(input_folder, filename)
            input_image_pil = Image.open(input_image_path)

            generated_image = create_image(
                image_pil=style_image_pil,
                input_image=input_image_pil,
                prompt="",
                n_prompt="text, watermark, lowres, low quality, worst quality, deformed, glitch, low contrast, noisy, saturation, blurry",
                scale=1.0,
                control_scale=0.8,
                guidance_scale=0.0,
                num_inference_steps=5,
                seed=-1,
                target="Load only style blocks",
                neg_content_prompt="bad eyes",
                neg_content_scale=0,
            )

            output_filename = os.path.splitext(filename)[0] + "_generated.jpg"
            output_path = os.path.join(output_folder, output_filename)
            generated_image.save(output_path)

if __name__ == "__main__":
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    process_images(INPUT_FOLDER, STYLE_IMAGE, OUTPUT_FOLDER)
