# ColoVision - Technical Documentation

## Architecture Overview

ColoVision is a full-stack web application for colorectal cancer detection using deep learning-based image segmentation. The system consists of a React-based frontend and a FastAPI-based backend with an ONNX-optimized machine learning model.

## System Architecture

```
┌─────────────────┐
│  React Frontend │  (TypeScript, Vite, Tailwind CSS)
│   Port: 3000    │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼─────────┐
│  FastAPI Backend │  (Python, FastAPI, Uvicorn)
│   Port: 8000     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼─────┐
│ ONNX  │ │ OpenAI │
│ Model │ │  API   │
└───────┘ └────────┘
```
#  Model Details & Training Documentation

##  Dataset Overview

The ColoVision segmentation model was trained using multiple public colonoscopy datasets to improve generalization across varied imaging conditions, scopes, and polyp types. The combined dataset includes both polyp-positive images and healthy/normal colonoscopy frames.

### Datasets Used

| Dataset Name       | Source                         | Number of Images | Format | Purpose |
|--------------------|---------------------------------|------------------|--------|---------|
| Kvasir-SEG         | Kaggle                          | 1,000            | JPEG   | Initial training |
| CVC-ClinicDB       | CVC Endoscopy Database          | 612              | PNG    | Fine-tuning Stage 1 |
| CVC-ColonDB        | CVC Endoscopy Database          | 380              | PNG    | Fine-tuning Stage 2 |
| ETIS-Larib         | ETIS Laboratory, France         | 196              | PNG    | Fine-tuning Stage 3 |
| HyperKvasir-SEG    | Simula Research Laboratory      | ~1,100           | JPEG   | Independent Testing |

---

##  Dataset Split

To ensure fair generalization and prevent data leakage, the dataset was divided as follows:

| Split | Percentage | Description |
|-------|------------|-------------|
| Training | 80% | Used for weight updates and augmentation |
| Validation | 10% | Used for monitoring training and early stopping |
| Test | 10% | Reserved for final performance evaluation |

---

##  Training Configuration

### Architecture
- Model: U-Net  
- Encoder Backbone: EfficientNet-B4 
- Task: Binary semantic segmentation  
- Input Size: 256 × 256  
- Output: 1-channel mask with sigmoid activation  

### Hyperparameters

| Component | Setting |
|----------|---------|
| Optimizer | AdamW |
| Learning Rate | 1e-4 |
| Loss Function | Dice Loss + BCE |
| Scheduler | ReduceLROnPlateau |
| Batch Size | 8 |
| Epochs | 20-30 (with early stopping) |

### Data Augmentation (Albumentations)
- Horizontal/vertical flips  
- Brightness/contrast jitter  
- Motion blur  
- Gaussian noise  
- Elastic transformations  
- Random crops & resize  

---

##  Evaluation Metrics

The model’s performance was evaluated on the held-out test split.

| Metric | Description | Your Value |
|--------|-------------|------------|
| Dice Coefficient | Measures overlap between prediction and ground truth | 0.92 |
| Intersection-over-Union (IoU) | Evaluates segmentation quality | 0.82 |
| F1 Score | Harmonic mean of precision and recall | 0.90 |
| Precision | Ability to avoid false positives | 0.95 |
| Recall | Ability to detect true polyp pixels | 0.86 |
| Accuracy | Correctly classified pixels overall | 0.97 |

---

##  Statistics

During inference, the backend computes several statistics to provide additional context for risk assessment.

### Computed Statistics
- **Polyp Coverage (%):**  
  coverage = (polyp pixels / total pixels) × 100  
- **Model Confidence:** Average sigmoid probability inside detected polyp regions.  
- **Risk Level Classification:**  
  - Safe: < 0.1%  
  - Low: 0.1% – 0.5%  
  - Medium: 0.5% – 2%  
  - High: > 2%  

These values appear both in API responses and in the generated PDF report.

---

##  Visual Prediction Outputs

For interpretability and validation, the following visual outputs were generated:

1. Original colonoscopy image  
2. Overlay (mask blended onto the image)  
3. Grad-CAM heatmap  

---

##  Grad-CAM Implementation

Grad-CAM was applied to the final decoder block of the U-Net.

### Interpretation
- Red: highest attention  
- Blue: lowest attention  

---

##  ONNX Export

After training, the PyTorch model was exported to ONNX for production inference.

| Setting | Value |
|--------|-------|
| Input Shape | (1, 3, 256, 256) |
| Output Shape | (1, 1, 256, 256) |
| Opset Version | 17 |
| Export Type | Static-shape ONNX |

