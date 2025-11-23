/**
 * Segmentation API service for CRC detection.
 * Handles communication with the FastAPI backend.
 */

const API_BASE_URL = 'http://localhost:8000';

export interface SegmentationStatistics {
  total_pixels: number;
  cancer_pixels: number;
  background_pixels: number;
  cancer_percentage: number;
}

export interface SegmentationResult {
  filename: string;
  status: 'success' | 'error';
  original?: string;
  overlay?: string;
  gradcam?: string;  // Grad-CAM heatmap from backend
  mask?: string;
  error?: string;
  image_shape?: [number, number];
  mask_shape?: [number, number];
  statistics?: SegmentationStatistics;
}

export interface SegmentationResponse {
  status: string;
  results: SegmentationResult[];
  total_processed: number;
}

export interface Recommendation {
  type: 'routine' | 'monitoring' | 'urgent';
  text: string;
}

export interface RecommendationResponse {
  status: string;
  recommendations: Recommendation[];
}

export class SegmentationService {
  /**
   * Check if the API is available.
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Generate and download PDF report for an image.
   */
  static async downloadReport(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-report`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.statusText}`);
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CRC_Report_${file.name.split('.')[0]}_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Report download error:', error);
      throw error;
    }
  }

  /**
   * Segment a single image.
   */
  static async segmentImage(file: File): Promise<SegmentationResult> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/segment-single`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data: SegmentationResponse = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      
      throw new Error('No results returned from API');
    } catch (error) {
      console.error('Segmentation error:', error);
      return {
        filename: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Segment multiple images.
   */
  static async segmentImages(files: File[]): Promise<SegmentationResponse> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/segment`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Batch segmentation error:', error);
      return {
        status: 'error',
        results: files.map(file => ({
          filename: file.name,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        })),
        total_processed: 0,
      };
    }
  }

  /**
   * Get AI-generated clinical recommendations based on analysis results.
   */
  static async getRecommendations(
    riskLevel: string,
    cancerPercentage: number,
    statistics?: SegmentationStatistics
  ): Promise<Recommendation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/get-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          risk_level: riskLevel,
          cancer_percentage: cancerPercentage,
          statistics: statistics || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data: RecommendationResponse = await response.json();
      
      if (data.recommendations && data.recommendations.length > 0) {
        return data.recommendations;
      }
      
      throw new Error('No recommendations returned from API');
    } catch (error) {
      console.error('Recommendation generation error:', error);
      // Fallback to hardcoded recommendations
      if (riskLevel === 'High Risk' || riskLevel === 'Medium Risk') {
        return [
          { type: 'urgent', text: 'Schedule consultation with an oncologist for further evaluation' },
          { type: 'urgent', text: 'Biopsy recommended for histopathological confirmation' },
          { type: 'monitoring', text: 'Close monitoring with follow-up imaging' }
        ];
      } else {
        return [
          { type: 'routine', text: 'Monitor during next routine screening' },
          { type: 'routine', text: 'Continue standard screening interval' }
        ];
      }
    }
  }
}

