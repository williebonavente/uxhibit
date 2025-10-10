// Bar graph
import jsPDF from 'jspdf';
export interface TrendData {
  version: string;
  score: number;
  label: string;
}

const drawTrendChart = (pdf: jsPDF, data: TrendData[], x: number, y: number, width: number, height: number) => {
  // Adjusted margins for better visibility
  const marginLeft = 15;
  const marginBottom = 15;
  const marginTop = 10;
  const marginRight = 10;

  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  const chartX = x + marginLeft;
  const chartY = y + marginTop;

  // Get min and max scores from data
  const scores = data.map(d => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Add some padding to min/max for better visuals
  const yMin = Math.floor(minScore - 5);
  const yMax = Math.ceil(maxScore + 5);

  // Draw chart background
  pdf.setDrawColor(240, 240, 240);
  pdf.setLineWidth(0.5);
  pdf.rect(chartX, chartY, chartWidth, chartHeight, 'S');

  // Draw grid lines and Y-axis labels
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const value = yMin + ((yMax - yMin) * i) / gridSteps;
    const gridY = chartY + chartHeight - (i * chartHeight) / gridSteps;
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.2);
    pdf.line(chartX, gridY, chartX + chartWidth, gridY);
    pdf.text(Math.round(value).toString(), chartX - 12, gridY + 2);
  }

  // Calculate data points
  let points: [number, number][] = [];
  if (data.length === 1) {
    // Single point, center it
    const score = data[0].score;
    const pointY = chartY + chartHeight - ((score - yMin) * chartHeight) / (yMax - yMin);
    points = [[chartX + chartWidth / 2, pointY]];
  } else {
    points = data.map((item, index) => {
      const score = item.score;
      const pointX = chartX + (index * chartWidth) / (data.length - 1);
      const pointY = chartY + chartHeight - ((score - yMin) * chartHeight) / (yMax - yMin);
      return [pointX, pointY];
    });
  }

  // Draw smooth curve (thin line)
  pdf.setDrawColor(237, 94, 32);
  pdf.setLineWidth(0.5);

  const drawSmoothLine = (points: [number, number][]) => {
    if (points.length < 2) return;
    // Helper for interpolation
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      let prev = p0;
      const steps = 250; // Increase for smoother curve
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const x = lerp(p0[0], p1[0], t);
        const y = lerp(p0[1], p1[1], t);
        pdf.line(prev[0], prev[1], x, y);
        prev = [x, y];
      }
    }
  };

  drawSmoothLine(points);

  // Draw data points
  pdf.setFillColor(237, 94, 32);
  points.forEach((point) => {
    pdf.circle(point[0], point[1], 1.2, 'F');
  });

  // Add score labels above points
  pdf.setFontSize(8);
  pdf.setTextColor(237, 94, 32);
  points.forEach((point, index) => {
    const score = data[index].score.toFixed(1);
    pdf.text(score, point[0] - 5, point[1] - 4);
  });

  // Draw X-axis labels
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  data.forEach((item, index) => {
    const labelX = data.length === 1
      ? chartX + chartWidth / 2
      : chartX + (index * chartWidth) / (data.length - 1);
    pdf.text(item.label, labelX - 2, chartY + chartHeight + 8);
  });

  // Add axis labels
  pdf.setFontSize(10);
  pdf.setTextColor(237, 94, 32);

  // Y-axis label (rotated)
  const yLabelX = chartX - 20;
  const yLabelY = chartY + chartHeight / 2;
  pdf.text('Usability Score', yLabelX, yLabelY, { angle: 90 });

  // X-axis label
  const xLabelX = chartX + chartWidth / 2 - 15;
  const xLabelY = chartY + chartHeight + 18;
  pdf.text('Version', xLabelX, xLabelY);
};

