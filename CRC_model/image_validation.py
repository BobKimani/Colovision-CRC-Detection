"""
Image validation for colonoscopy images.
Uses heuristic checks to reject non-colonoscopy images.
"""

import numpy as np
from PIL import Image
from typing import Tuple
import io


def validate_colonoscopy_image(image: Image.Image) -> Tuple[bool, str]:
    """
    Validate if an image appears to be a colonoscopy image using heuristic checks.
    
    Args:
        image: PIL Image object
        
    Returns:
        tuple: (is_valid: bool, reason: str)
    """
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    width, height = image.size
    img_array = np.array(image, dtype=np.float32)
    
    # 1. Check image size
    if width < 300 or height < 300:
        return False, "image too small (minimum 300x300 required)"
    
    # 2. Check color distribution
    # Convert to HSV for better color analysis
    hsv_array = np.array(image.convert('HSV'), dtype=np.float32)
    h_channel = hsv_array[:, :, 0]  # Hue (0-179 in PIL)
    s_channel = hsv_array[:, :, 1]  # Saturation (0-255)
    v_channel = hsv_array[:, :, 2]  # Value/Brightness (0-255)
    
    # RGB channels for red/blue comparison
    r_channel = img_array[:, :, 0]
    g_channel = img_array[:, :, 1]
    b_channel = img_array[:, :, 2]
    
    # Calculate mean values
    mean_r = np.mean(r_channel)
    mean_g = np.mean(g_channel)
    mean_b = np.mean(b_channel)
    mean_s = np.mean(s_channel)
    mean_v = np.mean(v_channel)
    
    # Check: Red channel should be higher than Blue
    # Colonoscopy images have red/pink/brown tones - red should be at least 15% higher than blue
    if mean_r <= mean_b * 1.15:  # More lenient: Red must be at least 15% higher than blue
        return False, "color mismatch (red channel not dominant over blue)"
    
    # Additional check: Red should also be higher than Green (colonoscopy images are red/pink, not green)
    # More lenient - only check if green is significantly higher
    if mean_g > mean_r * 1.2:  # Only reject if green is 20% higher than red
        return False, "color mismatch (green channel too dominant)"
    
    # Check: Saturation should not be extremely low (avoid grayscale)
    if mean_s < 30:  # Very low saturation indicates grayscale
        return False, "color mismatch (image appears grayscale)"
    
    # Check: Colonoscopy images should have significant red/pink/brown color dominance
    # Hue ranges: Red ~0-15 and 165-179, Pink/Brown ~5-25, Orange/Brown ~10-30
    # Count pixels in colonoscopy-typical color ranges (red, pink, brown, orange tones)
    red_pink_brown_mask = (
        ((h_channel >= 0) & (h_channel <= 30)) |  # Red to orange range
        ((h_channel >= 165) & (h_channel <= 179))  # Red wrap-around range
    ) & (s_channel > 20)  # Must have some saturation
    
    red_pink_brown_ratio = np.sum(red_pink_brown_mask) / (width * height)
    
    # Colonoscopy images should have at least 20% of pixels in red/pink/brown range (more lenient)
    if red_pink_brown_ratio < 0.20:
        return False, "color mismatch (insufficient red/pink/brown color dominance)"
    
    # Check: Reject images with too much white/light background (common in screenshots/graphs)
    # Colonoscopy images have darker, more saturated colors
    white_light_mask = (v_channel > 220) & (s_channel < 30)  # Very bright, low saturation
    white_light_ratio = np.sum(white_light_mask) / (width * height)
    
    # If more than 60% of image is white/light background, likely not colonoscopy (more lenient)
    if white_light_ratio > 0.60:
        return False, "color mismatch (too much white/light background)"
    
    # Check: Reject images dominated by bright blue/green/yellow
    # Colonoscopy images are typically red/pink/brown, not bright blue/green
    # Hue ranges: Red ~0-10 and 170-179, Yellow ~20-30, Green ~50-70, Blue ~100-130
    blue_green_mask = ((h_channel >= 50) & (h_channel <= 130)) & (s_channel > 50)
    yellow_mask = ((h_channel >= 20) & (h_channel <= 30)) & (s_channel > 50) & (v_channel > 200)
    
    blue_green_ratio = np.sum(blue_green_mask) / (width * height)
    yellow_ratio = np.sum(yellow_mask) / (width * height)
    
    # If more than 30% of image is bright blue/green/yellow, reject (stricter threshold)
    if blue_green_ratio > 0.30 or yellow_ratio > 0.25:
        return False, "color mismatch (dominated by blue/green/yellow colors)"
    
    # 3. Detect circular/rounded frame (vignette)
    # Colonoscopy images typically have dark edges (vignette) and brighter center
    center_x, center_y = width // 2, height // 2
    
    # Define edge region (outer 20% of image)
    edge_width = int(width * 0.2)
    edge_height = int(height * 0.2)
    
    # Extract edge regions (top, bottom, left, right)
    top_edge = v_channel[0:edge_height, :]
    bottom_edge = v_channel[height-edge_height:height, :]
    left_edge = v_channel[:, 0:edge_width]
    right_edge = v_channel[:, width-edge_width:width]
    
    # Average brightness of edges
    edge_brightness = np.mean([
        np.mean(top_edge),
        np.mean(bottom_edge),
        np.mean(left_edge),
        np.mean(right_edge)
    ])
    
    # Extract center region (middle 40% of image)
    center_x_start = int(width * 0.3)
    center_x_end = int(width * 0.7)
    center_y_start = int(height * 0.3)
    center_y_end = int(height * 0.7)
    
    center_region = v_channel[center_y_start:center_y_end, center_x_start:center_x_end]
    center_brightness = np.mean(center_region)
    
    # Check: Edges should be significantly darker than center (vignette effect)
    # Colonoscopy images have a strong vignette effect - edges should be much darker
    brightness_ratio = edge_brightness / (center_brightness + 1e-6)  # Avoid division by zero
    
    # More lenient: Edges should be at least 10% darker than center
    if brightness_ratio > 0.90:  # Edges should be at least 10% darker
        return False, "missing vignette (edges not significantly darker than center)"
    
    # Additional check: Center should be reasonably bright (colonoscopy images have illuminated center)
    # More lenient - only reject if center is very dark
    if center_brightness < 50:  # Center should have some brightness (lowered threshold)
        return False, "missing vignette (center region too dark)"
    
    # 4. Check for color variance (colonoscopy images have natural color variation)
    # Screenshots/graphs often have very uniform colors or sharp color boundaries
    # Calculate color variance in the center region
    center_r = r_channel[center_y_start:center_y_end, center_x_start:center_x_end]
    center_g = g_channel[center_y_start:center_y_end, center_x_start:center_x_end]
    center_b = b_channel[center_y_start:center_y_end, center_x_start:center_x_end]
    
    # Calculate standard deviation of each channel in center
    std_r = np.std(center_r)
    std_g = np.std(center_g)
    std_b = np.std(center_b)
    
    # Average standard deviation across channels
    avg_std = (std_r + std_g + std_b) / 3.0
    
    # Colonoscopy images should have reasonable color variation (not too uniform)
    # If standard deviation is too low, image might be too uniform (like a graph background)
    # More lenient threshold - only catch very uniform images
    if avg_std < 12:  # Too uniform, likely not a colonoscopy image (lowered from 20)
        return False, "color mismatch (image too uniform, lacks natural color variation)"
    
    # Additional check: Reject images with too many high-contrast edges (common in screenshots/graphs)
    # Colonoscopy images have smooth, organic transitions
    # Calculate edge density using simple gradient on center region
    center_gray = (center_r + center_g + center_b) / 3.0
    # Simple edge detection: calculate mean of absolute differences
    try:
        h_diff = np.abs(np.diff(center_gray, axis=0))
        v_diff = np.abs(np.diff(center_gray, axis=1))
        edge_strength = (np.mean(h_diff) + np.mean(v_diff)) / 2.0
        
        # Screenshots/graphs have many sharp edges, colonoscopy images have smoother transitions
        # If edge strength is too high, likely a screenshot or graph
        # More lenient - only reject images with very high edge density (like text/graphs)
        if edge_strength > 35:  # Too many sharp edges (raised from 25)
            return False, "color mismatch (too many sharp edges, likely not a colonoscopy image)"
    except:
        # If edge detection fails, skip this check (shouldn't happen, but graceful degradation)
        pass
    
    # All checks passed
    return True, "validation passed"


def validate_image_bytes(image_bytes: bytes) -> Tuple[bool, str]:
    """
    Validate image from bytes.
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        tuple: (is_valid: bool, reason: str)
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        return validate_colonoscopy_image(image)
    except Exception as e:
        return False, f"failed to load image: {str(e)}"

