import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { SegmentationService } from '../services/segmentation';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Brain, 
  Target,
  Download,
  Info
} from 'lucide-react';

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  fileName: string;
  file?: File; // Original file for PDF generation
  riskScore: number;
  riskLevel: 'Safe' | 'Low Risk' | 'Medium Risk' | 'High Risk';
  confidence: number;
  heatmapUrl: string;
  overlayUrl?: string; // Segmentation overlay from API
  limeExplanation: {
    summary: string;
    keyFeatures: Array<{
      feature: string;
      importance: number;
      description: string;
    }>;
  };
  recommendations: Array<{
    type: 'routine' | 'monitoring' | 'urgent';
    text: string;
  }>;
  processingTime: number;
}

interface AnalysisResultsProps {
  results: AnalysisResult[];
  onClose?: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, onClose }) => {
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(
    results.length > 0 ? results[0] : null
  );
  const [viewMode, setViewMode] = useState<'original' | 'heatmap' | 'overlay'>('original');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReport = async () => {
    if (!selectedResult || !selectedResult.file) {
      alert('Cannot generate report: Original file not available');
      return;
    }

    setIsDownloading(true);
    try {
      await SegmentationService.downloadReport(selectedResult.file);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to generate PDF report. Please ensure the backend server is running.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Safe':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'Low Risk':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Medium Risk':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'High Risk':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Safe':
        return <CheckCircle className="w-4 h-4" />;
      case 'Low Risk':
        return <Info className="w-4 h-4" />;
      case 'Medium Risk':
        return <AlertCircle className="w-4 h-4" />;
      case 'High Risk':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'routine':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'monitoring':
        return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  if (results.length === 0) {
    return (
      <Card className="border-blue-100">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Results</h3>
          <p className="text-gray-600">Upload and process images to see AI analysis results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Results
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Results List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-gray-900">Processed Images</h3>
          <div className="space-y-2">
            {results.map((result) => (
              <Card
                key={result.id}
                className={`cursor-pointer transition-colors border-2 ${
                  selectedResult?.id === result.id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
                onClick={() => setSelectedResult(result)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={result.imageUrl}
                      alt={result.fileName}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.fileName}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRiskColor(result.riskLevel)}>
                          {getRiskIcon(result.riskLevel)}
                          <span className="ml-1">{result.riskLevel}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Results */}
        <div className="lg:col-span-3">
          {selectedResult && (
            <div className="space-y-6">
              <Card className="border-blue-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span>{selectedResult.fileName}</span>
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDownloadReport}
                        disabled={isDownloading || !selectedResult.file}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isDownloading ? 'Generating...' : 'Download PDF Report'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Segmentation Summary */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(selectedResult.riskScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Polyp Coverage</div>
                        <Progress 
                          value={selectedResult.riskScore * 100} 
                          className="mt-2"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Detected polyp area percentage
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-4 text-center">
                        <Badge className={`${getRiskColor(selectedResult.riskLevel)} text-base px-3 py-1 shadow-sm`}>
                          {getRiskIcon(selectedResult.riskLevel)}
                          <span className="ml-1">{selectedResult.riskLevel}</span>
                        </Badge>
                        <div className="text-sm text-gray-600 mt-2">Risk Level</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Based on segmentation
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(selectedResult.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Model Confidence</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Processing: {selectedResult.processingTime}ms
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Image Visualization */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Visualization Views</h3>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Overlay:</span> Segmentation mask blended with original image
                        <span className="mx-2">•</span>
                        <span className="font-medium">Heatmap:</span> Grad-CAM style attention visualization
                      </div>
                    </div>
                    <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'original' | 'heatmap' | 'overlay')}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="original">Original Image</TabsTrigger>
                        <TabsTrigger value="overlay">Segmentation Overlay</TabsTrigger>
                        <TabsTrigger value="heatmap">Grad-CAM Heatmap</TabsTrigger>
                      </TabsList>
                    
                    <TabsContent value="original" className="mt-4">
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="relative bg-white rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={selectedResult.imageUrl}
                            alt="Original colonoscopy image"
                            className="w-full h-64 md:h-96 object-contain"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
                              <Eye className="w-3 h-3 mr-1" />
                              Original Image
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="heatmap" className="mt-4">
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-purple-800">
                              <strong>Grad-CAM Heatmap:</strong> Medical-grade gradient visualization using JET colormap. 
                              Deep red indicates high-confidence polyp regions (hot spots), smoothly transitioning through 
                              orange and yellow (moderate attention), to green and blue (normal tissue). This continuous 
                              gradient shows varying levels of model activation across the entire image.
                            </div>
                          </div>
                        </div>
                        <div className="relative bg-white rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={selectedResult.heatmapUrl}
                            alt="Grad-CAM Heatmap"
                            className="w-full h-64 md:h-96 object-contain"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                              <Brain className="w-3 h-3 mr-1" />
                              Grad-CAM Heatmap
                            </Badge>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                            <div className="text-xs text-white font-medium">
                              Color gradient shows attention intensity
                            </div>
                          </div>
                        </div>
                        {/* Color Legend */}
                        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                          <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Grad-CAM Intensity Legend</div>
                          <div className="flex items-center justify-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-r from-red-700 to-red-600 rounded shadow-md"></div>
                              <span className="text-xs font-medium text-gray-700">High</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-orange-400 rounded shadow-md"></div>
                              <span className="text-xs font-medium text-gray-700">Medium-High</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded shadow-md"></div>
                              <span className="text-xs font-medium text-gray-700">Medium</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-r from-lime-400 to-lime-300 rounded shadow-md"></div>
                              <span className="text-xs font-medium text-gray-700">Low</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-green-300 rounded shadow-md"></div>
                              <span className="text-xs font-medium text-gray-700">Normal</span>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-center text-gray-600 bg-blue-50 rounded px-3 py-2 border border-blue-200">
                            <strong>Risk Classification:</strong> High Risk (&gt;2%) • Medium Risk (0.5-2%) • Safe (&lt;0.5%)
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="overlay" className="mt-4">
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                              <strong>Segmentation Overlay:</strong> Shows the binary segmentation mask (red regions) 
                              directly overlaid on the original image. This highlights exactly which pixels the model 
                              identified as potential polyp/cancer regions.
                            </div>
                          </div>
                        </div>
                        <div className="relative bg-white rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={selectedResult.imageUrl}
                            alt="Original image"
                            className="w-full h-64 md:h-96 object-contain"
                          />
                          <img
                            src={selectedResult.overlayUrl || selectedResult.heatmapUrl}
                            alt="Segmentation overlay"
                            className="absolute inset-0 w-full h-full object-contain opacity-60 mix-blend-multiply"
                            style={{ filter: 'brightness(1.1) contrast(1.2)' }}
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-lg">
                              <Eye className="w-3 h-3 mr-1" />
                              Segmentation Overlay
                            </Badge>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                            <div className="text-xs text-white font-medium">
                              Red regions = Model predictions
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center space-x-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-700 font-medium">Detected polyp regions (binary mask)</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  </div>

                  {/* Segmentation Explanation */}
                  <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-green-600" />
                        <span>Segmentation Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <Info className="w-4 h-4" />
                        <AlertDescription>
                          {selectedResult.limeExplanation.summary}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Key Contributing Features</h4>
                        {selectedResult.limeExplanation.keyFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{feature.feature}</div>
                              <div className="text-sm text-gray-600">{feature.description}</div>
                            </div>
                            <div className="ml-4">
                              <Badge variant="outline" className="border-green-200 text-green-700">
                                {(feature.importance * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        <span>Clinical Recommendations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedResult.recommendations.map((rec, index) => (
                          <Alert key={index} className={
                            rec.type === 'urgent' ? 'border-red-200' :
                            rec.type === 'monitoring' ? 'border-yellow-200' :
                            'border-green-200'
                          }>
                            {getRecommendationIcon(rec.type)}
                            <AlertDescription className="ml-2">
                              {rec.text}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};