export const generateUsabilityTrendReport = async (
  trendData: TrendData[]
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Usability Score Trend Report', 20, 30);

    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`Generated on: ${currentDate}`, 20, 40);

    // Add description
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const description = [
      'This report tracks how your design improves over time. Each submission is evaluated',
      'using Jakob Nielsen\'s 10 heuristics, and your score is plotted to show progress.',
      'The trend helps you see whether revisions are making your UI more usable.'
    ];

    let yPosition = 55;
    description.forEach(line => {
      pdf.text(line, 20, yPosition);
      yPosition += 6;
    });

    // Add chart title
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Usability Score Trend Chart', 20, 85);

    // Draw trend chart
    drawTrendChart(pdf, trendData, 20, 95, 170, 80);

    // Add data table
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Score History', 20, 190);

    // Table headers
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(237, 94, 32);
    pdf.rect(20, 200, 170, 8, 'F');
    pdf.text('Version', 25, 206);
    pdf.text('Score', 80, 206);
    pdf.text('Improvement', 120, 206);
    pdf.text('Status', 160, 206);

    // Table rows
    let rowY = 210;
    trendData.forEach((item, index) => {
      // Check if we need a new page
      if (rowY > 270) {
        pdf.addPage();
        rowY = 30;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, rowY - 2, 170, 6, 'F');
      }

      pdf.setTextColor(0, 0, 0);
      pdf.text(item.version, 25, rowY + 2);
      pdf.text(item.score.toFixed(1), 80, rowY + 2);

      // Calculate improvement
      if (index > 0) {
        const improvement = item.score - trendData[index - 1].score;
        const improvementText = improvement > 0 ? `+${improvement.toFixed(1)}` : improvement.toFixed(1);
        const improvementColor = improvement > 0 ? [0, 128, 0] : improvement < 0 ? [255, 0, 0] : [100, 100, 100];

        pdf.setTextColor(improvementColor[0], improvementColor[1], improvementColor[2]);
        pdf.text(improvementText, 120, rowY + 2);
      } else {
        pdf.setTextColor(100, 100, 100);
        pdf.text('Baseline', 120, rowY + 2);
      }

      // Status based on score
      const status = item.score >= 8 ? 'Excellent' : item.score >= 6 ? 'Good' : item.score >= 4 ? 'Fair' : 'Needs Work';
      const statusColor = item.score >= 8 ? [0, 128, 0] : item.score >= 6 ? [255, 165, 0] : item.score >= 4 ? [255, 140, 0] : [255, 0, 0];

      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(status, 160, rowY + 2);

      rowY += 8;
    });

    // Add analysis section
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Progress Analysis', 20, 30);

    // Calculate statistics
    const scores = trendData.map(d => d.score);
    const latestScore = scores[scores.length - 1];
    const firstScore = scores[0];
    const totalImprovement = latestScore - firstScore;
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    const analysisPoints = [
      `Current Score: ${latestScore.toFixed(1)}/10`,
      `Starting Score: ${firstScore.toFixed(1)}/10`,
      `Total Improvement: ${totalImprovement >= 0 ? '+' : ''}${totalImprovement.toFixed(1)} points`,
      `Average Score: ${averageScore.toFixed(1)}/10`,
      `Best Performance: ${maxScore.toFixed(1)}/10`,
      `Lowest Score: ${minScore.toFixed(1)}/10`
    ];

    yPosition = 50;
    analysisPoints.forEach(point => {
      pdf.text(`• ${point}`, 25, yPosition);
      yPosition += 8;
    });

    // Add recommendations
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Recommendations', 20, yPosition + 15);

    yPosition += 25;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    const recommendations = [];
    if (totalImprovement > 0) {
      recommendations.push('Great progress! Continue with your current improvement strategy.');
    } else if (totalImprovement < 0) {
      recommendations.push('Consider revisiting your design approach to improve usability scores.');
    } else {
      recommendations.push('Maintain consistency in your design approach while exploring new improvements.');
    }

    if (latestScore < 5) {
      recommendations.push('Focus on addressing fundamental usability issues first.');
      recommendations.push('Consider conducting user interviews to identify pain points.');
    } else if (latestScore < 8) {
      recommendations.push('Work on refining user experience details for higher scores.');
      recommendations.push('Focus on improving specific heuristic areas with lower scores.');
    } else {
      recommendations.push('Excellent scores! Focus on maintaining this level of usability.');
      recommendations.push('Consider sharing your design patterns with the team.');
    }

    recommendations.push('Conduct regular user testing to validate score improvements.');
    recommendations.push('Document successful design patterns for future projects.');
    recommendations.push('Set target scores for upcoming versions to maintain progress.');

    recommendations.forEach((rec, index) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(`${index + 1}. ${rec}`, 25, yPosition);
      yPosition += 7;
    });

    // Add insights section
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 30;
    } else {
      yPosition += 15;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Key Insights', 20, yPosition);

    yPosition += 15;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    // Generate insights based on data
    const insights = [];

    if (scores.length >= 3) {
      const recentTrend = scores.slice(-3);
      const isImproving = recentTrend[2] > recentTrend[0];
      const trendDescription = isImproving ? 'upward' : 'downward';
      insights.push(`Recent trend shows ${trendDescription} movement in usability scores.`);
    }

    const volatility = Math.max(...scores) - Math.min(...scores);
    if (volatility > 3) {
      insights.push('High score volatility suggests inconsistent design patterns.');
    } else {
      insights.push('Consistent score range indicates stable design quality.');
    }

    const aboveAverageVersions = scores.filter(score => score >= averageScore).length;
    const percentageAboveAverage = (aboveAverageVersions / scores.length) * 100;
    insights.push(`${percentageAboveAverage.toFixed(0)}% of versions scored above the average.`);

    insights.forEach(insight => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(`• ${insight}`, 25, yPosition);
      yPosition += 7;
    });

    const fileName = `usability-trend-report-${currentDate.replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};