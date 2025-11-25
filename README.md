# ColoVision - CRC Detection Web Application

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/F63P1L7A)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20100719&assignment_repo_type=AssignmentRepo)

## Overview

ColoVision is a web application designed for colorectal cancer (CRC) detection using advanced image analysis and machine learning techniques. The application provides a secure, user-friendly interface for medical professionals to upload and analyze medical images for potential CRC indicators.


## Tech Stack

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI Components
- **Authentication**: Firebase Auth with 2FA
- **Routing**: Custom React Router (hash-based)
- **State Management**: React Context API
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn (ASGI)
- **ML Model**: ONNX Runtime (UNet + EfficientNet-B0)
- **Image Processing**: Pillow, NumPy, OpenCV
- **AI Recommendations**: OpenAI GPT-4o-mini (optional)
- **Report Generation**: ReportLab (PDF)
- **Validation**: Custom colonoscopy image validation

## Getting Started

### Prerequisites

**Frontend:**
- Node.js (v18 or higher)
- npm or yarn
- Firebase project setup

**Backend:**
- Python 3.10 or higher
- pip (Python package manager)
- CUDA (optional, for GPU acceleration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/BobKimani/Colovision-CRC-Detection.git
cd Colovision-CRC-Detection
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase environment variables:
Create a `.env.local` file in the root directory with your Firebase configuration:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_APP_ID=your_app_id_here
```

**To get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings > General
4. Scroll down to "Your apps" and select your web app
5. Copy the configuration values to your `.env.local` file

**Enable Google Authentication:**
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Google" as a sign-in provider
3. Add your domain to authorized domains if needed

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd CRC_model
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables (optional, for AI recommendations):
Create a `.env` file in the `CRC_model` directory or root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

5. Ensure the ONNX model is present:
The model file should be at `CRC_model/model/crc_segmentation.onnx`

6. Start the FastAPI server:
```bash
python app.py
# Or with uvicorn directly:
uvicorn app:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs` (Swagger UI)
- Alternative docs: `http://localhost:8000/redoc`

## Project Structure

```
ColoVision/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components (Radix UI)
│   │   ├── DetectionPage.tsx
│   │   ├── AnalysisResults.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ...
│   ├── routes/            # Routing configuration
│   ├── services/          # API and authentication services
│   │   ├── auth.ts        # Firebase authentication
│   │   ├── segmentation.ts # API client for backend
│   │   └── firebase.ts    # Firebase configuration
│   └── styles/            # Global styles
│
├── CRC_model/             # Backend FastAPI application
│   ├── app.py             # FastAPI main application
│   ├── predict.py         # ONNX model inference
│   ├── preprocessing.py    # Image preprocessing
│   ├── postprocessing.py  # Mask overlay and Grad-CAM
│   ├── image_validation.py # Colonoscopy image validation
│   ├── llm_service.py     # OpenAI recommendations
│   ├── report_generator.py # PDF report generation
│   ├── model/             # ML model directory
│   │   └── crc_segmentation.onnx
│   ├── outputs/           # Generated reports
│   └── requirements.txt   # Python dependencies
│
├── README.md              # This file
├── technical.md          # Detailed technical documentation
└── package.json          # Frontend dependencies
```

## Features

### Image Analysis
- **Colonoscopy Image Validation**: Automatic validation to ensure uploaded images are colonoscopy images
- **AI Segmentation**: Deep learning-based polyp detection using UNet + EfficientNet-B0
- **Visual Overlays**: Red overlay showing detected polyp regions
- **Grad-CAM Heatmaps**: Attention visualization showing where the model focuses
- **Statistics**: Detailed pixel-level analysis and coverage percentages
- **Risk Assessment**: Automatic risk level classification (High/Medium/Low/Safe)

### Reports
- **PDF Reports**: Comprehensive analysis reports with:
  - Risk assessment tables
  - Visual comparisons (original vs segmentation)
  - Grad-CAM attention maps
  - Clinical recommendations
  - Model information and statistics

### AI Recommendations
- **OpenAI Integration**: AI-powered clinical recommendations based on analysis results
- **Fallback System**: Hardcoded recommendations if API unavailable
- **Categorized Recommendations**: Urgent, monitoring, and routine categories

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## API Endpoints

The backend provides the following main endpoints:

- `POST /segment` - Analyze multiple colonoscopy images
- `POST /segment-single` - Analyze a single image
- `POST /validate-image` - Validate if an image is a colonoscopy image
- `POST /generate-report` - Generate PDF report for an image
- `POST /get-recommendations` - Get AI-powered clinical recommendations
- `GET /health` - Health check endpoint

For detailed API documentation, visit `http://localhost:8000/docs` when the backend is running.

## Image Requirements

- **Format**: JPEG, PNG, BMP, TIFF
- **Minimum Size**: 300×300 pixels
- **Type**: Colonoscopy images only (validated automatically)
- **Content**: Images should show colonoscopy views (red/pink/brown tones, vignette effect)

## Troubleshooting

### Frontend Issues
- **Port already in use**: Change port in `vite.config.ts` or kill process on port 3000
- **Firebase errors**: Ensure `.env.local` has correct Firebase configuration
- **Build errors**: Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Backend Issues
- **Model not found**: Ensure `CRC_model/model/crc_segmentation.onnx` exists
- **Import errors**: Activate virtual environment and reinstall requirements
- **Port conflicts**: Change port in `app.py` or use `uvicorn app:app --port 8001`
- **OpenAI errors**: API key not required for basic functionality (only for AI recommendations)

### Image Validation
If images are rejected as invalid:
- Ensure images are actual colonoscopy images
- Check image size (minimum 300×300)
- Verify image shows colonoscopy view (not screenshots, graphs, or other medical images)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- **README.md**: This file - project overview and setup
- **technical.md**: Detailed technical documentation including architecture, APIs, and implementation details

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Medical imaging data sources
- Open source UI component libraries (Radix UI, Lucide)
- Firebase for authentication services
- ONNX Runtime for optimized model inference
- OpenAI for AI-powered recommendations
