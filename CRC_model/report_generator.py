"""
PDF Report Generator for CRC Segmentation Analysis.
Creates comprehensive reports with visual and numeric insights.
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from PIL import Image as PILImage
from datetime import datetime
from pathlib import Path
import io
import base64
import numpy as np


class CRCReportGenerator:
    """Generate comprehensive PDF reports for CRC segmentation analysis."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Section header
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        # Risk level style
        self.styles.add(ParagraphStyle(
            name='RiskLevel',
            parent=self.styles['Normal'],
            fontSize=14,
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
    
    def _get_risk_color(self, risk_level: str):
        """Get color based on risk level."""
        risk_colors = {
            'Safe': colors.HexColor('#10b981'),
            'Low Risk': colors.HexColor('#3b82f6'),
            'Medium Risk': colors.HexColor('#f59e0b'),
            'High Risk': colors.HexColor('#ef4444')
        }
        return risk_colors.get(risk_level, colors.grey)
    
    def _decode_base64_image(self, base64_string: str, max_width: float = 4.5*inch) -> Image:
        """Decode base64 image and prepare for PDF."""
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Load with PIL
        pil_image = PILImage.open(io.BytesIO(image_data))
        
        # Save to temporary buffer
        img_buffer = io.BytesIO()
        pil_image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Create ReportLab image with aspect ratio
        img = Image(img_buffer, width=max_width, height=max_width * pil_image.height / pil_image.width)
        return img
    
    def generate_report(
        self,
        output_path: str,
        filename: str,
        original_image: str,
        overlay_image: str,
        heatmap_image: str,
        statistics: dict,
        risk_level: str,
        confidence: float,
        recommendations: list
    ) -> str:
        """
        Generate comprehensive PDF report.
        
        Args:
            output_path: Directory to save PDF
            filename: Original filename
            original_image: Base64 encoded original image
            overlay_image: Base64 encoded overlay
            heatmap_image: Base64 encoded heatmap
            statistics: Segmentation statistics
            risk_level: Risk assessment level
            confidence: Model confidence
            recommendations: List of recommendations
            
        Returns:
            Path to generated PDF
        """
        # Create output directory
        output_dir = Path(output_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate PDF filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"CRC_Report_{Path(filename).stem}_{timestamp}.pdf"
        pdf_path = output_dir / pdf_filename
        
        # Create PDF document
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Build content
        story = []
        
        # Header
        story.append(Paragraph("ColoVision Analysis Report", self.styles['CustomTitle']))
        story.append(Paragraph(
            f"Colorectal Cancer Segmentation Analysis",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.2*inch))
        
        # Report metadata
        metadata = [
            ['Report Date:', datetime.now().strftime("%B %d, %Y %I:%M %p")],
            ['Image File:', filename],
            ['Analysis Type:', 'Binary Segmentation (ONNX Model)']
        ]
        metadata_table = Table(metadata, colWidths=[2*inch, 4*inch])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(metadata_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Risk Assessment Section
        story.append(Paragraph("Risk Assessment", self.styles['SectionHeader']))
        
        risk_color = self._get_risk_color(risk_level)
        risk_data = [
            ['Risk Level:', Paragraph(
                f'<font color="{risk_color.hexval()}" size="14"><b>{risk_level}</b></font>',
                self.styles['Normal']
            )],
            ['Polyp Coverage:', f"{statistics.get('cancer_percentage', 0):.2f}%"],
            ['Model Confidence:', f"{confidence * 100:.1f}%"],
            ['Detected Pixels:', f"{statistics.get('cancer_pixels', 0):,}"],
            ['Total Pixels:', f"{statistics.get('total_pixels', 0):,}"]
        ]
        
        risk_table = Table(risk_data, colWidths=[2*inch, 4*inch])
        risk_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(risk_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Clinical Recommendations
        story.append(Paragraph("Clinical Recommendations", self.styles['SectionHeader']))
        
        for idx, rec in enumerate(recommendations, 1):
            rec_text = f"{idx}. {rec.get('text', 'No recommendation')}"
            story.append(Paragraph(rec_text, self.styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        
        story.append(Spacer(1, 0.2*inch))
        
        # Visual Analysis Section
        story.append(PageBreak())
        story.append(Paragraph("Visual Analysis", self.styles['SectionHeader']))
        story.append(Paragraph(
            "Comparative analysis showing original colonoscopy image alongside AI segmentation results.",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.3*inch))
        
        # Side-by-Side: Original vs Segmentation Overlay
        story.append(Paragraph("Original Image vs Segmentation Overlay", self.styles['Heading3']))
        story.append(Paragraph(
            "The left image shows the original colonoscopy view. The right image shows the AI-detected "
            "polyp regions highlighted in red, overlaid on the original image.",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.15*inch))
        
        try:
            orig_img = self._decode_base64_image(original_image, max_width=3.2*inch)
            overlay_img = self._decode_base64_image(overlay_image, max_width=3.2*inch)
            
            # Create side-by-side table for images
            image_comparison_data = [
                [
                    Paragraph("<b>Original Colonoscopy Image</b>", 
                             ParagraphStyle('CenterBold', parent=self.styles['Normal'], 
                                          alignment=TA_CENTER, fontName='Helvetica-Bold')),
                    Paragraph("<b>AI Segmentation Result</b>", 
                             ParagraphStyle('CenterBold', parent=self.styles['Normal'], 
                                          alignment=TA_CENTER, fontName='Helvetica-Bold'))
                ],
                [orig_img, overlay_img],
                [
                    Paragraph("Unprocessed colonoscopy image", 
                             ParagraphStyle('CenterSmall', parent=self.styles['Normal'], 
                                          fontSize=8, alignment=TA_CENTER, 
                                          textColor=colors.HexColor('#6b7280'))),
                    Paragraph("Red areas = Detected polyps", 
                             ParagraphStyle('CenterSmall', parent=self.styles['Normal'], 
                                          fontSize=8, alignment=TA_CENTER, 
                                          textColor=colors.HexColor('#ef4444')))
                ]
            ]
            
            image_comparison_table = Table(image_comparison_data, colWidths=[3.5*inch, 3.5*inch])
            image_comparison_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 1), (-1, 1), 12),
                ('BOTTOMPADDING', (0, 1), (-1, 1), 12),
                ('TOPPADDING', (0, 2), (-1, 2), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dbeafe')),
                ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#f9fafb')),
            ]))
            story.append(image_comparison_table)
        except Exception as e:
            story.append(Paragraph(f"Error loading comparison images: {e}", self.styles['Normal']))
        
        story.append(Spacer(1, 0.3*inch))
        
        # Segmentation Details
        story.append(Paragraph("Segmentation Analysis Details", self.styles['Heading3']))
        
        seg_details_data = [
            ['Aspect', 'Finding', 'Clinical Significance'],
            [
                'Segmentation\nMask',
                'Binary detection of\nabnormal tissue regions',
                'Identifies exact spatial location\nand extent of pathology'
            ],
            [
                'Coverage Area',
                f'{statistics.get("cancer_pixels", 0):,} pixels detected\n'
                f'({statistics.get("cancer_percentage", 0):.2f}% of image)',
                'Quantifies polyp size\nrelative to field of view'
            ],
            [
                'Model Prediction',
                f'Confidence: {confidence * 100:.1f}%\n'
                f'Risk Level: {risk_level}',
                'Indicates reliability of\nautomated detection'
            ],
        ]
        
        seg_details_table = Table(seg_details_data, colWidths=[2*inch, 2.5*inch, 2.5*inch])
        seg_details_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ]))
        story.append(seg_details_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Grad-CAM Heatmap
        story.append(PageBreak())
        story.append(Paragraph("Grad-CAM Attention Heatmap", self.styles['Heading3']))
        story.append(Paragraph(
            "Gradient-weighted Class Activation Mapping (Grad-CAM) visualization showing where the neural "
            "network focused its attention. Red areas show high-attention polyp regions. Green areas indicate "
            "normal tissue where the model determined no pathology is present.",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.15*inch))
        
        try:
            heatmap_img = self._decode_base64_image(heatmap_image, max_width=5*inch)
            
            # Center the heatmap in a styled container
            heatmap_data = [
                [Paragraph("<b>Model Attention Visualization</b>", 
                          ParagraphStyle('CenterBold', parent=self.styles['Normal'], 
                                       alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=11))],
                [heatmap_img],
                [Paragraph(
                    "<font color='red'><b>Red:</b></font> Detected polyp regions (high confidence) | "
                    "<font color='green'><b>Green:</b></font> Normal tissue (low risk)",
                    ParagraphStyle('CenterSmall', parent=self.styles['Normal'], 
                                 fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#374151'))
                )]
            ]
            
            heatmap_table = Table(heatmap_data, colWidths=[5*inch])
            heatmap_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f3e8ff')),
                ('BACKGROUND', (0, 1), (0, 1), colors.white),
                ('BACKGROUND', (0, 2), (0, 2), colors.HexColor('#f9fafb')),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (0, 0), 8),
                ('BOTTOMPADDING', (0, 0), (0, 0), 8),
                ('TOPPADDING', (0, 1), (0, 1), 12),
                ('BOTTOMPADDING', (0, 1), (0, 1), 12),
            ]))
            story.append(heatmap_table)
        except Exception as e:
            story.append(Paragraph(f"Error loading heatmap: {e}", self.styles['Normal']))
        
        story.append(Spacer(1, 0.2*inch))
        
        # Grad-CAM Explanation Table
        gradcam_explanation = [
            ['Visualization Element', 'Interpretation', 'Medical Relevance'],
            [
                Paragraph('<font color="red"><b>Red Overlay</b></font>', self.styles['Normal']),
                'Areas where the model\ndetected polyp features',
                'Primary regions requiring\nclinical examination'
            ],
            [
                Paragraph('<font color="green"><b>Green Overlay</b></font>', self.styles['Normal']),
                'Areas classified as\nnormal healthy tissue',
                'Regions with low\npathology probability'
            ],
            [
                'Color Intensity',
                'Indicates model confidence\nin its predictions',
                'Stronger colors suggest\nhigher certainty'
            ],
        ]
        
        gradcam_table = Table(gradcam_explanation, colWidths=[2*inch, 2.5*inch, 2.5*inch])
        gradcam_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#faf5ff'), colors.white]),
        ]))
        story.append(gradcam_table)
        
        # Additional Insights Section
        story.append(PageBreak())
        story.append(Paragraph("Summary & Key Insights", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.1*inch))
        
        # Key Findings Summary
        key_findings = [
            ['Parameter', 'Value', 'Status'],
            ['Polyp Coverage', f"{statistics.get('cancer_percentage', 0):.2f}%", 
             'High' if statistics.get('cancer_percentage', 0) > 2 else 
             'Medium' if statistics.get('cancer_percentage', 0) > 0.5 else 'Low'],
            ['Total Pixels Analyzed', f"{statistics.get('total_pixels', 0):,}", 'Complete'],
            ['Abnormal Pixels', f"{statistics.get('cancer_pixels', 0):,}", 
             'Detected' if statistics.get('cancer_pixels', 0) > 0 else 'None'],
            ['Model Confidence', f"{confidence * 100:.1f}%", 
             'High' if confidence > 0.8 else 'Moderate'],
            ['Risk Classification', risk_level, 
             'Critical' if risk_level == 'High Risk' else 
             'Attention' if risk_level == 'Medium Risk' else 'Normal'],
        ]
        
        findings_table = Table(key_findings, colWidths=[2.5*inch, 2.5*inch, 2*inch])
        findings_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#eff6ff'), colors.white]),
        ]))
        story.append(findings_table)
        
        story.append(Spacer(1, 0.3*inch))
        
        # Model Information
        story.append(Paragraph("Model Information", self.styles['Heading3']))
        model_info = [
            ['Model Type', 'UNet with EfficientNet-B0 Backbone'],
            ['Task', 'Binary Segmentation (Polyp Detection)'],
            ['Format', 'ONNX Optimized'],
            ['Input Size', '256×256 pixels (RGB)'],
            ['Output', 'Binary mask with probability scores'],
        ]
        
        model_table = Table(model_info, colWidths=[2*inch, 5*inch])
        model_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(model_table)
        
        # Footer/Disclaimer
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(
            "<b>Medical Disclaimer:</b> This analysis is generated by an artificial intelligence model "
            "and should be used as a decision support tool only. Final diagnosis should always be made "
            "by qualified medical professionals through comprehensive clinical evaluation. This report "
            "does not constitute medical advice, diagnosis, or treatment recommendations. The AI model "
            "has been trained on medical imaging data but may not capture all clinical nuances. "
            "Always consult with healthcare professionals for proper medical guidance.",
            ParagraphStyle(
                'Disclaimer',
                parent=self.styles['Normal'],
                fontSize=7,
                textColor=colors.HexColor('#6b7280'),
                alignment=TA_JUSTIFY
            )
        ))
        
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(
            f"<b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | "
            f"<b>ColoVision AI v1.0</b>",
            ParagraphStyle(
                'Footer',
                parent=self.styles['Normal'],
                fontSize=7,
                textColor=colors.HexColor('#9ca3af'),
                alignment=TA_CENTER
            )
        ))
        
        # Build PDF
        doc.build(story)
        
        return str(pdf_path)


def create_report(
    filename: str,
    original_image: str,
    overlay_image: str,
    heatmap_image: str,
    statistics: dict,
    risk_level: str,
    confidence: float,
    recommendations: list,
    output_dir: str = "outputs/reports"
) -> str:
    """
    Convenience function to create a report.
    
    Returns:
        Path to generated PDF file
    """
    generator = CRCReportGenerator()
    return generator.generate_report(
        output_path=output_dir,
        filename=filename,
        original_image=original_image,
        overlay_image=overlay_image,
        heatmap_image=heatmap_image,
        statistics=statistics,
        risk_level=risk_level,
        confidence=confidence,
        recommendations=recommendations
    )

