import jsPDF from 'jspdf';

type RGB = [number, number, number];

export interface HeuristicDatum {
  key: string;      // short label (e.g., "H1")
  name: string;     // full name (e.g., "Visibility of system status")
  score: number;    // 0–100
}

export interface ReportHeader {
  title: string;
  subtitle?: string;
  project?: string;
  color?: RGB;
  height?: number;
  showPageNum?: boolean;
}

export interface RadarOptions {
  rings?: number;
  pointRadius?: number;
  gridColor?: RGB;
  axisColor?: RGB;
  strokeColor?: RGB;
  fillColor?: RGB;
  labelColor?: RGB;
  showScaleLabels?: boolean;
}

export interface ReportOptions {
  header?: ReportHeader;
  radar?: RadarOptions;
  fileName?: string;
}

const defaultBrand: RGB = [237, 94, 32];

const drawHeader = (pdf: jsPDF, cfg: ReportHeader) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const color = cfg.color ?? defaultBrand;
  const h = cfg.height ?? 18;
  const showNum = cfg.showPageNum ?? true;

  pdf.setFillColor(color[0], color[1], color[2]);
  pdf.rect(0, 0, pageWidth, h, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text(cfg.title, 10, h / 2 + 3);

  if (cfg.subtitle) {
    pdf.setFontSize(9);
    pdf.text(cfg.subtitle, 10, h - 4);
  }

  const pageNum = pdf.getNumberOfPages();
  pdf.setFontSize(9);
  if (cfg.project) {
    pdf.text(cfg.project, pageWidth - 10, h / 2 + 3, { align: 'right' });
  }
  if (showNum) {
    pdf.text(`Page ${pageNum}`, pageWidth - 10, h - 4, { align: 'right' });
  }

  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(0.3);
  pdf.line(0, h + 0.5, pageWidth, h + 0.5);
};

const drawRadarChart = (
  pdf: jsPDF,
  data: HeuristicDatum[],
  x: number,
  y: number,
  size: number,
  opt?: RadarOptions
) => {
  const rings = opt?.rings ?? 5;
  const axisColor: RGB = opt?.axisColor ?? [160, 160, 160];
  const gridColor: RGB = opt?.gridColor ?? [210, 210, 210];
  const strokeColor: RGB = opt?.strokeColor ?? defaultBrand;
  const fillColor: RGB = opt?.fillColor ?? [255, 210, 190];
  const labelColor: RGB = opt?.labelColor ?? defaultBrand;
  const pointRadius = opt?.pointRadius ?? 2.4;
  const showScaleLabels = opt?.showScaleLabels ?? true;

  const cx = x + size / 2;
  const cy = y + size / 2;
  const rMax = size / 2 - 18;

  pdf.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  pdf.setLineWidth(0.25);
  for (let i = 1; i <= rings; i++) {
    const r = (rMax * i) / rings;
    pdf.circle(cx, cy, r, 'S');
  }

  const angles = data.map((_, idx) => (idx * 2 * Math.PI) / data.length - Math.PI / 2);

  pdf.setDrawColor(axisColor[0], axisColor[1], axisColor[2]);
  pdf.setLineWidth(0.3);
  angles.forEach((angle) => {
    const ax = cx + rMax * Math.cos(angle);
    const ay = cy + rMax * Math.sin(angle);
    pdf.line(cx, cy, ax, ay);
  });

  angles.forEach((angle, index) => {
    const lx = cx + (rMax + 10) * Math.cos(angle);
    const ly = cy + (rMax + 10) * Math.sin(angle);
    const text = data[index].key;
    const tw = pdf.getTextWidth(text);

    pdf.setFillColor(255, 255, 255);
    pdf.rect(lx - tw / 2 - 2, ly - 4, tw + 4, 7, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    pdf.text(text, lx, ly + 2, { align: 'center' });
  });

  if (showScaleLabels) {
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    for (let i = 1; i <= rings; i++) {
      const r = (rMax * i) / rings;
      const pct = Math.round((i / rings) * 100);
      const label = `${pct}`;
      const w = pdf.getTextWidth(label) + 4;
      const tx = cx;
      const ty = cy - r;
      pdf.setFillColor(255, 255, 255);
      pdf.rect(tx - w / 2, ty - 6, w, 6, 'F');
      pdf.text(label, tx, ty - 2, { align: 'center' });
    }
  }

  const points: [number, number][] = data.map((d, i) => {
    const dist = (Math.max(0, Math.min(100, d.score)) / 100) * rMax;
    return [cx + dist * Math.cos(angles[i]), cy + dist * Math.sin(angles[i])];
  });

  if (points.length >= 3) {
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
    pdf.setLineWidth(0.8);

    const start = points[0];
    const rels: [number, number][] = [];
    for (let i = 1; i < points.length; i++) {
      rels.push([points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]]);
    }
    rels.push([start[0] - points[points.length - 1][0], start[1] - points[points.length - 1][1]]);
    pdf.lines(rels, start[0], start[1], 1, 'F', true);
    pdf.lines(rels, start[0], start[1], 1, 'S', true);
  } else if (points.length === 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text('No heuristic data available.', cx, cy, { align: 'center' });
  }

  pdf.setFillColor(strokeColor[0], strokeColor[1], strokeColor[2]);
  pdf.setTextColor(strokeColor[0], strokeColor[1], strokeColor[2]);
  pdf.setFontSize(7);
  points.forEach((p, i) => {
    pdf.circle(p[0], p[1], pointRadius, 'F');
    const v = `${data[i].score}`;
    const tw = pdf.getTextWidth(v);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(p[0] - 2, p[1] - 7, tw + 6, 7, 'F');
    pdf.text(v, p[0] + 1, p[1] - 2);
  });
};

