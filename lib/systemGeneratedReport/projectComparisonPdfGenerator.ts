// Line chart here

import jsPDF from 'jspdf';

export interface ProjectData {
  title: string;
  score: number;
  submissionDate: string;
  feedbackItems: number;
  severity: 'Minor' | 'Major';
  dateSort: Date;
}

// Simple bar chart for project scores
const drawProjectScoresChart = (pdf: jsPDF, data: ProjectData[], x: number, y: number, width: number, height: number) => {
  const marginLeft = 40;
  const marginBottom = 30;
  const marginTop = 10;
  const marginRight = 10;

  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  const chartX = x + marginLeft;
  const chartY = y + marginTop;

  // Draw chart background
  pdf.setDrawColor(240, 240, 240);
  pdf.setLineWidth(0.1);
  pdf.rect(chartX, chartY, chartWidth, chartHeight, 'S');

  // Draw grid lines (0-100 scale)
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.1);
  for (let i = 0; i <= 10; i++) {
    const gridY = chartY + (i * chartHeight) / 10;
    pdf.line(chartX, gridY, chartX + chartWidth, gridY);
  }

  // Draw Y-axis labels (0-100)
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  for (let i = 0; i <= 10; i++) {
    const value = i * 10;
    const labelY = chartY + chartHeight - (i * chartHeight) / 10;
    pdf.text(value.toString(), chartX - 12, labelY + 1);
  }

  // Calculate bar dimensions
  const barWidth = Math.min(chartWidth / data.length - 4, 20);
  const barSpacing = chartWidth / data.length;

  // Draw bars
  data.forEach((project, index) => {
    const barHeight = (project.score * chartHeight) / 100;
    const barX = chartX + (index * barSpacing) + (barSpacing - barWidth) / 2;
    const barY = chartY + chartHeight - barHeight;

    // Color based on score
    const color = project.score >= 80 ? [76, 175, 80] :
      project.score >= 50 ? [255, 193, 7] : [244, 67, 54];

    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(barX, barY, barWidth, barHeight, 'F');

    // Add score label on top of bar
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(project.score.toString(), barX + barWidth / 2 - 3, barY - 2);

    // Add project name at bottom
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    const projectLabel = project.title.replace('Project ', 'P');
    pdf.text(projectLabel, barX + barWidth / 2 - 3, chartY + chartHeight + 8);
  });

  // Add axis labels
  pdf.setFontSize(10);
  pdf.setTextColor(237, 94, 32);

  // Y-axis label
  pdf.text('Score', chartX - 30, chartY + chartHeight / 2, { angle: 90 });

  // X-axis label
  pdf.text('Projects', chartX + chartWidth / 2 - 15, chartY + chartHeight + 25);
};

// Timeline chart showing submission dates
const drawTimelineChart = (pdf: jsPDF, data: ProjectData[], x: number, y: number, width: number, height: number) => {
  const marginLeft = 20;
  const marginBottom = 20;
  const marginTop = 10;
  const marginRight = 20;

  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  const chartX = x + marginLeft;
  const chartY = y + marginTop;

  // Sort by date for timeline
  const sortedData = [...data].sort((a, b) => a.dateSort.getTime() - b.dateSort.getTime());

  // Draw timeline line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(1);
  pdf.line(chartX, chartY + chartHeight / 2, chartX + chartWidth, chartY + chartHeight / 2);

  // Draw project points on timeline
  sortedData.forEach((project, index) => {
    const pointX = chartX + (index * chartWidth) / (sortedData.length - 1);
    const pointY = chartY + chartHeight / 2;

    // Validate coordinates before drawing
    if (
      typeof pointX === 'number' && !isNaN(pointX) &&
      typeof pointY === 'number' && !isNaN(pointY)
    ) {
      const color = project.severity === 'Minor' ? [76, 175, 80] : [244, 67, 54];
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.circle(pointX, pointY, 3, 'F');

      // Validate project.title before drawing text
      if (typeof project.title === 'string' && project.title.trim() !== '') {
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.text(project.title, pointX - 8, pointY - 8);
      } else {
        console.warn('Invalid project.title for pdf.text:', project.title);
      }

      // Validate submissionDate before drawing text
      const shortDate = typeof project.submissionDate === 'string' ? project.submissionDate.split(',')[0] : '';
      if (shortDate) {
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128);
        pdf.text(shortDate, pointX - 10, pointY + 10);
      } else {
        console.warn('Invalid submissionDate for pdf.text:', project.submissionDate);
      }
    } else {
      console.warn('Invalid coordinates for pdf.circle/text:', { pointX, pointY, project });
    }
  });

  // Add legend
  pdf.setFontSize(8);
  pdf.setFillColor(76, 175, 80);
  pdf.circle(chartX, chartY + chartHeight - 5, 2, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Minor Issues', chartX + 6, chartY + chartHeight - 3);

  pdf.setFillColor(244, 67, 54);
  pdf.circle(chartX + 50, chartY + chartHeight - 5, 2, 'F');
  pdf.text('Major Issues', chartX + 56, chartY + chartHeight - 3);
};

