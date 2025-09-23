import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Brain, 
  Target,
  Download,
  Maximize2,
  Info
} from 'lucide-react';

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  fileName: string;
  riskScore: number;
  riskLevel: 'Benign' | 'Low Risk' | 'Medium Risk' | 'High Risk';
  confidence: number;
  heatmapUrl: string;
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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Benign':
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
      case 'Benign':
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
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Full Screen
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Risk Summary */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="border-blue-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(selectedResult.riskScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Risk Score</div>
                        <Progress 
                          value={selectedResult.riskScore * 100} 
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-blue-100">
                      <CardContent className="p-4 text-center">
                        <Badge className={`${getRiskColor(selectedResult.riskLevel)} text-base px-3 py-1`}>
                          {getRiskIcon(selectedResult.riskLevel)}
                          <span className="ml-1">{selectedResult.riskLevel}</span>
                        </Badge>
                        <div className="text-sm text-gray-600 mt-2">Classification</div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(selectedResult.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Confidence</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedResult.processingTime}ms
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Image Visualization */}
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="original">Original</TabsTrigger>
                      <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                      <TabsTrigger value="overlay">Overlay</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="original" className="mt-4">
                      <div className="relative">
                        <img
                          src={selectedResult.imageUrl}
                          alt="Original colonoscopy image"
                          className="w-full h-64 md:h-96 object-contain rounded-lg border border-gray-200"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="heatmap" className="mt-4">
                      <div className="relative">
                        <img
                          src={selectedResult.heatmapUrl}
                          alt="Grad-CAM heatmap"
                          className="w-full h-64 md:h-96 object-contain rounded-lg border border-gray-200"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            <Brain className="w-3 h-3 mr-1" />
                            Grad-CAM
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="overlay" className="mt-4">
                      <div className="relative">
                        <img
                          src={selectedResult.imageUrl}
                          alt="Original with overlay"
                          className="w-full h-64 md:h-96 object-contain rounded-lg border border-gray-200"
                        />
                        <img
                          src={selectedResult.heatmapUrl}
                          alt="Heatmap overlay"
                          className="absolute inset-0 w-full h-full object-contain rounded-lg opacity-60 mix-blend-multiply"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                            <Eye className="w-3 h-3 mr-1" />
                            Overlay View
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* LIME Explanation */}
                  <Card className="border-green-100">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-green-600" />
                        <span>AI Explanation (LIME)</span>
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