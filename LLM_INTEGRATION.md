# LLM Integration - Usage Example

## Basic Usage

```typescript
import { RecommendationService } from './llm';

// Inside a React component or service
const service = new RecommendationService();

const result = await service.generateRecommendation({
  findings: "Polyp detected with 2.5% coverage. High confidence segmentation mask indicates abnormal tissue morphology.",
  segmentationSummary: "Binary segmentation identified 2,450 pixels as potential polyp regions out of 98,000 total pixels. Model confidence: 92%.",
  gradcamSummary: "Grad-CAM heatmap shows concentrated attention in the central region with deep red hot spots indicating high model activation. Gradient extends smoothly to surrounding areas."
});

console.log(result.summary);
console.log(result.recommendation);
console.log(result.riskLevel); // 'low' | 'moderate' | 'high'
```

## Integration with Analysis Results

```typescript
import { RecommendationService } from './llm';
import { AnalysisResult } from './components/AnalysisResults';

async function generateClinicalRecommendation(result: AnalysisResult) {
  const service = new RecommendationService();
  
  const findings = `Risk Level: ${result.riskLevel}, Confidence: ${(result.confidence * 100).toFixed(1)}%, Polyp Coverage: ${(result.riskScore * 100).toFixed(1)}%`;
  
  const segmentationSummary = result.limeExplanation.summary + 
    '\nKey Features: ' + 
    result.limeExplanation.keyFeatures.map(f => `${f.feature} (${(f.importance * 100).toFixed(1)}%)`).join(', ');
  
  const gradcamSummary = `Grad-CAM visualization shows ${result.riskLevel === 'High Risk' ? 'high-intensity' : 'moderate-intensity'} attention regions. Heatmap indicates ${result.riskScore > 0.02 ? 'significant' : 'minor'} model activation in detected areas.`;
  
  try {
    const recommendation = await service.generateRecommendation({
      findings,
      segmentationSummary,
      gradcamSummary
    });
    
    return recommendation;
  } catch (error) {
    console.error('Failed to generate recommendation:', error);
    // Fallback to default recommendations
    return {
      summary: result.limeExplanation.summary,
      recommendation: result.recommendations.map(r => r.text).join('\n'),
      riskLevel: result.riskLevel === 'High Risk' ? 'high' : 
                 result.riskLevel === 'Medium Risk' ? 'moderate' : 'low'
    };
  }
}
```

## Environment Setup

Add your OpenAI API key to your `.env` file:

```
VITE_OPENAI_API_KEY=your-api-key-here
```







