"""
LLM Service for generating AI-powered clinical recommendations.
Uses OpenAI API to generate personalized recommendations based on analysis results.
"""

import os
from typing import List, Dict
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
# First try root directory (parent of CRC_model)
root_env_path = Path(__file__).parent.parent / '.env'
if root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path)
    print(f"Loaded .env from root directory: {root_env_path}")
# Also try CRC_model directory (for backward compatibility)
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"Loaded .env from CRC_model directory: {env_path}")
# Also try loading from current directory
load_dotenv()

class RecommendationService:
    """Service for generating AI-powered clinical recommendations."""
    
    def __init__(self):
        """Initialize the recommendation service with OpenAI API."""
        # Try multiple ways to get the API key
        api_key = os.getenv('OPENAI_API_KEY') or os.environ.get('OPENAI_API_KEY')
        
        if not api_key:
            # Print debug info
            root_env_file = Path(__file__).parent.parent / '.env'
            local_env_file = Path(__file__).parent / '.env'
            print(f"ERROR: OPENAI_API_KEY not found. Looking for .env file at:")
            print(f"   Root directory: {root_env_file} (exists: {root_env_file.exists()})")
            print(f"   CRC_model directory: {local_env_file} (exists: {local_env_file.exists()})")
            raise ValueError(
                "OPENAI_API_KEY not found in environment variables. "
                f"Please set OPENAI_API_KEY in your .env file in the root directory: {root_env_file}"
            )
        
        print(f"OpenAI API key loaded successfully (length: {len(api_key)} chars)")
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"  # Using cost-effective model
    
    def generate_recommendations(
        self,
        risk_level: str,
        cancer_percentage: float,
        statistics: dict = None,
        findings: str = None,
        segmentation_summary: str = None,
        gradcam_summary: str = None
    ) -> List[Dict[str, str]]:
        """
        Generate AI-powered clinical recommendations.
        
        Args:
            risk_level: Risk level string (High Risk, Medium Risk, Low Risk, Safe)
            cancer_percentage: Percentage of cancer/polyp coverage
            statistics: Optional statistics dictionary from mask analysis
            findings: Optional findings description
            segmentation_summary: Optional segmentation analysis summary
            gradcam_summary: Optional Grad-CAM analysis summary
            
        Returns:
            List of recommendation dictionaries with 'type' and 'text' keys
        """
        # Prepare context for AI
        context_parts = []
        
        if findings:
            context_parts.append(f"Clinical Findings: {findings}")
        
        if segmentation_summary:
            context_parts.append(f"Segmentation Analysis: {segmentation_summary}")
        
        if gradcam_summary:
            context_parts.append(f"Grad-CAM Analysis: {gradcam_summary}")
        
        if statistics:
            context_parts.append(
                f"Statistics: {statistics.get('cancer_pixels', 0)} polyp pixels out of "
                f"{statistics.get('total_pixels', 0)} total pixels "
                f"({cancer_percentage:.2f}% coverage)"
            )
        
        context = "\n".join(context_parts) if context_parts else f"Risk Level: {risk_level}, Coverage: {cancer_percentage:.2f}%"
        
        # Create prompt for OpenAI
        prompt = f"""You are a medical AI assistant providing clinical recommendations for colorectal cancer screening based on colonoscopy image analysis.

Analysis Results:
{context}

Risk Level: {risk_level}
Polyp Coverage: {cancer_percentage:.2f}%

Please provide 3-5 specific, actionable clinical recommendations based on these findings. 
Format each recommendation as a clear, concise statement suitable for a medical report.

For {risk_level} cases:
- Provide recommendations appropriate to the risk level
- Include urgency indicators (urgent, monitoring, routine)
- Be specific and actionable
- Use professional medical language

Return ONLY the recommendations, one per line, without numbering or bullets."""

        try:
            print(f"Calling OpenAI API with model: {self.model}")
            print(f"   Risk Level: {risk_level}, Coverage: {cancer_percentage:.2f}%")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a medical AI assistant specializing in colorectal cancer screening and diagnosis. Provide clear, evidence-based clinical recommendations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            # Extract recommendations from response
            recommendations_text = response.choices[0].message.content.strip()
            print(f"Raw AI response received ({len(recommendations_text)} chars):")
            print(f"   {recommendations_text[:200]}...")
            
            # Parse recommendations into structured format
            recommendations = self._parse_recommendations(recommendations_text, risk_level)
            
            if recommendations and len(recommendations) > 0:
                print(f"Successfully parsed {len(recommendations)} recommendations from AI response")
                return recommendations
            else:
                print("ERROR: Failed to parse recommendations from AI response")
                raise ValueError("Failed to parse AI recommendations")
            
        except Exception as e:
            import traceback
            print(f"ERROR: Error generating AI recommendations: {type(e).__name__}: {e}")
            print("   Full traceback:")
            traceback.print_exc()
            # Re-raise the exception so the caller knows it failed
            raise
    
    def _parse_recommendations(self, text: str, risk_level: str) -> List[Dict[str, str]]:
        """
        Parse AI-generated recommendations into structured format.
        
        Args:
            text: Raw recommendation text from AI
            risk_level: Risk level for categorization
            
        Returns:
            List of recommendation dictionaries
        """
        # Split by lines and clean up
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        recommendations = []
        for line in lines:
            # Remove numbering, bullets, etc.
            clean_line = line.lstrip('0123456789.-*•) ').strip()
            
            if not clean_line:
                continue
            
            # Determine recommendation type based on content and risk level
            lower_line = clean_line.lower()
            rec_type = 'routine'
            
            if risk_level in ['High Risk', 'Medium Risk']:
                if any(keyword in lower_line for keyword in ['urgent', 'immediate', 'biopsy', 'oncologist', 'consultation', 'asap']):
                    rec_type = 'urgent'
                elif any(keyword in lower_line for keyword in ['monitor', 'follow-up', 'follow up', 'surveillance']):
                    rec_type = 'monitoring'
                else:
                    rec_type = 'urgent'  # Default to urgent for high/medium risk
            else:
                if any(keyword in lower_line for keyword in ['monitor', 'follow-up', 'follow up', 'surveillance']):
                    rec_type = 'monitoring'
                else:
                    rec_type = 'routine'
            
            recommendations.append({
                'type': rec_type,
                'text': clean_line
            })
        
        # If no recommendations parsed, raise error
        if not recommendations:
            raise ValueError("Failed to parse any recommendations from AI response")
        
        return recommendations

