import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type RGB = [number, number, number];

export interface HeuristicDatum {
  key: string; // e.g., "H1" or "01"
  name: string; // full heuristic name
  score: number; // 0–100
}

export interface ReportOptions {
  title?: string;
  subtitle?: string;
  project?: string;
  brand?: RGB; // default [237,94,32]
  version?: string;
  logo?: Uint8Array;
  includeLegend?: boolean;
  includeDetails?: boolean;
  includeAiBreakdown?: boolean;
  aiBreakdown?: AiHeuristic[];
}

type AiHeuristic = {
  code: string;
  score: number;
  max_points: number;
  principle: string;
  justification?: string;
  evaluation_focus?: string;
};

type Segment = {
  text: string;
  font: any;
  color: ReturnType<typeof rgb>;
};

type TableCol = {
  label: string;
  width: number;
  align?: "left" | "center" | "right";
};
type TableCell = { text: string; color?: ReturnType<typeof rgb> };

const mm = (n: number) => n * 2.83465;
const rgb255 = (r: number, g: number, b: number) =>
  rgb(r / 255, g / 255, b / 255);

export async function generateHeuristicReportPdfLib(
  data: HeuristicDatum[],
  opts?: ReportOptions,
): Promise<Uint8Array> {
  const brand: RGB = opts?.brand ?? [237, 94, 32];
  const brandRgb = rgb255(...brand);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([mm(210), mm(297)]); // A4 portrait
  const width = page.getWidth();
  const height = page.getHeight();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const drawTextTop = (
    text: string,
    x: number,
    yTop: number,
    size = 12,
    color = rgb(0, 0, 0),
    bold = false,
  ) => {
    const y = height - yTop - size;
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color });
  };

  // Header
  const headerH = mm(18);
  page.drawRectangle({
    x: 0,
    y: height - headerH,
    width,
    height: headerH,
    color: brandRgb,
  });

  // Optional logo
  if (opts?.logo) {
    const logoImg = await pdf.embedPng(opts.logo);
    const desiredH = headerH - mm(6);
    const scale = desiredH / logoImg.height;
    const imgW = logoImg.width * scale;
    const imgH = logoImg.height * scale;
    const imgX = mm(8);
    const imgY = height - headerH + (headerH - imgH) / 2;
    page.drawImage(logoImg, { x: imgX, y: imgY, width: imgW, height: imgH });

    // Shift text right to avoid overlap with logo
    const textStartX = imgX + imgW + mm(6);
    drawTextTop(
      opts?.title ?? "Heuristic Violation Report",
      textStartX,
      mm(6),
      12,
      rgb(1, 1, 1),
      true,
    );
    drawTextTop(
      opts?.subtitle ?? `Generated on: ${new Date().toLocaleDateString()}`,
      textStartX,
      mm(14),
      9,
      rgb(1, 1, 1),
    );
  } else {
    drawTextTop(
      opts?.title ?? "Heuristic Violation Report",
      mm(10),
      mm(6),
      12,
      rgb(1, 1, 1),
      true,
    );
    drawTextTop(
      opts?.subtitle ?? `Generated on: ${new Date().toLocaleDateString()}`,
      mm(10),
      mm(14),
      9,
      rgb(1, 1, 1),
    );
  }

  const proj = opts?.project ?? "UXhibit";
  const ver = opts?.version ?? "";

  const rightSize = 9;

  const rightPiecesTop = [
    { text: "Project Name:", font: fontBold, color: brandRgb },
    { text: `Project Name: ${proj}`, font: font, color: rgb(1, 1, 1) },
  ];
  const yTopRight = mm(6);
  drawRightAlignedTopRow(
    page,
    width,
    height,
    yTopRight,
    rightSize,
    rightPiecesTop,
    font,
    fontBold,
  );

  // Row 2: left side shows Generated on..., right side shows Version (if present)
  const yTopVersion = mm(14);

  if (ver) {
    const rightPiecesVersion = [
      { text: "Version:", font: fontBold, color: brandRgb },
      { text: `Design Version: ${ver}`, font: font, color: rgb(1, 1, 1) },
    ];
    drawRightAlignedTopRow(
      page,
      width,
      height,
      yTopVersion,
      rightSize,
      rightPiecesVersion,
      font,
      fontBold,
    );
  }

  // Intro
  let yTop = mm(18) + mm(12);
  const intro = [
    "This report summarizes how often each usability heuristic is violated.",
    "The radar chart displays normalized scores (0–100).",
    "Use the legend and details to prioritize improvements.",
  ];
  intro.forEach((line) => {
    drawTextTop(line, mm(10), yTop, 12);
    yTop += mm(6);
  });

  // Add here the project name for that matter rather than all here for the record

  // Section title
  drawTextTop(
    "Heuristic Radar Chart",
    mm(10),
    yTop + mm(10),
    14,
    brandRgb,
    true,
  );

  // Radar chart area
  const chartX = mm(20);
  const chartYTop = yTop + mm(16);
  const chartSize = mm(120);
  await drawRadarChart(page, font, data, chartX, chartYTop, chartSize, brand);

  // Legend
  const legendStartY = chartYTop + chartSize + mm(8);
  // Legend (Page 1)
  if (opts?.includeLegend ?? true) {
    const legendStartY = chartYTop + chartSize + mm(8);
    drawLegend(page, font, data, legendStartY);
  }
  // Page 2: either classic details OR AI breakdown
  if (opts?.includeAiBreakdown && opts.aiBreakdown?.length) {
    const page2 = pdf.addPage([mm(210), mm(297)]);
    const width2 = page2.getWidth();
    const height2 = page2.getHeight();

    // Header (reuse style from page 1)
    page2.drawRectangle({
      x: 0,
      y: height2 - headerH,
      width: width2,
      height: headerH,
      color: brandRgb,
    });
    if (opts?.logo) {
      const logoImg2 = await pdf.embedPng(opts.logo);
      const desiredH2 = headerH - mm(6);
      const scale2 = desiredH2 / logoImg2.height;
      const imgW2 = logoImg2.width * scale2;
      const imgH2 = logoImg2.height * scale2;
      const imgX2 = mm(8);
      const imgY2 = height2 - headerH + (headerH - imgH2) / 2;
      page2.drawImage(logoImg2, {
        x: imgX2,
        y: imgY2,
        width: imgW2,
        height: imgH2,
      });

      const textStartX2 = imgX2 + imgW2 + mm(6);
      drawText(
        page2,
        fontBold,
        opts?.title ?? "Heuristic Violation Report",
        textStartX2,
        height2 - mm(6) - 12,
        12,
        rgb(1, 1, 1),
      );
      drawText(
        page2,
        font,
        opts?.subtitle ?? `Generated on: ${new Date().toLocaleDateString()}`,
        textStartX2,
        height2 - mm(14) - 9,
        9,
        rgb(1, 1, 1),
      );
    } else {
      drawText(
        page2,
        fontBold,
        opts?.title ?? "Heuristic Violation Report",
        mm(10),
        height2 - mm(6) - 12,
        12,
        rgb(1, 1, 1),
      );
      drawText(
        page2,
        font,
        opts?.subtitle ?? `Generated on: ${new Date().toLocaleDateString()}`,
        mm(10),
        height2 - mm(14) - 9,
        9,
        rgb(1, 1, 1),
      );
    }

    // Separator under header
    page2.drawLine({
      start: { x: 0, y: height2 - headerH - 1 },
      end: { x: width2, y: height2 - headerH - 1 },
      color: rgb(0.9, 0.9, 0.9),
      thickness: 0.6,
    });

    // Title bar
    const startY = height2 - (mm(18) + mm(27) + 8);
    page2.drawRectangle({
      x: mm(10),
      y: startY,
      width: width2 - mm(20),
      height: 8,
      color: brandRgb,
    });
    drawText(
      page2,
      fontBold,
      "AI Heuristic Breakdown",
      mm(12),
      startY + 1.5,
      10,
      rgb(1, 1, 1),
    );

    // Table
    const cols: TableCol[] = [
      { label: "#", width: mm(10), align: "left" },
      { label: "Code", width: mm(18), align: "left" },
      { label: "Principle", width: mm(54), align: "left" },
      { label: "Score", width: mm(20), align: "right" },
      { label: "Normalized", width: mm(26), align: "right" },
      {
        label: "Focus",
        width:
          width2 - mm(10) * 2 - (mm(10) + mm(18) + mm(54) + mm(20) + mm(26)),
        align: "left",
      },
    ];

    const rows = opts.aiBreakdown.map((h, i) => {
      const normalized = Math.round((h.score / h.max_points) * 100);
      return [
        { text: `${i + 1}` },
        { text: h.code },
        { text: h.principle },
        { text: `${h.score} / ${h.max_points}` },
        { text: `${normalized}%` },
        { text: h.evaluation_focus ?? h.justification ?? "" },
      ];
    });

    drawTable(
      page2,
      font,
      mm(10),
      startY - 10,
      12,
      cols,
      rgb(0.93, 0.93, 0.95),
      rows,
    );
    drawFooter(page2, font, "Page 2");
  } else if (opts?.includeDetails) {
    // If you still want the classic details table:
    // 1) Add page2 + header (same as above),
    // 2) Paste your previous table header/rows drawing code here,
    // 3) Call drawFooter(page2, font, 'Page 2');
  }

  return await pdf.save();
}

