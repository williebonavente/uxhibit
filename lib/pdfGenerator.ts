import jsPDF from 'jspdf';

export interface HeuristicData {
  heuristic: string;
  fullName: string;
  value: number;
}

// Simple chart drawing function
const drawSimpleChart = (pdf: jsPDF, data: HeuristicData[], x: number, y: number, size: number) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2 - 20;
  
  // Draw grid circles
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);
  for (let i = 1; i <= 5; i++) {
    const r = (radius * i) / 5;
    pdf.circle(centerX, centerY, r, 'S');
  }
  
  // Draw axis lines and labels
  const angles = data.map((_, index) => (index * 2 * Math.PI) / data.length - Math.PI / 2);
  
  pdf.setDrawColor(150, 150, 150);
  angles.forEach((angle, index) => {
    const endX = centerX + radius * Math.cos(angle);
    const endY = centerY + radius * Math.sin(angle);
    
    // Draw axis line
    pdf.line(centerX, centerY, endX, endY);
    
    // Add label
    const labelX = centerX + (radius + 8) * Math.cos(angle);
    const labelY = centerY + (radius + 8) * Math.sin(angle);
    pdf.setFontSize(8);
    pdf.setTextColor(237, 94, 32);
    pdf.text(data[index].heuristic, labelX - 2, labelY + 2);
  });
  
  // Calculate data points
  const points: [number, number][] = data.map((item, index) => {
    const angle = angles[index];
    const distance = (item.value / 100) * radius;
    return [
      centerX + distance * Math.cos(angle),
      centerY + distance * Math.sin(angle)
    ];
  });
  
  // Draw data polygon outline
  pdf.setDrawColor(237, 94, 32);
  pdf.setLineWidth(0.8);
  points.forEach((point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    pdf.line(point[0], point[1], nextPoint[0], nextPoint[1]);
  });
  
  // Draw data points
  pdf.setFillColor(237, 94, 32);
  points.forEach((point) => {
    pdf.circle(point[0], point[1], 1.5, 'F');
  });
  
  // Add value labels next to each point
  pdf.setFontSize(7);
  pdf.setTextColor(237, 94, 32);
  points.forEach((point, index) => {
    const value = data[index].value;
    pdf.text(value.toString(), point[0] + 2, point[1] - 1);
  });
};

export const generateHeuristicReportSimple = async (
  heuristicData: HeuristicData[]
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Heuristic Violation Frequency Report', 20, 30);
    
    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`Generated on: ${currentDate}`, 20, 40);
    
    // Add description
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const description = [
      'This report shows which usability heuristics are being violated most often.',
      'The radar chart breaks down how frequently these issues occur in your projects,',
      'with color-coded severity levels to help identify areas for improvement.'
    ];
    
    let yPosition = 55;
    description.forEach(line => {
      pdf.text(line, 20, yPosition);
      yPosition += 6;
    });
    
    // Add chart title
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Heuristic Violation Radar Chart', 20, 85);
    
    // Draw simple radar chart
    drawSimpleChart(pdf, heuristicData, 50, 95, 100);
    
    // Add chart legend
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    const legendStartY = 200;
    heuristicData.forEach((item, index) => {
      const legendY = legendStartY + (index * 5);
      if (legendY < 280) { // Ensure we don't go off the page
        const severity = item.value <= 20 ? 'Minor' : item.value <= 40 ? 'Medium' : 'Major';
        const severityColor = item.value <= 20 ? [0, 128, 0] : item.value <= 40 ? [255, 165, 0] : [255, 0, 0];
        
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${item.heuristic}. ${item.fullName}`, 20, legendY);
        pdf.text(`Score: ${item.value}`, 120, legendY);
        
        pdf.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
        pdf.text(`(${severity})`, 140, legendY);
      }
    });
    
    // Add new page for detailed data
    pdf.addPage();
    
    // Detailed analysis
    pdf.setFontSize(16);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Detailed Heuristic Analysis', 20, 30);
    
    // Create table
    const tableData = heuristicData.map(item => [
      item.heuristic,
      item.fullName,
      item.value.toString(),
      item.value <= 20 ? 'Minor' : item.value <= 40 ? 'Medium' : 'Major'
    ]);
    
    // Table headers
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(237, 94, 32);
    pdf.rect(20, 45, 170, 8, 'F');
    pdf.text('#', 22, 51);
    pdf.text('Heuristic', 35, 51);
    pdf.text('Score', 160, 51);
    pdf.text('Severity', 175, 51);
    
    // Table rows
    let rowY = 55;
    tableData.forEach((row, index) => {
      const [num, heuristic, score, severity] = row;
      
      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, rowY - 2, 170, 6, 'F');
      }
      
      pdf.setTextColor(0, 0, 0);
      pdf.text(num, 22, rowY + 2);
      
      const wrappedText = pdf.splitTextToSize(heuristic, 118);
      pdf.text(wrappedText, 35, rowY + 2);
      
      pdf.text(score, 160, rowY + 2);
      
      const severityColor = severity === 'Minor' ? [0, 128, 0] : 
                           severity === 'Medium' ? [255, 165, 0] : [255, 0, 0];
      pdf.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      pdf.text(severity, 175, rowY + 2);
      
      rowY += Math.max(8, wrappedText.length * 4);
    });
    
    // Add recommendations page
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Recommendations', 20, 30);
    
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    const recommendations = [
      '1. Focus on high-scoring heuristics (Major severity) first',
      '2. Review projects with consistent violation patterns',
      '3. Implement design system standards for common issues',
      '4. Conduct user testing to validate improvements',
      '5. Schedule regular heuristic evaluations'
    ];
    
    yPosition = 45;
    recommendations.forEach(line => {
      pdf.text(line, 20, yPosition);
      yPosition += 8;
    });
    
    // Priority areas
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Priority Areas for Improvement:', 20, yPosition + 10);
    
    yPosition += 20;
    const highPriorityItems = heuristicData
      .filter(item => item.value > 40)
      .sort((a, b) => b.value - a.value);
    
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    if (highPriorityItems.length > 0) {
      highPriorityItems.forEach(item => {
        pdf.text(`• ${item.fullName} (Score: ${item.value})`, 25, yPosition);
        yPosition += 6;
      });
    } else {
      pdf.text('• No major priority areas identified. Great job!', 25, yPosition);
    }
    
    const fileName = `heuristic-report-${currentDate.replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};