ONNX Runtime benefits:
- Lower latency  
- GPU & CPU compatibility  
- Optimized inference on backend
  

### Image Validation
- **Heuristic-based validation** for colonoscopy images:
  - Size validation (minimum 300×300 pixels)
  - Color distribution analysis (HSV color space)
  - Red channel dominance check (colonoscopy images are red/pink/brown)
  - Vignette detection (darker edges, brighter center)
  - Color variance analysis (reject uniform/graph-like images)
  - Edge density check (reject screenshots with sharp edges)

### AI-Powered Recommendations
- **OpenAI GPT-4o-mini**: Clinical recommendation generation
  - Context-aware prompts based on risk level and statistics
  - Structured output parsing (urgent/monitoring/routine categories)
- **Environment-based configuration**: API key via .env file

### Report Generation
- **ReportLab 4.0.0+**: PDF report generation
  - Multi-page reports with structured sections
  - Image embedding (base64 to PDF)
  - Table formatting and styling
  - Risk level color coding
  - Clinical recommendations integration

## Data Flow

### Image Upload & Processing Flow

```
1. User uploads image via React frontend
   ↓
2. Frontend sends POST /segment with multipart/form-data
   ↓
3. FastAPI receives image bytes
   ↓
4. Image validation (validate_image_bytes)
   ├─ Invalid → Return error: "Invalid image, please upload a colonoscopy image"
   └─ Valid → Continue
   ↓
5. Preprocessing (preprocess_image)
   ├─ Load image from bytes
   ├─ Convert to RGB
   ├─ Resize to 256×256
   ├─ Normalize (ImageNet stats)
   └─ Convert to NCHW tensor
   ↓
6. Model Inference (model.predict)
   ├─ ONNX Runtime inference
   ├─ Output: (1, 1, 256, 256) sigmoid probabilities
   └─ Threshold at 0.5 → binary mask
   ↓
7. Postprocessing
   ├─ Create overlay (red mask on original)
   ├─ Create Grad-CAM heatmap
   └─ Calculate statistics
   ↓
8. Return JSON response
   ├─ Original image (base64)
   ├─ Overlay image (base64)
   ├─ Grad-CAM heatmap (base64)
   └─ Statistics (pixels, percentage, risk level)
```

### Report Generation Flow

```
1. User requests PDF report
   ↓
2. Process image (same as above)
   ↓
3. Get AI recommendations (OpenAI API or fallback)
   ↓
4. Generate PDF (ReportLab)
   ├─ Header and metadata
   ├─ Risk assessment table
   ├─ Clinical recommendations
   ├─ Visual analysis (original vs overlay)
   ├─ Grad-CAM heatmap
   ├─ Statistics tables
   └─ Model information
   ↓
5. Return PDF file download
```

## API Endpoints

### `/` (GET)
- Health check endpoint
- Returns API status and model loaded status

### `/health` (GET)
- Detailed health check
- Returns model status

### `/segment` (POST)
- **Input**: List of image files (multipart/form-data)
- **Output**: JSON with segmentation results
- **Process**: Validates, preprocesses, infers, and postprocesses images
- **Response Format**:
  ```json
  {
    "status": "completed",
    "results": [
      {
        "filename": "image.jpg",
        "status": "success",
        "original": "data:image/png;base64,...",
        "overlay": "data:image/png;base64,...",
        "gradcam": "data:image/png;base64,...",
        "statistics": {
          "total_pixels": 65536,
          "cancer_pixels": 1234,
          "cancer_percentage": 1.88
        }
      }
    ],
    "total_processed": 1
  }
  ```

### `/segment-single` (POST)
- Convenience endpoint for single image
- Wraps `/segment` endpoint

### `/validate-image` (POST)
- **Input**: Single image file
- **Output**: Validation result
- **Purpose**: Pre-upload validation to reject non-colonoscopy images

### `/generate-report` (POST)
- **Input**: Single image file
- **Output**: PDF file download
- **Process**: Full analysis + AI recommendations + PDF generation

### `/get-recommendations` (POST)
- **Input**: JSON with risk_level, cancer_percentage, statistics
- **Output**: List of AI-generated recommendations
- **Purpose**: Standalone recommendation generation


## Security & Authentication

### Frontend Authentication
- **Firebase Authentication**:
  - Email/password authentication
  - Google OAuth integration
  - Two-factor authentication (2FA) with TOTP
  - Session management via Firebase SDK

### Backend Security
- **Input Validation**: Image validation before processing
- **Error Handling**: Graceful error messages (no sensitive info leakage)
- **Environment Variables**: API keys stored in .env (not committed)
