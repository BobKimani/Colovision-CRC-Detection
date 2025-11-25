# ColoVision - Technical Documentation

## Architecture Overview

ColoVision is a full-stack web application for colorectal cancer detection using deep learning-based image segmentation. The system consists of a React-based frontend and a FastAPI-based backend with an ONNX-optimized machine learning model.

## System Architecture

```
┌─────────────────┐
│   React Frontend │  (TypeScript, Vite, Tailwind CSS)
│   Port: 3000     │
└────────┬─────────┘
         │ HTTP/REST API
         │
┌────────▼─────────┐
│  FastAPI Backend │  (Python, FastAPI, Uvicorn)
│   Port: 8000     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│ ONNX  │ │ OpenAI │
│ Model │ │  API   │
└───────┘ └────────┘
```

## Frontend Technologies

### Core Framework
- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript for better code quality
- **Vite**: Fast build tool and dev server with SWC compilation
- **React Router**: Client-side routing (custom hash-based implementation)

### UI Libraries
- **Radix UI**: Accessible, unstyled component primitives
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, etc.
- **Tailwind CSS**: Utility-first CSS framework (via globals.css)
- **Lucide React**: Icon library with 500+ icons
- **Recharts**: Charting library for data visualization
- **Sonner**: Toast notification system

### State Management & Services
- **React Context API**: Global state management
- **Firebase Auth**: Authentication and user management
  - Email/password authentication
  - Google OAuth integration
  - Two-factor authentication (2FA) support
- **React Hook Form**: Form validation and management

### Build & Development
- **Vite**: Fast HMR (Hot Module Replacement)
- **TypeScript**: Static type checking
- **ESLint/Prettier**: Code quality and formatting

## Backend Technologies

### API Framework
- **FastAPI 0.100.0+**: Modern, fast Python web framework
  - Automatic OpenAPI/Swagger documentation
  - Async/await support for high performance
  - Pydantic models for request/response validation
- **Uvicorn**: ASGI server for FastAPI
  - Standard workers for production
  - WebSocket support

### Machine Learning Stack

#### Model Architecture
- **UNet with EfficientNet-B0 Backbone**: Deep learning segmentation model
  - Encoder: EfficientNet-B0 (feature extraction)
  - Decoder: UNet decoder (segmentation mask generation)
  - Output: Binary segmentation mask (256×256 pixels)

#### Model Inference
- **ONNX Runtime 1.15.0+**: Optimized inference engine
  - Cross-platform support (CPU/GPU)
  - CUDA execution provider for GPU acceleration
  - CPU fallback for systems without GPU
  - Model format: ONNX (Open Neural Network Exchange)

#### Image Processing
- **Pillow (PIL) 10.0.0+**: Image loading and manipulation
- **NumPy 1.24.0+**: Numerical operations and array processing
- **OpenCV (cv2)**: Advanced image processing
  - Distance transforms for smooth heatmaps
  - Color mapping (JET colormap for Grad-CAM)
  - Image blending and overlay operations

### Preprocessing Pipeline
1. **Image Loading**: Read image bytes from upload
2. **Format Conversion**: Convert RGBA/LA/P to RGB
3. **Resizing**: Resize to 256×256 using LANCZOS interpolation
4. **Normalization**: 
   - Scale pixel values to [0, 1]
   - Apply ImageNet mean/std normalization:
     - Mean: [0.485, 0.456, 0.406]
     - Std: [0.229, 0.224, 0.225]
5. **Tensor Conversion**: Convert to NCHW format (1, 3, 256, 256)

### Postprocessing Pipeline
1. **Mask Thresholding**: Convert sigmoid output (0-1) to binary mask (0 or 1)
2. **Overlay Generation**: Create colored overlay on original image
   - Red overlay (RGB: 255, 0, 0) with 180 alpha transparency
3. **Grad-CAM Visualization**:
   - Apply distance transform for smooth gradients
   - Normalize heatmap to [0, 1]
   - Apply JET colormap (red = high attention, blue = low attention)
   - Blend with original image (alpha = 0.35-0.45)
4. **Statistics Calculation**:
   - Total pixels analyzed
   - Cancer/polyp pixels detected
   - Coverage percentage
   - Risk level classification

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
  - Fallback to hardcoded recommendations if API unavailable
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

## Model Details

### Architecture
- **Type**: U-Net with EfficientNet-B0 encoder
- **Task**: Binary semantic segmentation
- **Input**: RGB image (256×256×3)
- **Output**: Binary mask (256×256×1)
- **Activation**: Sigmoid (output range: 0-1)
- **Threshold**: 0.5 for binary classification