function drawText(
  page: any,
  font: any,
  text: string,
  x: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawText(text, { x, y, size, font, color });
}

async function drawRadarChart(
  page: any,
  font: any,
  data: HeuristicDatum[],
  x: number,
  yTop: number,
  size: number,
  brand: RGB,
) {
  const width = page.getWidth();
  const height = page.getHeight();
  const cx = x + size / 2;
  const cy = height - (yTop + size / 2); // convert from top to bottom-left coords
  const rMax = size / 2 - mm(10);

  const rings = 5;
  const grid = rgb255(210, 210, 210);
  const axis = rgb255(160, 160, 160);
  const stroke = rgb255(...brand);
  const fill = rgb255(255, 210, 190);
  const labelColor = stroke;

  // grid circles
  for (let i = 1; i <= rings; i++) {
    const r = (rMax * i) / rings;
    page.drawCircle({
      x: cx,
      y: cy,
      size: r,
      borderColor: grid,
      borderWidth: 0.5,
    });
  }

  const angles = data.map(
    (_, idx) => (idx * 2 * Math.PI) / data.length - Math.PI / 2,
  );

  // axes
  angles.forEach((ang) => {
    const ex = cx + rMax * Math.cos(ang);
    const ey = cy + rMax * Math.sin(ang);
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: ex, y: ey },
      color: axis,
      thickness: 0.6,
    });
  });

  // axis labels (keys)
  angles.forEach((ang, i) => {
    const lx = cx + (rMax + mm(4)) * Math.cos(ang);
    const ly = cy + (rMax + mm(4)) * Math.sin(ang);
    const text = data[i].key;
    const tw = font.widthOfTextAtSize(text, 8);
    page.drawRectangle({
      x: lx - tw / 2 - 2,
      y: ly - 3,
      width: tw + 4,
      height: 7,
      color: rgb(1, 1, 1),
    });
    page.drawText(text, {
      x: lx - tw / 2,
      y: ly - 2,
      size: 8,
      font,
      color: labelColor,
    });
  });

  // scale labels (top axis)
  for (let i = 1; i <= rings; i++) {
    const r = (rMax * i) / rings;
    const pct = Math.round((i / rings) * 100).toString();
    const tw = font.widthOfTextAtSize(pct, 7) + 4;
    const tx = cx - tw / 2;
    const ty = cy + r + 2; // slightly above circle (remember bottom-left coords)
    page.drawRectangle({
      x: tx,
      y: ty,
      width: tw,
      height: 6,
      color: rgb(1, 1, 1),
    });
    page.drawText(pct, {
      x: tx + 2,
      y: ty + 1,
      size: 7,
      font,
      color: rgb255(100, 100, 100),
    });
  }

  // points
  const clamped = (v: number) => Math.max(0, Math.min(100, v));
  const pts = data.map((d, i) => {
    const dist = (clamped(d.score) / 100) * rMax;
    return [
      cx + dist * Math.cos(angles[i]),
      cy + dist * Math.sin(angles[i]),
    ] as [number, number];
  });

  // polygon fill + stroke
  if (pts.length >= 3) {
    const path =
      `M ${pts[0][0]} ${pts[0][1]} ` +
      pts
        .slice(1)
        .map(([px, py]) => `L ${px} ${py}`)
        .join(" ") +
      " Z";

    page.drawSvgPath(path, {
      color: fill,
      borderColor: stroke,
      borderWidth: 1,
      opacity: 1,
    });
  } else if (pts.length === 0) {
    const msg = "No heuristic data available.";
    const tw = font.widthOfTextAtSize(msg, 9);
    page.drawText(msg, {
      x: cx - tw / 2,
      y: cy - 4,
      size: 9,
      font,
      color: rgb255(120, 120, 120),
    });
  }

  // markers + values
  pts.forEach((p, i) => {
    page.drawCircle({ x: p[0], y: p[1], size: 2.2, color: stroke });
    const v = `${data[i].score}`;
    const tw = font.widthOfTextAtSize(v, 7);
    page.drawRectangle({
      x: p[0] - 2,
      y: p[1] + 2,
      width: tw + 6,
      height: 7,
      color: rgb(1, 1, 1),
    });
    page.drawText(v, {
      x: p[0] + 1,
      y: p[1] + 3,
      size: 7,
      font,
      color: stroke,
    });
  });
}

