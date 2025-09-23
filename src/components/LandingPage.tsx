import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useRouter } from '../routes/Router';
import { Microscope, Shield, Zap, CheckCircle, Eye, Brain } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-blue-900">ColoVision</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                AI-Powered Medical Analysis
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Real-time Colorectal Cancer Detection with{' '}
                <span className="text-blue-600">Explainable AI</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Advanced deep learning technology providing instant, accurate analysis of colonoscopy images 
                with transparent AI explanations for medical professionals.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Start Detection
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3"
              >
                View Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Real-Time Results</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>FDA Compliant</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1682663947127-ac9d59d7f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwY29sb25vc2NvcHklMjBlcXVpcG1lbnQlMjBtb2Rlcm58ZW58MXx8fHwxNzU4NTk2NjM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Medical colonoscopy equipment"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 w-full h-full bg-blue-100 rounded-2xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Advanced AI Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cutting-edge technology designed specifically for medical professionals to enhance diagnostic accuracy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Microscope className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Real-Time Analysis</h3>
                <p className="text-gray-600">
                  Instant processing of colonoscopy images using state-of-the-art EfficientNet models 
                  optimized for medical imaging.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Explainable AI</h3>
                <p className="text-gray-600">
                  Visual heatmaps and detailed explanations help medical professionals understand 
                  AI decision-making processes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">High Accuracy</h3>
                <p className="text-gray-600">
                  Advanced deep learning models trained on comprehensive datasets with 
                  clinical validation and continuous improvement.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Privacy First</h3>
                <p className="text-gray-600">
                  All processing happens locally on your device. No images are stored or 
                  transmitted, ensuring complete patient privacy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Visual Explanations</h3>
                <p className="text-gray-600">
                  Grad-CAM heatmaps highlight regions of interest, providing clear visual 
                  guidance for clinical decision-making.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Clinical Integration</h3>
                <p className="text-gray-600">
                  Designed to integrate seamlessly into existing clinical workflows 
                  with actionable recommendations and reporting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">About ColoVision</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            ColoVision represents the next generation of AI-assisted medical diagnostics. 
            Our platform combines advanced computer vision with explainable AI to provide 
            medical professionals with powerful tools for colorectal cancer screening and detection.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Built with privacy and security at its core, ColoVision processes all images 
            locally on your device, ensuring complete patient confidentiality while delivering 
            real-time, accurate analysis results.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">ColoVision</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <Badge variant="outline" className="border-green-200 text-green-700">
                FDA Compliant
              </Badge>
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                HIPAA Secure
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                Real-Time Results
              </Badge>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2024 ColoVision. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};