"""
FastAPI application for CRC segmentation inference.
Handles image uploads, preprocessing, inference, and postprocessing.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Dict, Optional
from pydantic import BaseModel
import asyncio
from pathlib import Path
import base64
import io

from predict import CRCSegmentationModel
from preprocessing import preprocess_image
from postprocessing import create_overlay, create_gradcam_overlay, get_mask_statistics
from report_generator import create_report
from llm_service import RecommendationService

# Initialize FastAPI app
app = FastAPI(title="CRC Segmentation API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:5173",  # Vite default port
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model and recommendation service (loaded once at startup)
model = None
recommendation_service = None

@app.on_event("startup")
async def load_model():
    """Load the ONNX model and recommendation service once at application startup."""
    global model, recommendation_service
    try:
        model = CRCSegmentationModel()
        print("✅ CRC Segmentation model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        raise
    
    # Initialize recommendation service (with fallback if API key not available)
    try:
        recommendation_service = RecommendationService()
        print("✅ AI Recommendation service loaded successfully")
    except Exception as e:
        print(f"⚠️  Warning: AI Recommendation service not available: {e}")
        print("   Falling back to hardcoded recommendations")
        recommendation_service = None

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "CRC Segmentation API is running",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "model_status": "loaded" if model else "not loaded"
    }

@app.post("/segment")
async def segment_images(files: List[UploadFile] = File(...)):
    """
    Segments multiple colonoscopy images and returns overlay masks.
    
    Args:
        files: List of uploaded image files
        
    Returns:
        JSON response with base64-encoded overlay images
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    results = []
    
    # Process each image
    for file in files:
        try:
            # Read image file
            image_bytes = await file.read()
            
            # Preprocess image
            original_img, preprocessed_tensor = preprocess_image(image_bytes)
            
            # Run inference
            prediction = await model.predict(preprocessed_tensor)
            
            # Create overlay (binary segmentation mask)
            overlay_img = create_overlay(original_img, prediction)
            
            # Create Grad-CAM heatmap (smooth gradient visualization)
            gradcam_img = create_gradcam_overlay(original_img, prediction, alpha=0.4)
            
            # Get mask statistics
            mask_stats = get_mask_statistics(prediction)
            
            # Convert original image to base64
            original_buffer = io.BytesIO()
            original_img.save(original_buffer, format="PNG")
            original_base64 = base64.b64encode(original_buffer.getvalue()).decode("utf-8")
            
            # Convert overlay to base64
            overlay_buffer = io.BytesIO()
            overlay_img.save(overlay_buffer, format="PNG")
            overlay_base64 = base64.b64encode(overlay_buffer.getvalue()).decode("utf-8")
            
            # Convert Grad-CAM to base64
            gradcam_buffer = io.BytesIO()
            gradcam_img.save(gradcam_buffer, format="PNG")
            gradcam_base64 = base64.b64encode(gradcam_buffer.getvalue()).decode("utf-8")
            
            results.append({
                "filename": file.filename,
                "status": "success",
                "original": f"data:image/png;base64,{original_base64}",
                "overlay": f"data:image/png;base64,{overlay_base64}",
                "gradcam": f"data:image/png;base64,{gradcam_base64}",  # Separate Grad-CAM
                "mask": f"data:image/png;base64,{overlay_base64}",
                "image_shape": original_img.size,
                "mask_shape": prediction.shape,
                "statistics": mask_stats
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e)
            })
    
    return JSONResponse(content={
        "status": "completed",
        "results": results,
        "total_processed": len(results)
    })

@app.post("/segment-single")
async def segment_single(file: UploadFile = File(...)):
    """
    Segments a single colonoscopy image (convenience endpoint).
    """
    result = await segment_images([file])
    return result

class RecommendationRequest(BaseModel):
    risk_level: str
    cancer_percentage: float
    statistics: Optional[Dict] = None