function fitTextToWidth(
  font: any,
  text: string,
  size: number,
  maxWidth: number,
) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const ellipsis = "…";
  let base = text;
  while (
    base.length > 1 &&
    font.widthOfTextAtSize(base + ellipsis, size) > maxWidth
  ) {
    base = base.slice(0, -1);
  }
  return base + ellipsis;
}

function drawLegend(
  page: any,
  font: any,
  data: HeuristicDatum[],
  legendTop: number,
) {
  const width = page.getWidth();
  const height = page.getHeight();

  // Layout constants
  const marginX = mm(10);
  const rowH = 12;
  const headerH = 10;

  // Fixed widths for middle and right columns
  const midW = mm(40); // "Score: NN"
  const rightW = mm(36); // "(Minor|Medium|Major)"
  const leftW = width - marginX * 2 - midW - rightW;

  // Column x positions
  const leftX = marginX;
  const midX = leftX + leftW;
  const rightX = midX + midW;

  // Colors
  const headerBg = rgb(0.93, 0.93, 0.95);
  const rowAltBg = rgb(0.98, 0.98, 0.99);
  const textColor = rgb(0, 0, 0);

  // Severity helpers
  const sevLabel = (v: number) =>
    v <= 20 ? "Minor" : v <= 40 ? "Medium" : "Major";
  const sevRgb = (v: number) =>
    v <= 20 ? rgb(0, 0.5, 0) : v <= 40 ? rgb(1, 0.65, 0) : rgb(1, 0, 0);

  // Compute starting y in PDF-lib’s bottom-left coordinate space
  let y = height - legendTop - headerH; // header baseline

  // Header background and labels
  page.drawRectangle({
    x: marginX,
    y,
    width: width - marginX * 2,
    height: headerH,
    color: headerBg,
  });
  page.drawText("Heuristic", {
    x: leftX + 2,
    y: y + 2,
    size: 9,
    font,
    color: textColor,
  });
  page.drawText("Score", {
    x: midX + midW / 2 - font.widthOfTextAtSize("Score", 9) / 2,
    y: y + 2,
    size: 9,
    font,
    color: textColor,
  });
  page.drawText("Severity", {
    x: rightX + rightW - font.widthOfTextAtSize("Severity", 9) - 2,
    y: y + 2,
    size: 9,
    font,
    color: textColor,
  });

  // Move to first row
  y -= rowH;

  data.forEach((d, idx) => {
    // Stop if we’re near the page bottom
    if (y < mm(12)) return;

    // Alternating row background
    if (idx % 2 === 0) {
      page.drawRectangle({
        x: marginX,
        y,
        width: width - marginX * 2,
        height: rowH,
        color: rowAltBg,
      });
    }

    // Left cell: "Hxx. Full Name" ellipsized to fit
    const leftText = `${d.key.replace(/^H?/, "H")}. ${d.name}`;
    const fittedLeft = fitTextToWidth(font, leftText, 9, leftW - 4);
    page.drawText(fittedLeft, {
      x: leftX + 2,
      y: y + 2,
      size: 9,
      font,
      color: textColor,
    });

    // Middle cell: "Score: NN", centered
    const midText = `Score: ${d.score}`;
    const midTw = font.widthOfTextAtSize(midText, 9);
    page.drawText(midText, {
      x: midX + midW / 2 - midTw / 2,
      y: y + 2,
      size: 9,
      font,
      color: textColor,
    });

    // Right cell: "(Severity)", right-aligned and color-coded
    const rightText = `(${sevLabel(d.score)})`;
    const rightTw = font.widthOfTextAtSize(rightText, 9);
    page.drawText(rightText, {
      x: rightX + rightW - rightTw - 2,
      y: y + 2,
      size: 9,
      font,
      color: sevRgb(d.score),
    });

    // Next row
    y -= rowH;
  });

  // Optional column separators for clarity
  page.drawLine({
    start: { x: midX, y: height - legendTop - headerH },
    end: { x: midX, y },
    color: rgb(0.85, 0.85, 0.9),
    thickness: 0.5,
  });
  page.drawLine({
    start: { x: rightX, y: height - legendTop - headerH },
    end: { x: rightX, y },
    color: rgb(0.85, 0.85, 0.9),
    thickness: 0.5,
  });
}