export const generateHeuristicReport = async (
  input: HeuristicDatum[],
  options?: ReportOptions
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const header: ReportHeader = {
    title: options?.header?.title ?? 'Heuristic Violation Report',
    subtitle: options?.header?.subtitle ?? `Generated on: ${new Date().toLocaleDateString()}`,
    project: options?.header?.project ?? 'UXhibit',
    color: options?.header?.color ?? defaultBrand,
    height: options?.header?.height ?? 18,
    showPageNum: options?.header?.showPageNum ?? true,
  };

  drawHeader(pdf, header);

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  const introY = (header.height ?? 18) + 12;
  const intro = [
    'This report summarizes how often each usability heuristic is violated.',
    'The radar chart displays normalized scores (0–100).',
    'Use the legend and details to prioritize improvements.',
  ];
  let y = introY;
  intro.forEach((line) => {
    pdf.text(line, 10, y);
    y += 6;
  });

  pdf.setFontSize(14);
  const bc = header.color ?? defaultBrand;
  pdf.setTextColor(bc[0], bc[1], bc[2]);
  pdf.text('Heuristic Radar Chart', 10, y + 10);

  drawRadarChart(pdf, input, 20, y + 16, 120, {
    rings: options?.radar?.rings ?? 5,
    pointRadius: options?.radar?.pointRadius ?? 2.4,
    gridColor: options?.radar?.gridColor ?? [210, 210, 210],
    axisColor: options?.radar?.axisColor ?? [160, 160, 160],
    strokeColor: options?.radar?.strokeColor ?? bc,
    fillColor: options?.radar?.fillColor ?? [255, 210, 190],
    labelColor: options?.radar?.labelColor ?? bc,
    showScaleLabels: options?.radar?.showScaleLabels ?? true,
  });

  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  const legendStartY = y + 16 + 120 + 8;
  const severityLabel = (v: number) => (v <= 20 ? 'Minor' : v <= 40 ? 'Medium' : 'Major');
  const severityColor = (v: number): RGB => (v <= 20 ? [0, 128, 0] : v <= 40 ? [255, 165, 0] : [255, 0, 0]);
  input.forEach((item, idx) => {
    const ly = legendStartY + idx * 6;
    if (ly < 285) {
      const sev = severityLabel(item.score);
      const col = severityColor(item.score);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${item.key}. ${item.name}`, 10, ly);
      pdf.text(`Score: ${item.score}`, pageWidth / 2, ly, { align: 'center' });
      pdf.setTextColor(col[0], col[1], col[2]);
      pdf.text(`(${sev})`, pageWidth - 10, ly, { align: 'right' });
    }
  });

  pdf.addPage();
  drawHeader(pdf, header);

  pdf.setFontSize(16);
  pdf.setTextColor(bc[0], bc[1], bc[2]);
  pdf.text('Detailed Heuristics', 10, (header.height ?? 18) + 12);

  const thY = (header.height ?? 18) + 27;
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(bc[0], bc[1], bc[2]);
  pdf.rect(10, thY, pageWidth - 20, 8, 'F');
  pdf.text('#', 12, thY + 6);
  pdf.text('Heuristic', 25, thY + 6);
  pdf.text('Score', pageWidth - 40, thY + 6);
  pdf.text('Severity', pageWidth - 20, thY + 6);

  let rowY = thY + 10;
  input.forEach((item, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(248, 249, 250);
      pdf.rect(10, rowY - 3, pageWidth - 20, 7, 'F');
    }
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.key, 12, rowY + 2);
    const wrapped = pdf.splitTextToSize(item.name, pageWidth - 70);
    pdf.text(wrapped, 25, rowY + 2);
    pdf.text(`${item.score}`, pageWidth - 40, rowY + 2);
    const sev = severityLabel(item.score);
    const col = sev === 'Minor' ? [0, 128, 0] : sev === 'Medium' ? [255, 165, 0] : [255, 0, 0];
    pdf.setTextColor(col[0], col[1], col[2]);
    pdf.text(sev, pageWidth - 20, rowY + 2);
    rowY += Math.max(8, wrapped.length * 4);
  });

  pdf.addPage();
  drawHeader(pdf, header);

  pdf.setFontSize(16);
  pdf.setTextColor(bc[0], bc[1], bc[2]);
  pdf.text('Recommendations', 10, (header.height ?? 18) + 12);

  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  const recY = (header.height ?? 18) + 26;
  const recs = [
    '1. Address high-severity heuristics first.',
    '2. Review recurring violation patterns across projects.',
    '3. Strengthen design system standards for common issues.',
    '4. Validate changes via targeted user testing.',
    '5. Schedule periodic heuristic evaluations.',
  ];
  let ry = recY;
  recs.forEach((line) => {
    pdf.text(line, 10, ry);
    ry += 7;
  });

  pdf.setFontSize(14);
  pdf.setTextColor(bc[0], bc[1], bc[2]);
  pdf.text('Priority Areas:', 10, ry + 8);

  ry += 18;
  const priority = [...input].filter((d) => d.score > 40).sort((a, b) => b.score - a.score);
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  if (priority.length) {
    priority.forEach((d) => {
      pdf.text(`• ${d.name} (Score: ${d.score})`, 15, ry);
      ry += 6;
    });
  } else {
    pdf.text('• No major priority areas identified.', 15, ry);
  }

  const fileName =
    options?.fileName ??
    `heuristic-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
  pdf.save(fileName);
  return true;
};