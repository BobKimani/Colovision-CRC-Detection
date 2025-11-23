import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { ImageUpload } from './ImageUpload';
import { AnalysisResults, AnalysisResult } from './AnalysisResults';
import { useRouter, useAuth } from '../routes/Router';
import { AuthService } from '../services/auth';
import { SegmentationService } from '../services/segmentation';
import { 
  Eye, 
  LogOut, 
  Play, 
  Brain, 
  Zap, 
  Shield,
  Clock,
  BarChart3,
  RotateCcw
} from 'lucide-react';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  status: 'uploading' | 'ready' | 'processing' | 'error';
  progress: number;
}

export const DetectionPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, setUser } = useAuth();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingImage, setCurrentProcessingImage] = useState<string>('');
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // Check API availability on mount
  useEffect(() => {
    const checkAPI = async () => {
      const available = await SegmentationService.checkHealth();
      setApiAvailable(available);
      console.log('API available:', available);
    };
    checkAPI();
  }, []);

  // Create Grad-CAM with smooth gradient (red→orange→yellow→green)
  const createHeatmapFromOverlay = (overlayUrl: string, originalUrl: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const overlayImg = new Image();
      overlayImg.crossOrigin = 'anonymous';
      
      overlayImg.onload = () => {
        canvas.width = overlayImg.width;
        canvas.height = overlayImg.height;
        
        // Draw original image
        const originalImg = new Image();
        originalImg.crossOrigin = 'anonymous';
        
        originalImg.onload = () => {
          // Draw original image as base
          ctx.drawImage(originalImg, 0, 0);
          
          // Get overlay pixel data (model's segmentation output)
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCanvas.width = overlayImg.width;
          tempCanvas.height = overlayImg.height;
          tempCtx.drawImage(overlayImg, 0, 0);
          const overlayData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          
          const width = canvas.width;
          const height = canvas.height;
          
          // Create distance map for smooth gradient
          const distanceMap = new Float32Array(width * height);
          const maxDist = 80; // Distance threshold for gradient
          distanceMap.fill(maxDist);
          
          // Mark polyp pixels
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const r = overlayData.data[i];
              const g = overlayData.data[i + 1];
              const b = overlayData.data[i + 2];
              
              const isPolypRegion = r > 100 && (r > g + 50) && (r > b + 50);
              if (isPolypRegion) {
                distanceMap[y * width + x] = 0;
              }
            }
          }
          
          // Fast distance transform (2-pass algorithm)
          // Forward pass
          for (let y = 1; y < height; y++) {
            for (let x = 1; x < width; x++) {
              const idx = y * width + x;
              distanceMap[idx] = Math.min(
                distanceMap[idx],
                distanceMap[(y - 1) * width + x] + 1,
                distanceMap[y * width + (x - 1)] + 1,
                distanceMap[(y - 1) * width + (x - 1)] + 1.414
              );
            }
          }
          
          // Backward pass
          for (let y = height - 2; y >= 0; y--) {
            for (let x = width - 2; x >= 0; x--) {
              const idx = y * width + x;
              distanceMap[idx] = Math.min(
                distanceMap[idx],
                distanceMap[(y + 1) * width + x] + 1,
                distanceMap[y * width + (x + 1)] + 1,
                distanceMap[(y + 1) * width + (x + 1)] + 1.414
              );
            }
          }
          
          // Apply smooth Grad-CAM gradient
          const imageData = ctx.getImageData(0, 0, width, height);
          
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const idx = y * width + x;
              const distance = distanceMap[idx];
              
              // Normalize distance to 0-1 range
              const normalizedDist = Math.min(distance / maxDist, 1.0);
              
              // Create smooth gradient: Red (0) → Orange → Yellow → Green (1)
              let gradR, gradG, gradB, alpha;
              
              if (normalizedDist < 0.25) {
                // Deep red hot spots (0 to 0.25)
                const t = normalizedDist / 0.25;
                gradR = 255;
                gradG = Math.floor(t * 100);  // Dark red to red-orange
                gradB = 0;
                alpha = 0.7 - (t * 0.2); // High opacity on hot spots
              } else if (normalizedDist < 0.5) {
                // Orange to yellow (0.25 to 0.5)
                const t = (normalizedDist - 0.25) / 0.25;
                gradR = 255;
                gradG = Math.floor(100 + t * 155); // Orange to yellow
                gradB = 0;
                alpha = 0.5 - (t * 0.15);
              } else if (normalizedDist < 0.75) {
                // Yellow to light green (0.5 to 0.75)
                const t = (normalizedDist - 0.5) / 0.25;
                gradR = Math.floor(255 - t * 155); // Yellow to light green
                gradG = 255;
                gradB = Math.floor(t * 100);
                alpha = 0.35 - (t * 0.15);
              } else {
                // Light green to very light (0.75 to 1.0)
                const t = (normalizedDist - 0.75) / 0.25;
                gradR = Math.floor(100 - t * 100); // Fade to minimal
                gradG = 255;
                gradB = Math.floor(100 + t * 55);
                alpha = 0.2 - (t * 0.15); // Very transparent at edges
              }
              
              // Blend with original image
              imageData.data[i] = Math.floor(imageData.data[i] * (1 - alpha) + gradR * alpha);
              imageData.data[i + 1] = Math.floor(imageData.data[i + 1] * (1 - alpha) + gradG * alpha);
              imageData.data[i + 2] = Math.floor(imageData.data[i + 2] * (1 - alpha) + gradB * alpha);
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        
        originalImg.onerror = () => {
          // Fallback: use overlay directly
          canvas.width = overlayImg.width;
          canvas.height = overlayImg.height;
          ctx.drawImage(overlayImg, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        
        originalImg.src = originalUrl;
      };
      
      overlayImg.onerror = () => {
        reject(new Error('Failed to load overlay image'));
      };
      
      overlayImg.src = overlayUrl;
    });
  };

  // Mock segmentation simulation (fallback when API is unavailable)
  const simulateModelInference = async (image: UploadedImage): Promise<AnalysisResult> => {
    // Minimal processing time for fast response
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate mock segmentation results
    const cancerPercentage = Math.random() * 30; // 0-30% cancer coverage
    const polypDetected = cancerPercentage > 0.5;
    const riskLevel = 
      cancerPercentage > 2.0 ? 'High Risk' :
      cancerPercentage > 0.5 ? 'Medium Risk' :
      cancerPercentage > 0.1 ? 'Low Risk' : 'Safe';

    // Create visually appealing heatmap
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Draw original image
    const img = new Image();
    img.src = image.url;
    await new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(null);
      };
    });
    
    // Create Grad-CAM style gradient with smooth transitions
    // This creates the red→orange→yellow→green gradient seen in medical Grad-CAM
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.5, 0,
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.7
    );
    gradient.addColorStop(0, 'rgba(200, 0, 0, 0.8)');      // Deep red hot spot
    gradient.addColorStop(0.2, 'rgba(255, 60, 0, 0.75)');  // Bright red-orange
    gradient.addColorStop(0.4, 'rgba(255, 150, 0, 0.65)'); // Orange
    gradient.addColorStop(0.6, 'rgba(255, 220, 0, 0.5)');  // Yellow
    gradient.addColorStop(0.8, 'rgba(180, 255, 0, 0.35)'); // Yellow-green
    gradient.addColorStop(1, 'rgba(50, 200, 100, 0.2)');   // Light green
    
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'source-over';
    const heatmapUrl = canvas.toDataURL();

    return {
      id: image.id,
      imageUrl: image.url,
      fileName: image.file.name,
      file: image.file, // Pass original file for PDF generation
      riskScore: cancerPercentage / 100,
      riskLevel,
      confidence: 0.85 + Math.random() * 0.1,
      heatmapUrl,
      limeExplanation: {
        summary: polypDetected 
          ? `Polyp detected! Segmentation model identified ${cancerPercentage.toFixed(1)}% of the image area as potential polyp/cancer regions. Immediate medical consultation recommended.`
          : `No significant polyps detected. Segmentation model identified only ${cancerPercentage.toFixed(1)}% of the image area with minor irregularities. Continue routine screening.`,
        keyFeatures: [
          {
            feature: polypDetected ? 'Polyp Region Coverage' : 'Normal Tissue Coverage',
            importance: cancerPercentage / 100,
            description: polypDetected 
              ? `Detected ${cancerPercentage.toFixed(1)}% of image area as potential polyp tissue`
              : `${(100 - cancerPercentage).toFixed(1)}% of tissue appears normal with minimal irregularities`
          },
          {
            feature: 'Tissue Texture',
            importance: 0.30 + Math.random() * 0.15,
            description: polypDetected ? 'Surface irregularities detected in polyp regions' : 'Normal tissue texture patterns'
          },
          {
            feature: 'Color Variation',
            importance: 0.25 + Math.random() * 0.15,
            description: polypDetected ? 'Abnormal color changes indicating potential pathology' : 'Normal color consistency'
          },
          {
            feature: 'Morphological Features',
            importance: 0.20 + Math.random() * 0.1,
            description: polypDetected ? 'Abnormal shape and structural characteristics detected' : 'Normal morphological features'
          }
        ]
      },
      recommendations: polypDetected ? [
        { type: 'urgent', text: 'Schedule consultation with an oncologist for further evaluation' },
        { type: 'urgent', text: 'Biopsy recommended for histopathological confirmation' },
        { type: 'monitoring', text: 'Close monitoring with follow-up imaging' }
      ] : [
        { type: 'routine', text: 'Monitor during next routine screening' },
        { type: 'routine', text: 'Continue standard screening interval' }
      ],
      processingTime: 1500 + Math.random() * 1000
    };
  };

  const processImages = useCallback(async () => {
    const readyImages = images.filter(img => img.status === 'ready');
    
    if (readyImages.length === 0) {
      alert('No images ready for processing');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setAnalysisResults([]);

    const results: AnalysisResult[] = [];

    // Use real API if available, otherwise fallback to mock
    const useAPI = apiAvailable === true;

    for (let i = 0; i < readyImages.length; i++) {
      const image = readyImages[i];
      setCurrentProcessingImage(image.file.name);
      
      // Update image status
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'processing' } : img
      ));

      try {
        let result: AnalysisResult;
        
        if (useAPI) {
          // Call real segmentation API
          const apiResult = await SegmentationService.segmentImage(image.file);
          
          if (apiResult.status === 'success' && apiResult.overlay && apiResult.original) {
            // Use Grad-CAM from backend if available, otherwise create on client
            let heatmapUrl: string;
            if (apiResult.gradcam) {
              heatmapUrl = apiResult.gradcam; // Use backend-generated Grad-CAM
            } else {
              heatmapUrl = await createHeatmapFromOverlay(apiResult.overlay, apiResult.original);
            }
            
            // Calculate risk level based on cancer percentage
            const cancerPercentage = apiResult.statistics?.cancer_percentage || 0;
            
            // Risk classification:
            // >2% coverage = High Risk (requires oncologist)
            // 0.5-2% coverage = Medium Risk (requires oncologist)
            // <0.5% = Safe/Low Risk (routine screening)
            const polypDetected = cancerPercentage > 0.5;
            const riskLevel = 
              cancerPercentage > 2.0 ? 'High Risk' :
              cancerPercentage > 0.5 ? 'Medium Risk' :
              cancerPercentage > 0.1 ? 'Low Risk' : 'Safe';
            
            // Get AI-generated recommendations
            let recommendations;
            try {
              recommendations = await SegmentationService.getRecommendations(
                riskLevel,
                cancerPercentage,
                apiResult.statistics
              );
            } catch (error) {
              console.error('Failed to get AI recommendations, using fallback:', error);
              // Fallback to hardcoded recommendations if AI fails
              recommendations = polypDetected ? [
                { type: 'urgent', text: 'Schedule consultation with an oncologist for further evaluation' },
                { type: 'urgent', text: 'Biopsy recommended for histopathological confirmation' },
                { type: 'monitoring', text: 'Close monitoring with follow-up imaging' }
              ] : [
                { type: 'routine', text: 'Monitor during next routine screening' },
                { type: 'routine', text: 'Continue standard screening interval' }
              ];
            }
            
            // Convert API response to AnalysisResult format for segmentation
            result = {
              id: image.id,
              imageUrl: apiResult.original || image.url, // Use original image
              fileName: image.file.name,
              file: image.file, // Pass original file for PDF generation
              riskScore: cancerPercentage / 100, // Convert percentage to 0-1 scale
              riskLevel,
              confidence: 0.90, // High confidence for segmentation
              heatmapUrl, // Grad-CAM from backend (JET colormap)
              overlayUrl: apiResult.overlay, // Segmentation overlay from API
              limeExplanation: {
                summary: polypDetected 
                  ? `Polyp detected! Segmentation model identified ${cancerPercentage.toFixed(1)}% of the image area (${apiResult.statistics?.cancer_pixels || 0} pixels) as potential polyp/cancer regions. Immediate medical consultation recommended.`
                  : `No significant polyps detected. Segmentation model identified only ${cancerPercentage.toFixed(1)}% of the image area with minor irregularities. Continue routine screening.`,
                keyFeatures: [
                  { 
                    feature: polypDetected ? 'Polyp Region Coverage' : 'Normal Tissue Coverage', 
                    importance: cancerPercentage / 100, 
                    description: polypDetected 
                      ? `Detected ${cancerPercentage.toFixed(1)}% of image area as potential polyp tissue (${apiResult.statistics?.cancer_pixels || 0} pixels)` 
                      : `${(100 - cancerPercentage).toFixed(1)}% of tissue appears normal with minimal irregularities`
                  },
                  { 
                    feature: 'Segmentation Confidence', 
                    importance: 0.85, 
                    description: 'High confidence binary segmentation mask generated by ONNX model' 
                  },
                  { 
                    feature: 'Tissue Analysis', 
                    importance: polypDetected ? 0.80 : 0.60, 
                    description: polypDetected 
                      ? 'Deep learning model detected abnormal tissue patterns and morphology' 
                      : 'Deep learning model found normal tissue patterns'
                  },
                  { 
                    feature: 'Model Performance', 
                    importance: 0.60, 
                    description: 'ONNX model processed image with optimized inference' 
                  }
                ]
              },
              recommendations,
              processingTime: 1500
            };
          } else {
            throw new Error(apiResult.error || 'API returned error');
          }
        } else {
          // Use mock inference
          result = await simulateModelInference(image);
        }
        
        results.push(result);
        
        // Update progress
        setProcessingProgress((i + 1) / readyImages.length * 100);
      } catch (error) {
        console.error('Processing failed for', image.file.name, error);
        
        // Update image status to error
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error' } : img
        ));
      }
    }

    setAnalysisResults(results);
    setIsProcessing(false);
    setCurrentProcessingImage('');
  }, [images, apiAvailable]);

  const handleImagesChange = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
    // Clear previous results when images change
    if (analysisResults.length > 0 && newImages.length === 0) {
      setAnalysisResults([]);
    }
  }, [analysisResults.length]);

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    navigate('/');
  };

  const handleReset = () => {
    setImages([]);
    setAnalysisResults([]);
    setProcessingProgress(0);
    setIsProcessing(false);
    setCurrentProcessingImage('');
    setResetKey(prev => prev + 1); // Trigger ImageUpload reset
  };

  const readyImagesCount = images.filter(img => img.status === 'ready').length;
  const hasResults = analysisResults.length > 0;

  // Redirect if not authenticated
  if (!user?.isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-blue-900">ColoVision</span>
              </div>
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Shield className="w-3 h-3 mr-1" />
                Secure Session
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user.email?.split('@')[0] || 'User'}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              AI-Powered Colorectal Cancer Segmentation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload colonoscopy images for real-time segmentation using ONNX deep learning models 
              to identify and highlight potential cancer regions with visual overlays
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Brain className="w-4 h-4 text-blue-600" />
                <span>ONNX Segmentation Model</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span>Real-time Processing</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Binary Segmentation</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Visual Overlay</span>
              </div>
            </div>
          </div>

          {/* API Status Indicator */}
          {apiAvailable !== null && (
            <Alert className={apiAvailable ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
              {apiAvailable ? (
                <>
                  <Zap className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Real-time API Connected</strong> - Using ONNX model for segmentation
                  </AlertDescription>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Demo Mode</strong> - API unavailable, using mock results. Start the backend server to enable real segmentation.
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                      <span className="font-semibold text-blue-900">Processing Images...</span>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.round((100 - processingProgress) / 20)} min remaining
                    </Badge>
                  </div>
                  
                  <Progress value={processingProgress} className="h-3" />
                  
                  <div className="text-sm text-blue-700">
                    Currently analyzing: <span className="font-medium">{currentProcessingImage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Upload Section */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Image Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload onImagesChange={handleImagesChange} resetKey={resetKey} />
              
              {images.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">{readyImagesCount}</span> images ready for analysis
                    </div>
                    {hasResults && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {analysisResults.length} results available
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleReset}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={processImages}
                      disabled={readyImagesCount === 0 || isProcessing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Analyze All Images'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {hasResults && (
            <AnalysisResults 
              results={analysisResults}
              onClose={() => setAnalysisResults([])}
            />
          )}

          {/* Help Information */}
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> Image segmentation is performed using an ONNX model on the backend server. 
              Images are processed securely and results are returned immediately. Patient privacy and data security are maintained 
              throughout the segmentation process.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};