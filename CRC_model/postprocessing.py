"""
Postprocessing for CRC segmentation results.
Converts binary masks to colored overlay visualizations and Grad-CAM heatmaps.
"""

import numpy as np
import cv2
from PIL import Image
from typing import Tuple
from pathlib import Path

# Color scheme for segmentation overlay
CANCER_COLOR = (255, 0, 0, 180)  # Red with transparency
BACKGROUND_COLOR = (0, 0, 0, 0)  # Transparent

def create_overlay(original_image: Image.Image, mask: np.ndarray) -> Image.Image:
    """
    Create colored overlay mask on original image.
    
    Args:
        original_image: Original PIL Image
        mask: Binary segmentation mask (256, 256) with values 0 or 1
        
    Returns:
        PIL Image with overlay applied
    """
    # Resize original image to match mask size for overlay
    original_resized = original_image.resize((256, 256), Image.LANCZOS)
    
    # Convert mask to RGBA overlay
    overlay = np.zeros((256, 256, 4), dtype=np.uint8)
    
    # Apply cancer color where mask == 1
    cancer_indices = mask == 1
    overlay[cancer_indices] = CANCER_COLOR
    
    # Create PIL Image from overlay
    overlay_img = Image.fromarray(overlay, mode='RGBA')
    
    # Blend overlay with original image
    result = original_resized.copy()
    result = result.convert('RGBA')
    result = Image.alpha_composite(result, overlay_img)
    result = result.convert('RGB')
    
    # Resize back to original dimensions
    final_result = result.resize(original_image.size, Image.LANCZOS)
    
    return final_result

def save_overlay(original_image: Image.Image, mask: np.ndarray, output_path: str):
    """
    Create and save overlay to file.
    
    Args:
        original_image: Original PIL Image
        mask: Binary segmentation mask
        output_path: Path to save overlay
    """
    overlay_img = create_overlay(original_image, mask)
    
    # Ensure output directory exists
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    overlay_img.save(output_path, format="PNG")
    print(f"✅ Overlay saved to: {output_path}")

def create_color_mask(mask: np.ndarray, alpha: int = 180) -> Image.Image:
    """
    Create colored mask visualization.
    
    Args:
        mask: Binary segmentation mask
        alpha: Transparency level (0-255)
        
    Returns:
        PIL Image with colored mask
    """
    # Create RGBA mask
    colored_mask = np.zeros((256, 256, 4), dtype=np.uint8)
    
    # Apply cancer color
    cancer_indices = mask == 1
    colored_mask[cancer_indices] = (255, 0, 0, alpha)
    
    return Image.fromarray(colored_mask, mode='RGBA')

def create_gradcam_overlay(original_image: Image.Image, heatmap: np.ndarray, alpha: float = 0.35) -> Image.Image:
    """
    Blend Grad-CAM heatmap with original image using adaptive normalization and blending.

    Args:
        original_image: PIL Image
        heatmap: Grad-CAM heatmap (float32, range [0, 1]) or binary mask
        alpha: Overlay intensity (0.3–0.5 recommended)

    Returns:
        PIL Image with Grad-CAM overlay
    """
    # Ensure heatmap is float32
    heatmap = heatmap.astype(np.float32)

    # If binary, make it smoother via distance transform
    if heatmap.max() <= 1.0 and len(np.unique(heatmap)) <= 2:
        if np.sum(heatmap) > 0:
            inverse_mask = (1 - heatmap).astype(np.uint8)
            distance = cv2.distanceTransform(inverse_mask, cv2.DIST_L2, 5)
            distance_norm = distance / (np.max(distance) + 1e-6)
            heatmap = 1.0 - distance_norm  # closer = hotter
        else:
            heatmap = np.zeros_like(heatmap, dtype=np.float32)

    # Normalize to 0–1
    heatmap = np.clip(heatmap, 0, 1)
    if heatmap.max() > 0:
        heatmap /= heatmap.max()

    # Resize to match image
    original_resized = np.array(original_image.resize((heatmap.shape[1], heatmap.shape[0]), Image.LANCZOS))
    if original_resized.dtype != np.uint8:
        original_resized = np.uint8(255 * np.clip(original_resized, 0, 1))

    # Apply JET colormap
    heatmap_uint8 = np.uint8(255 * heatmap)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Blend
    overlay = cv2.addWeighted(original_resized, 1 - alpha, heatmap_color, alpha, 0)

    # Resize back to original
    overlay_pil = Image.fromarray(overlay).resize(original_image.size, Image.LANCZOS)
    return overlay_pil

def get_mask_statistics(mask: np.ndarray) -> dict:
    """
    Get statistics about the segmentation mask.
    
    Args:
        mask: Binary segmentation mask
        
    Returns:
        Dictionary with statistics
    """
    total_pixels = mask.size
    cancer_pixels = np.sum(mask == 1)
    background_pixels = np.sum(mask == 0)
    
    return {
        "total_pixels": int(total_pixels),
        "cancer_pixels": int(cancer_pixels),
        "background_pixels": int(background_pixels),
        "cancer_percentage": float((cancer_pixels / total_pixels) * 100)
    }

