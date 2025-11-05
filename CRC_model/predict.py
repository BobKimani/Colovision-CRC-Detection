"""
ONNX model inference for CRC segmentation.
Handles model loading and asynchronous inference.
"""

import numpy as np
import onnxruntime as ort
from pathlib import Path
from typing import Tuple
import asyncio

class CRCSegmentationModel:
    """ONNX model wrapper for CRC segmentation."""
    
    def __init__(self, model_path: str = None):
        """
        Initialize the ONNX model.
        
        Args:
            model_path: Path to ONNX model file
        """
        if model_path is None:
            # Default path relative to this file
            model_path = Path(__file__).resolve().parent / "model" / "crc_segmentation.onnx"
        else:
            model_path = Path(model_path)
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at: {model_path}")
        
        # Configure ONNX Runtime for CPU or GPU
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        self.session = ort.InferenceSession(
            str(model_path),
            providers=providers
        )
        
        # Get model input/output details
        self.input_name = self.session.get_inputs()[0].name
        self.input_shape = self.session.get_inputs()[0].shape
        
        print(f"✅ Model loaded: {model_path.name}")
        print(f"   Input: {self.input_name}, Shape: {self.input_shape}")
        print(f"   Device: {self.session.get_providers()[0]}")
    
    async def predict(self, preprocessed_tensor: np.ndarray) -> np.ndarray:
        """
        Run inference on preprocessed image.
        
        Args:
            preprocessed_tensor: NCHW float32 tensor (1, 3, 256, 256)
            
        Returns:
            Binary segmentation mask (256, 256) with values 0 or 1
        """
        # Run inference asynchronously to avoid blocking
        loop = asyncio.get_event_loop()
        prediction = await loop.run_in_executor(
            None,
            self._predict_sync,
            preprocessed_tensor
        )
        
        return prediction
    
    def _predict_sync(self, preprocessed_tensor: np.ndarray) -> np.ndarray:
        """
        Synchronous inference (called from executor).
        
        Args:
            preprocessed_tensor: NCHW float32 tensor
            
        Returns:
            Binary segmentation mask
        """
        # Run ONNX inference
        outputs = self.session.run(None, {self.input_name: preprocessed_tensor})
        
        # Extract prediction (first output)
        # UNetEffNet outputs: (1, 1, 256, 256) with sigmoid activation (0-1 range)
        prediction = outputs[0]
        
        # Handle both output formats:
        # 1. Single channel sigmoid output: (1, 1, 256, 256) -> squeeze to (256, 256)
        # 2. Two channel logits output: (1, 2, 256, 256) -> apply softmax and argmax
        
        if prediction.shape[1] == 1:
            # Single channel sigmoid output (UNetEffNet format)
            mask = prediction.squeeze()  # Shape: (256, 256) with values 0-1
            # Threshold at 0.5 to convert to binary mask
            mask = (mask > 0.5).astype(np.uint8)
        else:
            # Multi-channel logits output (alternative format)
            logits = prediction  # Shape: (1, num_classes, 256, 256)
            # Apply softmax and take argmax
            probs = np.exp(logits) / np.sum(np.exp(logits), axis=1, keepdims=True)
            mask = np.argmax(probs, axis=1).squeeze()  # Shape: (256, 256)
            mask = mask.astype(np.uint8)
        
        return mask
    
    def predict_batch(self, preprocessed_tensors: list) -> list:
        """
        Run batch inference (synchronous).
        
        Args:
            preprocessed_tensors: List of NCHW tensors
            
        Returns:
            List of binary masks
        """
        results = []
        for tensor in preprocessed_tensors:
            mask = self._predict_sync(tensor)
            results.append(mask)
        return results