export const generateProjectComparisonReport = async (
  projectData: ProjectData[],
  filteredData: ProjectData[],
  filters: {
    severityFilter: string;
    scoreFilter: string;
  }
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    // const pageWidth = pdf.internal.pageSize.getWidth();

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Project Performance Comparison Report', 20, 30);

    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`Generated on: ${currentDate}`, 20, 40);

    // Add filter information if applied
    if (filters.severityFilter !== 'all' || filters.scoreFilter !== 'all') {
      pdf.setFontSize(10);
      pdf.setTextColor(237, 94, 32);
      let filterText = 'Filters Applied: ';
      if (filters.severityFilter !== 'all') {
        filterText += `Severity: ${filters.severityFilter} `;
      }
      if (filters.scoreFilter !== 'all') {
        filterText += `Score: ${filters.scoreFilter}`;
      }
      pdf.text(filterText, 20, 50);
    }

    // Add description
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const description = [
      'This report compares all your submitted projects at a glance, displaying each design\'s',
      'usability score, submission date, feedback items, and issue severity. Use this analysis',
      'to track your progress and identify which projects need more work.'
    ];

    let yPosition = filters.severityFilter !== 'all' || filters.scoreFilter !== 'all' ? 65 : 55;
    description.forEach(line => {
      pdf.text(line, 20, yPosition);
      yPosition += 6;
    });

    // Add project scores chart
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Project Scores Overview', 20, yPosition + 15);

    drawProjectScoresChart(pdf, filteredData, 20, yPosition + 25, 170, 60);

    // Add timeline chart
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Project Timeline', 20, yPosition + 100);

    drawTimelineChart(pdf, filteredData, 20, yPosition + 110, 170, 40);

    // Add new page for detailed table
    pdf.addPage();

    // Project comparison table
    pdf.setFontSize(16);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Detailed Project Comparison', 20, 30);

    // Show filtering info
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Showing ${filteredData.length} of ${projectData.length} projects`, 20, 40);

    // Table headers
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(237, 94, 32);
    pdf.rect(20, 50, 170, 8, 'F');
    pdf.text('Project', 22, 56);
    pdf.text('Score', 55, 56);
    pdf.text('Date', 75, 56);
    pdf.text('Feedback', 110, 56);
    pdf.text('Severity', 140, 56);
    pdf.text('Status', 165, 56);

    // Table rows
    let rowY = 60;
    filteredData.forEach((project, index) => {
      // Check if we need a new page
      if (rowY > 270) {
        pdf.addPage();
        rowY = 30;

        // Repeat headers on new page
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(237, 94, 32);
        pdf.rect(20, rowY - 10, 170, 8, 'F');
        pdf.text('Project', 22, rowY - 4);
        pdf.text('Score', 55, rowY - 4);
        pdf.text('Date', 75, rowY - 4);
        pdf.text('Feedback', 110, rowY - 4);
        pdf.text('Severity', 140, rowY - 4);
        pdf.text('Status', 165, rowY - 4);
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, rowY - 2, 170, 6, 'F');
      }

      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(project.title, 22, rowY + 2);

      // Score with color
      const scoreColor = project.score >= 80 ? [76, 175, 80] :
        project.score >= 50 ? [255, 193, 7] : [244, 67, 54];
      pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.text(project.score.toString(), 55, rowY + 2);

      // Date
      pdf.setTextColor(100, 100, 100);
      const shortDate = project.submissionDate.split(' ').slice(0, 2).join(' '); // Shorten date
      pdf.text(shortDate, 75, rowY + 2);

      // Feedback items
      pdf.setTextColor(0, 0, 0);
      pdf.text(project.feedbackItems.toString(), 110, rowY + 2);

      // Severity with color
      const severityColor = project.severity === 'Minor' ? [76, 175, 80] : [244, 67, 54];
      pdf.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      pdf.text(project.severity, 140, rowY + 2);

      // Status
      const status = project.score >= 80 ? 'Excellent' :
        project.score >= 60 ? 'Good' :
          project.score >= 40 ? 'Fair' : 'Needs Work';
      const statusColor = project.score >= 80 ? [76, 175, 80] :
        project.score >= 60 ? [139, 195, 74] :
          project.score >= 40 ? [255, 193, 7] : [244, 67, 54];
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(status, 165, rowY + 2);

      rowY += 8;
    });

    // Add summary statistics page
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Summary Statistics', 20, 30);

    // Calculate statistics
    const scores = filteredData.map(p => p.score);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const majorIssuesCount = filteredData.filter(p => p.severity === 'Major').length;
    const majorIssuesPercentage = filteredData.length > 0 ? (majorIssuesCount / filteredData.length) * 100 : 0;
    const avgFeedbackItems = filteredData.length > 0 ?
      Math.round(filteredData.reduce((sum, p) => sum + p.feedbackItems, 0) / filteredData.length) : 0;

    // Statistics grid
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    const stats = [
      `Total Projects: ${filteredData.length}`,
      `Average Score: ${averageScore.toFixed(1)}/100`,
      `Highest Score: ${maxScore}/100`,
      `Lowest Score: ${minScore}/100`,
      `Projects with Major Issues: ${majorIssuesCount} (${majorIssuesPercentage.toFixed(1)}%)`,
      `Average Feedback Items: ${avgFeedbackItems}`
    ];

    yPosition = 50;
    stats.forEach(stat => {
      pdf.text(`• ${stat}`, 25, yPosition);
      yPosition += 10;
    });

    // Performance analysis
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Performance Analysis', 20, yPosition + 15);

    yPosition += 25;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    const analysis = [];

    if (averageScore >= 80) {
      analysis.push('Excellent overall performance! Most projects meet high usability standards.');
    } else if (averageScore >= 60) {
      analysis.push('Good performance with room for improvement in some areas.');
    } else {
      analysis.push('Performance indicates significant opportunities for usability improvements.');
    }

    if (majorIssuesPercentage > 50) {
      analysis.push('High percentage of projects have major usability issues requiring attention.');
    } else if (majorIssuesPercentage > 25) {
      analysis.push('Moderate percentage of projects have major issues - focus on critical problems.');
    } else {
      analysis.push('Low percentage of major issues indicates good overall design quality.');
    }

    const scoreRange = maxScore - minScore;
    if (scoreRange > 40) {
      analysis.push('Wide score variation suggests inconsistent design quality across projects.');
    } else {
      analysis.push('Consistent score range indicates stable design methodology.');
    }

    analysis.forEach(point => {
      pdf.text(`• ${point}`, 25, yPosition);
      yPosition += 8;
    });

    // Recommendations
    pdf.setFontSize(14);
    pdf.setTextColor(237, 94, 32);
    pdf.text('Recommendations', 20, yPosition + 15);

    yPosition += 25;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    const recommendations = [
      'Focus improvement efforts on projects with scores below 60',
      'Address major severity issues first for maximum impact',
      'Create design patterns based on highest-scoring projects',
      'Establish consistent usability review processes',
      'Consider user testing for projects with high feedback item counts'
    ];

    // Add specific recommendations based on data
    if (majorIssuesPercentage > 30) {
      recommendations.push('Prioritize fixing major usability issues across the portfolio');
    }

    if (avgFeedbackItems > 15) {
      recommendations.push('Implement early usability reviews to reduce feedback volume');
    }

    recommendations.forEach(rec => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(`• ${rec}`, 25, yPosition);
      yPosition += 7;
    });

    const fileName = `project-comparison-report-${currentDate.replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};