function drawFooter(page: any, font: any, label: string) {
  const w = page.getWidth();
  const footerY = mm(10);
  const labelW = font.widthOfTextAtSize(label, 9);

  // separator line above footer
  page.drawLine({
    start: { x: mm(10), y: footerY + 12 },
    end: { x: w - mm(10), y: footerY + 12 },
    color: rgb(0.9, 0.9, 0.9),
    thickness: 0.6,
  });

  // page number bottom-right
  page.drawText(label, {
    x: w - mm(10) - labelW,
    y: footerY,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
}

function drawTextTop(
  page: any,
  font: any,
  fontBold: any,
  pageHeight: number,
  text: string,
  x: number,
  yTop: number,
  size = 12,
  color = rgb(0, 0, 0),
  bold = false,
) {
  const y = pageHeight - yTop - size;
  page.drawText(text, { x, y, size, font: bold ? fontBold : font, color });
}

// Right-aligned text using top-based y (works with drawTextTop on page 1)
function drawRightAlignedTopRow(
  page: any,
  pageWidth: number,
  pageHeight: number,
  yTop: number,
  size: number,
  segments: Segment[],
  font: any,
  fontBold: any,
) {
  const totalW = segments.reduce(
    (w, s) => w + s.font.widthOfTextAtSize(s.text, size),
    0,
  );
  let x = pageWidth - mm(10) - totalW;
  segments.forEach((s) => {
    const segW = s.font.widthOfTextAtSize(s.text, size);
    drawTextTop(
      page,
      font,
      fontBold,
      pageHeight,
      s.text,
      x,
      yTop,
      size,
      s.color,
      s.font === fontBold,
    );
    x += segW;
  });
}

// Right-aligned text using absolute y (page2 etc.)
function drawRightAlignedAbs(
  page: any,
  pageWidth: number,
  yAbs: number,
  size: number,
  segments: Segment[],
) {
  const totalW = segments.reduce(
    (w, s) => w + s.font.widthOfTextAtSize(s.text, size),
    0,
  );
  let x = pageWidth - mm(10) - totalW;
  segments.forEach((s) => {
    const segW = s.font.widthOfTextAtSize(s.text, size);
    page.drawText(s.text, { x, y: yAbs, size, font: s.font, color: s.color });
    x += segW;
  });
}

function drawTable(
  page: any,
  font: any,
  startX: number,
  startY: number, // absolute y
  rowH: number,
  cols: TableCol[],
  headerBg: ReturnType<typeof rgb>,
  rows: TableCell[][],
) {
  const totalW = cols.reduce((a, c) => a + c.width, 0);
  // Header
  page.drawRectangle({
    x: startX,
    y: startY,
    width: totalW,
    height: rowH,
    color: headerBg,
  });
  let cx = startX;
  cols.forEach((c) => {
    const tw = font.widthOfTextAtSize(c.label, 9);
    const tx =
      c.align === "center"
        ? cx + c.width / 2 - tw / 2
        : c.align === "right"
          ? cx + c.width - tw - 2
          : cx + 2;
    page.drawText(c.label, {
      x: tx,
      y: startY + 2,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
    cx += c.width;
  });
  // Rows
  let y = startY - rowH;
  rows.forEach((r, i) => {
    let x = startX;
    r.forEach((cell, j) => {
      const tw = font.widthOfTextAtSize(cell.text, 9);
      const align = cols[j].align ?? "left";
      const tx =
        align === "center"
          ? x + cols[j].width / 2 - tw / 2
          : align === "right"
            ? x + cols[j].width - tw - 2
            : x + 2;
      page.drawText(cell.text, {
        x: tx,
        y: y + 2,
        size: 9,
        font,
        color: cell.color ?? rgb(0, 0, 0),
      });
      x += cols[j].width;
    });
    y -= rowH;
  });
  return y; // next y
}

export function toAiBreakdown(input: any): AiHeuristic[] {
  const arr = input?.ai?.heuristic_breakdown ?? [];
  return arr.map((h: any) => ({
    code: h.code,
    score: Number(h.score),
    max_points: Number(h.max_points ?? 4),
    principle: h.principle,
    justification: h.justification,
    evaluation_focus: h.evaluation_focus,
  }));
}
