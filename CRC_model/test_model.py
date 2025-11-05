"""
Quick test script to inspect the ONNX model structure and compatibility.
"""

import onnxruntime as ort
import numpy as np
from pathlib import Path

def test_onnx_model():
    """Test the ONNX model structure and compatibility."""
    model_path = Path(__file__).resolve().parent / "model" / "crc_segmentation.onnx"
    
    if not model_path.exists():
        print(f" Model not found at: {model_path}")
        return
    
    print(f" Model found: {model_path.name}")
    print(f"   File size: {model_path.stat().st_size / (1024*1024):.2f} MB")
    print()
    
    # Load the model
    try:
        session = ort.InferenceSession(str(model_path))
        print(" Model loaded successfully")
    except Exception as e:
        print(f" Failed to load model: {e}")
        return
    
    # Inspect inputs
    print("\n Model Inputs:")
    for idx, input_info in enumerate(session.get_inputs()):
        print(f"  Input {idx}:")
        print(f"    Name: {input_info.name}")
        print(f"    Shape: {input_info.shape}")
        print(f"    Type: {input_info.type}")
    
    # Inspect outputs
    print("\n Model Outputs:")
    for idx, output_info in enumerate(session.get_outputs()):
        print(f"  Output {idx}:")
        print(f"    Name: {output_info.name}")
        print(f"    Shape: {output_info.shape}")
        print(f"    Type: {output_info.type}")
    
    # Get providers
    print(f"\n Execution Providers: {session.get_providers()}")
    
    # Test inference with sample input
    print("\n Testing Inference:")
    input_info = session.get_inputs()[0]
    input_name = input_info.name
    
    # Create sample input
    sample_input = np.random.randn(1, 3, 256, 256).astype(np.float32)
    print(f"  Sample input shape: {sample_input.shape}")
    
    try:
        outputs = session.run(None, {input_name: sample_input})
        print(f"  Inference successful!")
        print(f"  Number of outputs: {len(outputs)}")
        
        for idx, output in enumerate(outputs):
            print(f"  Output {idx} shape: {output.shape}")
            print(f"  Output {idx} dtype: {output.dtype}")
            print(f"  Output {idx} value range: [{output.min():.4f}, {output.max():.4f}]")
    except Exception as e:
        print(f"   Inference failed: {e}")

if __name__ == "__main__":
    test_onnx_model()