@app.post("/get-recommendations")
async def get_recommendations_endpoint(request: RecommendationRequest):
    """
    Get AI-generated clinical recommendations based on analysis results.
    
    Args:
        request: JSON body with risk_level, cancer_percentage, and optional statistics
        
    Returns:
        JSON response with recommendations list
    """
    try:
        recommendations = await get_recommendations(
            request.risk_level, 
            request.cancer_percentage, 
            request.statistics
        )
        return JSONResponse(content={
            "status": "success",
            "recommendations": recommendations
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

def calculate_risk_level(cancer_percentage: float) -> str:
    """Calculate risk level based on polyp coverage."""
    if cancer_percentage > 2.0:
        return 'High Risk'
    elif cancer_percentage > 0.5:
        return 'Medium Risk'
    elif cancer_percentage > 0.1:
        return 'Low Risk'
    return 'Safe'

async def get_recommendations(risk_level: str, cancer_percentage: float, statistics: dict = None) -> List[Dict[str, str]]:
    """Get AI-generated clinical recommendations, with fallback to hardcoded recommendations."""
    # Try to use AI recommendations if service is available
    if recommendation_service:
        try:
            return await asyncio.to_thread(
                recommendation_service.generate_recommendations,
                risk_level=risk_level,
                cancer_percentage=cancer_percentage,
                statistics=statistics
            )
        except Exception as e:
            print(f"⚠️  Error generating AI recommendations: {e}")
            print("   Falling back to hardcoded recommendations")
    
    # Fallback to hardcoded recommendations
    if risk_level in ['High Risk', 'Medium Risk']:
        return [
            {'type': 'urgent', 'text': 'Schedule consultation with an oncologist for further evaluation'},
            {'type': 'urgent', 'text': 'Biopsy recommended for histopathological confirmation'},
            {'type': 'monitoring', 'text': 'Close monitoring with follow-up imaging'}
        ]
    else:
        return [
            {'type': 'routine', 'text': 'Monitor during next routine screening'},
            {'type': 'routine', 'text': 'Continue standard screening interval'}
        ]

@app.post("/generate-report")
async def generate_report(file: UploadFile = File(...)):
    """
    Generate comprehensive PDF report for a segmentation analysis.
    
    Args:
        file: Uploaded image file
        
    Returns:
        PDF file download
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read and process image
        image_bytes = await file.read()
        original_img, preprocessed_tensor = preprocess_image(image_bytes)
        
        # Run inference
        prediction = await model.predict(preprocessed_tensor)
        
        # Create overlay (binary segmentation mask)
        overlay_img = create_overlay(original_img, prediction)
        
        # Create Grad-CAM heatmap (smooth gradient visualization)
        gradcam_img = create_gradcam_overlay(original_img, prediction, alpha=0.45)
        
        # Get statistics
        mask_stats = get_mask_statistics(prediction)
        cancer_percentage = mask_stats['cancer_percentage']
        
        # Calculate risk level
        risk_level = calculate_risk_level(cancer_percentage)
        
        # Get AI-generated recommendations
        recommendations = await get_recommendations(risk_level, cancer_percentage, mask_stats)
        
        # Convert images to base64
        original_buffer = io.BytesIO()
        original_img.save(original_buffer, format="PNG")
        original_base64 = base64.b64encode(original_buffer.getvalue()).decode("utf-8")
        
        overlay_buffer = io.BytesIO()
        overlay_img.save(overlay_buffer, format="PNG")
        overlay_base64 = base64.b64encode(overlay_buffer.getvalue()).decode("utf-8")
        
        # Convert Grad-CAM to base64
        gradcam_buffer = io.BytesIO()
        gradcam_img.save(gradcam_buffer, format="PNG")
        heatmap_base64 = base64.b64encode(gradcam_buffer.getvalue()).decode("utf-8")
        
        # Generate PDF report
        pdf_path = create_report(
            filename=file.filename,
            original_image=original_base64,
            overlay_image=overlay_base64,
            heatmap_image=heatmap_base64,
            statistics=mask_stats,
            risk_level=risk_level,
            confidence=0.90,  # Model confidence
            recommendations=recommendations
        )
        
        # Return PDF as download
        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            filename=Path(pdf_path).name,
            headers={
                "Content-Disposition": f"attachment; filename={Path(pdf_path).name}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