### Training (if applicable)
- **Framework**: PyTorch 1.12+
- **Libraries**: 
  - `segmentation-models-pytorch`: Pre-built segmentation architectures
  - `timm`: EfficientNet models
  - `albumentations`: Data augmentation
- **Optimization**: Model exported to ONNX for production

### Inference
- **Engine**: ONNX Runtime
- **Providers**: CUDA (GPU) → CPU (fallback)
- **Async**: Inference runs in thread pool executor
- **Performance**: ~100-200ms per image (CPU), ~20-50ms (GPU)

## Security & Authentication

### Frontend Authentication
- **Firebase Authentication**:
  - Email/password authentication
  - Google OAuth integration
  - Two-factor authentication (2FA) with TOTP
  - Session management via Firebase SDK

### Backend Security
- **CORS**: Configured for specific frontend origins
- **Input Validation**: Image validation before processing
- **Error Handling**: Graceful error messages (no sensitive info leakage)
- **Environment Variables**: API keys stored in .env (not committed)

## Environment Configuration

### Frontend (.env.local)
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
```

### Backend (.env)
```bash
OPENAI_API_KEY=...  # Optional, for AI recommendations
```

## Performance Optimizations

### Frontend
- **Code Splitting**: Lazy-loaded routes
- **Image Optimization**: Base64 encoding for API responses
- **React Optimization**: Memoization and context optimization
- **Vite**: Fast HMR and optimized builds

### Backend
- **Async Processing**: Non-blocking I/O with FastAPI
- **ONNX Runtime**: Optimized inference engine
- **Image Caching**: In-memory processing (no disk I/O for inference)
- **Batch Processing**: Support for multiple images in one request

## Deployment Considerations

### Frontend
- **Build**: `npm run build` → static files in `build/`
- **Hosting**: Static file hosting (Vercel, Netlify, AWS S3)
- **Environment**: Production environment variables required

### Backend
- **Server**: Uvicorn with multiple workers for production
- **Port**: Default 8000 (configurable)
- **Model**: ONNX model file must be present in `CRC_model/model/`
- **Dependencies**: Python 3.8+ with requirements.txt
- **GPU**: Optional (CUDA for faster inference)

## Development Workflow

### Frontend Development
```bash
npm install          # Install dependencies
npm run dev         # Start dev server (port 3000)
npm run build       # Production build
```

### Backend Development
```bash
cd CRC_model
pip install -r requirements.txt
python app.py       # Start FastAPI server (port 8000)
```

### Testing
- Frontend: Manual testing via browser
- Backend: FastAPI automatic OpenAPI docs at `/docs`
- Model: Test with sample colonoscopy images

## Dependencies Summary

### Frontend (package.json)
- React ecosystem: react, react-dom, react-router
- UI: @radix-ui/*, lucide-react, recharts
- Build: vite, typescript
- Auth: firebase
- Forms: react-hook-form

### Backend (requirements.txt)
- API: fastapi, uvicorn, python-multipart
- ML: onnxruntime, numpy, pillow, opencv-python
- AI: openai, python-dotenv
- Reports: reportlab
- Training (optional): torch, torchvision, timm, segmentation-models-pytorch

## Future Enhancements

### Potential Improvements
1. **Model Improvements**:
   - Multi-class segmentation (polyp types)
   - Higher resolution input (512×512 or 1024×1024)
   - Ensemble models for better accuracy

2. **Backend Enhancements**:
   - Database integration for report storage
   - User authentication on backend
   - Batch processing queue
   - Model versioning

3. **Frontend Enhancements**:
   - Real-time progress updates
   - Image comparison tools
   - Historical analysis tracking
   - Export to DICOM format

4. **Infrastructure**:
   - Docker containerization
   - Kubernetes deployment
   - CI/CD pipeline
   - Monitoring and logging

## Technical Notes

### Image Format Support
- Input: JPEG, PNG, BMP, TIFF (via PIL)
- Output: PNG (base64 encoded for API, PDF embedded)

### Model Input/Output
- **Input Shape**: (1, 3, 256, 256) - Batch, Channels, Height, Width
- **Output Shape**: (1, 1, 256, 256) - Batch, Channels, Height, Width
- **Data Type**: float32
- **Normalization**: ImageNet statistics

### Risk Level Classification
- **High Risk**: > 2.0% polyp coverage
- **Medium Risk**: 0.5% - 2.0% coverage
- **Low Risk**: 0.1% - 0.5% coverage
- **Safe**: < 0.1% coverage

### Error Handling
- Invalid images: Simple error message ("Invalid image, please upload a colonoscopy image")
- Model errors: HTTP 503 with error details
- API errors: Graceful fallback to hardcoded recommendations
- Network errors: Frontend retry logic (if implemented)

