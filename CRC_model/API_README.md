# CRC Segmentation API

FastAPI backend for colorectal cancer segmentation using ONNX models.

## Setup

### 1. Install Dependencies

```bash
cd CRC_model
pip install -r requirements.txt
```

### 2. Add Your ONNX Model

Place your trained ONNX model in the following location:
```
CRC_model/model/crc_segmentation.onnx
```

### 3. Run the Server

```bash
uvicorn app:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/health
```

### Segment Images (Multiple)
```bash
POST http://localhost:8000/segment
Content-Type: multipart/form-data

# Body: files (multiple image files)
```

**Response:**
```json
{
  "status": "completed",
  "results": [
    {
      "filename": "image1.jpg",
      "status": "success",
      "overlay": "data:image/png;base64,...",
      "image_shape": [1024, 768],
      "mask_shape": [256, 256]
    }
  ],
  "total_processed": 1
}
```

### Segment Single Image
```bash
POST http://localhost:8000/segment-single
Content-Type: multipart/form-data

# Body: file (single image file)
```

## Project Structure

```
CRC_model/
├── app.py                 # FastAPI entry point
├── predict.py             # ONNX inference logic
├── preprocessing.py       # Image preprocessing
├── postprocessing.py      # Mask overlay generation
├── requirements.txt       # Dependencies
├── API_README.md         # This file
├── model/
│   ├── unet_effnet.py    # Model architecture (training)
│   └── crc_segmentation.onnx  # ONNX model (inference)
└── outputs/              # Generated overlays (if saved)
```

## Model Input/Output

- **Input:** RGB images (any size), resized to 256×256
- **Output:** Binary segmentation mask (256×256)
- **Overlay:** Colored mask (red) overlaid on original image

## Frontend Integration

The API returns base64-encoded overlays that can be directly used in the React frontend. See `DetectionPage.tsx` for integration example.

## Error Handling

- Invalid images return `status: "error"` with error message
- Model not loaded returns HTTP 503
- No files uploaded returns HTTP 400

