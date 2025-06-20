import pytesseract
from PIL import Image, ExifTags
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def extract_exif(image):
    exif_data = image._getexif()
    if not exif_data:
        return ""
    exif = {}
    for tag, value in exif_data.items():
        label = ExifTags.TAGS.get(tag, tag)
        exif[label] = value
    return "\n".join(f"{k}: {v}" for k, v in exif.items())

def caption_image(image):
    inputs = processor(images=image, return_tensors="pt")
    out = model.generate(**inputs)
    return processor.decode(out[0], skip_special_tokens=True)

def parse(path):
    try:
        image = Image.open(path)
        text = pytesseract.image_to_string(image)
        if not text.strip():
            text = caption_image(image)
        meta = extract_exif(image)
        return f"{text}\n\nMetadata:\n{meta}"
    except Exception as e:
        return f"Image parsing failed: {e}"