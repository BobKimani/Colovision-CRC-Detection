"""
Image preprocessing for CRC segmentation model.
Handles resizing, normalization, and tensor conversion.
"""

import numpy as np
from PIL import Image
import io
from typing import Tuple

# ImageNet mean and std for normalization
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Target model input size
MODEL_INPUT_SIZE = 256

def preprocess_image(image_bytes: bytes) -> Tuple[Image.Image, np.ndarray]:
    """
    Preprocess image for model inference.
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        tuple: (original PIL Image, preprocessed NCHW tensor)
    """
    # Load image from bytes
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Failed to load image: {e}")
    
    # Convert RGBA to RGB if necessary
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Store original for overlay
    original_image = image.copy()
    
    # Resize to model input size
    image = image.resize((MODEL_INPUT_SIZE, MODEL_INPUT_SIZE), Image.LANCZOS)
    
    # Convert to numpy array
    img_array = np.array(image, dtype=np.float32) / 255.0  # Normalize to [0, 1]
    
    # Apply ImageNet normalization
    img_array = (img_array - IMAGENET_MEAN) / IMAGENET_STD
    
    # Convert HWC to CHW format
    img_array = img_array.transpose(2, 0, 1)  # (256, 256, 3) -> (3, 256, 256)
    
    # Add batch dimension: NCHW
    img_array = np.expand_dims(img_array, axis=0)  # (3, 256, 256) -> (1, 3, 256, 256)
    
    return original_image, img_array

def preprocess_file(image_path: str) -> Tuple[Image.Image, np.ndarray]:
    """
    Preprocess image from file path.
    
    Args:
        image_path: Path to image file
        
    Returns:
        tuple: (original PIL Image, preprocessed NCHW tensor)
    """
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    return preprocess_image(image_bytes)

